# Manual — Correos de estreno (notificación `nuevo_contenido`)

Documenta el mecanismo que dispara el correo `nuevo_contenido` cuando un título
llega a su `fecha_estreno`. Antes la plantilla existía en notification-service
pero nada la activaba; ahora un CronJob standalone la encola periódicamente.

## Problema

La plantilla `nuevo_contenido`
(`backend/notification-service/src/notifications/templates.ts`) ya estaba lista,
pero ningún componente la disparaba: un título programado a futuro llegaba a su
`fecha_estreno` y **nunca** generaba el correo de "nuevo contenido".

## Solución (no invasiva, patrón Outbox)

Un **CronJob nuevo** (`k8s/cronjobs/estreno-notify-cronjob.yaml`) ejecuta de forma
periódica un Job ligero (`k8s/cronjobs/estreno-notify/`) que:

1. **Detecta estrenos pendientes** en `catalog-db`: títulos `activo`, con
   `fecha_estreno <= now()` y `notificado_estreno = FALSE`.
2. **Obtiene la audiencia** desde `auth-db`: usuarios con `estado = 'activo'`.
3. **Encola** el correo por gRPC a notification-service
   (`NotificationService.EncolarCorreo`, package `notification.v1`) con
   `tipo = "nuevo_contenido"` y `datos = {titulo}` — exactamente el mismo patrón
   que billing-service
   (`backend/billing-service/src/notifications/notification.client.ts`). La
   llamada solo **encola** en `buzon_salida`; el worker de notification-service
   hace el envío SMTP real y renderiza la plantilla.
4. **Marca** `notificado_estreno = TRUE` en `catalog-db` **solo si** el encolado
   del título fue completo.

No se toca el esquema de otros servicios, ni `03_views.sql`, ni los audit SQL, ni
catalog-service. No se escribe en `notification-db` directamente: todo pasa por la
API gRPC del servicio, como el resto de microservicios.

## Idempotencia

La garantía de "un estreno se notifica una sola vez" vive en la columna nueva de
`database/catalog/01_schema.sql`:

```sql
notificado_estreno BOOLEAN NOT NULL DEFAULT FALSE
```

- El Job solo procesa títulos con el flag en `FALSE`.
- El flag pasa a `TRUE` **únicamente** cuando todos los correos del título se
  encolaron sin error. Si alguno falla, el título queda pendiente y el siguiente
  ciclo lo reintenta (no hay correos perdidos ni duplicados de un ciclo a otro).

Índice parcial que sirve la consulta (mismo patrón que `idx_buzon_pendientes`):

```sql
CREATE INDEX idx_contenido_estrenos_pendientes
    ON contenido (fecha_estreno)
    WHERE activo AND NOT notificado_estreno;
```

## Flujo

```
CronJob estreno-notify (cada 10 min)
  └─ Job: notificar_estrenos.py
       ├─ catalog-db  : SELECT estrenos pendientes (fecha_estreno<=now, !notificado)
       ├─ auth-db     : SELECT usuarios activos (email)
       ├─ notification-service (gRPC EncolarCorreo, tipo=nuevo_contenido) ──┐
       │                                                                    │
       │   notification-service ── INSERT buzon_salida (Outbox)             │
       │        └─ worker ── render plantilla nuevo_contenido ── SMTP ──────┘
       └─ catalog-db  : UPDATE contenido SET notificado_estreno=TRUE  (si OK)
```

## Conectividad y credenciales

- BD por los Services internos `catalog-db:5432` y `auth-db:5432`, que vía
  Endpoints enrutan a la VM de BD externa (`10.10.0.10`) — misma persistencia
  aislada de la tarea de infraestructura.
- Destino gRPC `notification-service:50054` desde el ConfigMap `quetxal-config`
  (clave `NOTIFICATION_SERVICE_ADDR`).
- Credenciales desde el Secret `quetxal-secrets` (variables `*_DB_*`). Nada
  hardcodeado; mismo patrón que `k8s/cronjobs/depuracion-cuentas.yaml`.

## Cadencia y operación

- Schedule: `*/10 * * * *` (cada 10 min, `timeZone: America/Guatemala`). La
  latencia máxima entre `fecha_estreno` y el encolado es < 10 min.
- `concurrencyPolicy: Forbid` evita solapamientos.
- Ensayo sin envío (solo cuenta pendientes): poner `DRY_RUN="true"` en el CronJob.
- Disparo manual inmediato para demo:

  ```bash
  kubectl create job -n quetxal-tv-prod --from=cronjob/estreno-notify estreno-manual
  kubectl logs -n quetxal-tv-prod job/estreno-manual
  ```

## Build de la imagen

Los stubs gRPC de Python se generan en build a partir de `notification.proto`
(copiado de notification-service), fijando el contrato dentro de la imagen:

```bash
cd k8s/cronjobs/estreno-notify/
docker build -t tu-registro/quetxal-estreno-notify:latest .
```

## Archivos

| Archivo | Rol |
|---------|-----|
| `database/catalog/01_schema.sql` | Columna `notificado_estreno` + índice parcial (único existente modificado) |
| `k8s/cronjobs/estreno-notify-cronjob.yaml` | CronJob (schedule, env, secrets, recursos) |
| `k8s/cronjobs/estreno-notify/notificar_estrenos.py` | Orquestador: SQL (catalog/auth) + gRPC EncolarCorreo |
| `k8s/cronjobs/estreno-notify/notification.proto` | Contrato gRPC (copia del de notification-service) |
| `k8s/cronjobs/estreno-notify/Dockerfile` | Imagen Python 3.12-slim; genera stubs y corre como no-root |

## Diagramas a actualizar (en Drive)

- **Diagrama de despliegue (4+1, vista física):** agregar el CronJob
  `estreno-notify` en el namespace `quetxal-tv-prod`, junto a los CronJobs
  existentes (`depuracion-cuentas`, `refresh-cartelera`), con sus aristas a
  `catalog-db`, `auth-db` y `notification-service`.
- **Diagrama de flujo / secuencia de notificaciones:** añadir el origen "estreno
  programado" → CronJob → `EncolarCorreo` → `buzon_salida` (Outbox) → worker →
  SMTP, para que el correo `nuevo_contenido` aparezca como evento disparable
  (hoy solo figuran `registro` y `recibo`).
