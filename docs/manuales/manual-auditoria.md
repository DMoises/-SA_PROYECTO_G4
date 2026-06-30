# Manual de auditoría transaccional

Documenta el mecanismo de auditoría a nivel de base de datos: qué se audita, cómo
se registra el usuario responsable y los cambios introducidos para auditar `DELETE`.

## Qué se audita

Cada base de datos del sistema (`auth`, `catalog`, `fx`, `history`, `notification`,
`rating`, `subscription`) tiene una tabla `auditoria_transaccional` y una función de
trigger `trg_fn_auditar_transaccion()` que registra toda escritura sobre las tablas
sensibles.

```
auditoria_transaccional(
    id, usuario_responsable, fecha_exacta, tabla_afectada,
    estado_anterior JSONB, estado_nuevo JSONB
)
```

| Operación | estado_anterior     | estado_nuevo        |
|-----------|---------------------|---------------------|
| INSERT    | NULL                | `to_jsonb(NEW)`     |
| UPDATE    | `to_jsonb(OLD)`     | `to_jsonb(NEW)`     |
| DELETE    | `to_jsonb(OLD)`     | NULL                |

## Cambio 1 — auditar DELETE

Antes los triggers solo cubrían `AFTER INSERT OR UPDATE`, por lo que los borrados
no dejaban rastro. Ahora todos los triggers son `AFTER INSERT OR UPDATE OR DELETE` y
la función maneja el caso `DELETE`:

- `estado_anterior = to_jsonb(OLD)`, `estado_nuevo = NULL`.
- En `DELETE` no existe `NEW`; el trigger `AFTER` devuelve `OLD` (el valor de retorno
  se ignora en triggers `AFTER`, pero `RETURN NEW` provocaría un `NULL` indeseado).

Archivos: los 7 `database/*/0*_audit.sql`.

## Cambio 2 — registrar el usuario real (no el rol de BD)

El `usuario_responsable` se toma de `current_setting('app.current_user', true)`. Si la
variable no está seteada, cae a `session_user` (el rol de conexión de PostgreSQL, p. ej.
`catalog_user`), que no identifica al usuario final.

Los servicios `auth` (Go), `billing` (TS), `rating` (Python) y `history` (Go) ya
seteaban `app.current_user`. Se replicó el patrón en los que faltaban:

- **catalog-service** (Python): `db.py` ahora acepta `current_user` en `execute` /
  `execute_returning` y lo aplica con `SET LOCAL` (`set_config(..., true)`) dentro de la
  misma transacción. `admin_repository.py` propaga el usuario a cada escritura (cada
  `execute` corre en su propia transacción del pool, así que `SET LOCAL` debe repetirse).
  `admin_handler_http.py` obtiene el usuario del JWT (`Authorization: Bearer`) o, en su
  defecto, del header `X-Usuario-Id`.
- **fx-service** (Python): `db.py` gana un método `execute(sql, params, current_user)`
  transaccional (antes solo había lectura con autocommit), listo para registrar el
  usuario en cualquier escritura sobre `monedas` / `tipos_cambio`.
- **notification-service** (TS): `database.service.ts` expone `getClient()` y
  `notifications.repository.ts` envuelve `encolar` / `marcarEnviado` / `marcarFallido`
  en `BEGIN` + `set_config('app.current_user', $1, true)` + `COMMIT`. El usuario es el
  dueño del correo (`usuario_id` de la fila del buzón).

> Nota operativa: el `api-gateway` aún no reenvía el identificador del admin al HTTP
> interno de catalog (solo reenvía `Content-Type`). Mientras eso no se agregue, las
> escrituras del panel admin de catálogo caen a `session_user`. El catalog-service ya
> está listo para usarlo en cuanto el gateway propague `Authorization` o `X-Usuario-Id`.
> El gateway queda fuera del alcance de esta tarea.

## SET LOCAL vs alcance de transacción

`set_config('app.current_user', <valor>, true)` usa `is_local = true`: el valor solo vive
hasta el `COMMIT`/`ROLLBACK` de la transacción actual, evitando fugas entre conexiones
reutilizadas del pool. Por eso cada operación de escritura debe setearlo de nuevo.
