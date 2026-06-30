#!/usr/bin/env python3
"""
TAREA 3 — Correos de estreno (mecanismo STANDALONE)
===================================================

Job periódico (lanzado por k8s/cronjobs/estreno-notify-cronjob.yaml) que:

  1. Lee de catalog-db los títulos cuya `fecha_estreno` ya pasó, siguen
     `activo` y todavía NO han sido notificados (`notificado_estreno = FALSE`).
  2. Lee de auth-db los correos de los usuarios `activo` (audiencia de la
     difusión "nuevo contenido").
  3. Por cada (usuario, estreno) llama por gRPC a notification-service
     (`NotificationService.EncolarCorreo`, package notification.v1) con
     `tipo = "nuevo_contenido"` y `datos = {titulo}` — exactamente el mismo
     patrón Outbox que usa billing-service
     (backend/billing-service/src/notifications/notification.client.ts):
     la llamada solo ENCOLA en buzon_salida; el worker de notification-service
     hace el envío SMTP real y renderiza la plantilla `nuevo_contenido`
     (backend/notification-service/src/notifications/templates.ts).
  4. Solo si el encolado de un título terminó sin errores, marca ese título
     como `notificado_estreno = TRUE` en catalog-db. Esa bandera es la garantía
     de idempotencia: un mismo estreno nunca se notifica dos veces, aunque el
     CronJob corra cada pocos minutos.

Diseño deliberado:
  - NO toca el esquema ni el código de catalog-service; solo lee/actualiza la
    columna `notificado_estreno` (añadida en database/catalog/01_schema.sql).
  - NO escribe en notification-db directamente: respeta el límite del servicio
    y pasa por su API gRPC, igual que el resto de microservicios.
  - Conexión a las BD por los Services internos catalog-db:5432 / auth-db:5432,
    que vía Endpoints enrutan a la VM de BD externa (10.10.0.10). Credenciales
    desde el Secret quetxal-secrets (variables PG*). Sin nada hardcodeado.

Variables de entorno esperadas (inyectadas por el CronJob):
  CATALOG_PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD  -> catalog-db
  AUTH_PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD      -> auth-db
  NOTIFICATION_SERVICE_ADDR  (p.ej. "notification-service:50054")
  DRY_RUN  ("true" => no encola ni marca; solo reporta cuántos haría)
"""

import os
import sys
import time

import grpc
import psycopg2

# Stubs gRPC generados en build a partir de notification.proto
# (ver Dockerfile: python -m grpc_tools.protoc ...).
import notification_pb2
import notification_pb2_grpc


def _log(msg: str) -> None:
    print(f"[estreno-notify] {time.strftime('%Y-%m-%d %H:%M:%S')} {msg}", flush=True)


def _pg_env(prefix: str) -> dict:
    """Construye los kwargs de conexión psycopg2 desde variables PREFIX_PG*."""
    faltantes = [
        k
        for k in ("PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD")
        if not os.environ.get(f"{prefix}_{k}")
    ]
    if faltantes:
        raise RuntimeError(
            f"Faltan variables de entorno para {prefix}: "
            + ", ".join(f"{prefix}_{k}" for k in faltantes)
        )
    return dict(
        host=os.environ[f"{prefix}_PGHOST"],
        port=os.environ[f"{prefix}_PGPORT"],
        dbname=os.environ[f"{prefix}_PGDATABASE"],
        user=os.environ[f"{prefix}_PGUSER"],
        password=os.environ[f"{prefix}_PGPASSWORD"],
        connect_timeout=10,
    )


def obtener_estrenos_pendientes(conn) -> list:
    """Títulos activos, ya estrenados y aún sin notificar."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, titulo
              FROM contenido
             WHERE activo
               AND NOT notificado_estreno
               AND fecha_estreno IS NOT NULL
               AND fecha_estreno <= now()
             ORDER BY fecha_estreno
            """
        )
        return [{"id": str(r[0]), "titulo": r[1]} for r in cur.fetchall()]


def obtener_destinatarios(conn) -> list:
    """Usuarios activos: (id, email). Audiencia de la difusión de estreno."""
    with conn.cursor() as cur:
        cur.execute(
            "SELECT id, email FROM usuarios WHERE estado = 'activo' ORDER BY creado_en"
        )
        return [{"id": str(r[0]), "email": r[1]} for r in cur.fetchall()]


def marcar_notificado(conn, contenido_id: str) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE contenido SET notificado_estreno = TRUE WHERE id = %s",
            (contenido_id,),
        )
    conn.commit()


def encolar_correo(stub, usuario_id: str, email: str, titulo: str) -> None:
    """Réplica del patrón de billing.notification.client: solo ENCOLA."""
    req = notification_pb2.EncolarCorreoRequest(
        usuario_id=usuario_id,
        tipo="nuevo_contenido",
        destinatario=email,
        datos={"titulo": titulo},
    )
    stub.EncolarCorreo(req, timeout=10)


def main() -> int:
    dry_run = os.environ.get("DRY_RUN", "false").lower() == "true"
    notif_addr = os.environ.get("NOTIFICATION_SERVICE_ADDR", "notification-service:50054")

    _log(f"inicio — destino notification-service={notif_addr} dry_run={dry_run}")

    catalog = psycopg2.connect(**_pg_env("CATALOG"))
    auth = psycopg2.connect(**_pg_env("AUTH"))

    try:
        estrenos = obtener_estrenos_pendientes(catalog)
        if not estrenos:
            _log("no hay estrenos pendientes de notificar — nada que hacer")
            return 0

        destinatarios = obtener_destinatarios(auth)
        _log(
            f"{len(estrenos)} estreno(s) pendiente(s); "
            f"{len(destinatarios)} usuario(s) activo(s) como audiencia"
        )

        if dry_run:
            total = len(estrenos) * len(destinatarios)
            _log(f"DRY_RUN: se encolarían {total} correo(s); no se marca nada")
            for e in estrenos:
                _log(f"  pendiente: '{e['titulo']}' (id={e['id']})")
            return 0

        channel = grpc.insecure_channel(notif_addr)
        stub = notification_pb2_grpc.NotificationServiceStub(channel)

        marcados = 0
        for e in estrenos:
            fallos = 0
            for u in destinatarios:
                try:
                    encolar_correo(stub, u["id"], u["email"], e["titulo"])
                except grpc.RpcError as err:
                    fallos += 1
                    _log(
                        f"fallo al encolar '{e['titulo']}' -> {u['email']}: "
                        f"{err.code()} {err.details()}"
                    )

            if fallos == 0:
                # Idempotencia: solo marcamos si TODOS los correos del título
                # se encolaron. Si quedó alguno fallido, el título sigue
                # pendiente y el próximo ciclo lo reintentará.
                marcar_notificado(catalog, e["id"])
                marcados += 1
                _log(
                    f"'{e['titulo']}' encolado para {len(destinatarios)} "
                    f"usuario(s) y marcado notificado_estreno=TRUE"
                )
            else:
                _log(
                    f"'{e['titulo']}' tuvo {fallos} fallo(s); NO se marca, "
                    f"se reintenta en el próximo ciclo"
                )

        channel.close()
        _log(f"fin — {marcados}/{len(estrenos)} estreno(s) marcados como notificados")
        return 0
    finally:
        catalog.close()
        auth.close()


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001 — el Job debe fallar visible y reintentar
        _log(f"ERROR fatal: {exc}")
        sys.exit(1)
