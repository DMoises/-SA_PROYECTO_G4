"""Acceso a fx_db con psycopg2 (sin ORM).

Mantiene un pool de conexiones (antes se abria una conexion nueva en cada
llamada y se cerraba a mano) y expone un helper de consulta. Recibe la
configuracion por constructor, en lugar de leer variables de entorno por su
cuenta. Equivale al Database del catalog-service.
"""
from typing import Any, Optional, Sequence

from psycopg2.pool import ThreadedConnectionPool

from app.config import Config


class Database:
    def __init__(self, cfg: Config) -> None:
        self._pool = ThreadedConnectionPool(minconn=1, maxconn=10, dsn=cfg.dsn)

    def fetch_one(
        self, sql: str, params: Optional[Sequence[Any]] = None
    ) -> Optional[tuple]:
        conn = self._pool.getconn()
        try:
            # Consultas de solo lectura: autocommit evita dejar transacciones
            # abiertas en las conexiones que vuelven al pool.
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchone()
        finally:
            self._pool.putconn(conn)

    def execute(
        self,
        sql: str,
        params: Optional[Sequence[Any]] = None,
        current_user: Optional[str] = None,
    ) -> None:
        """Escritura transaccional sobre fx_db (tipos_cambio / monedas).

        Setea app.current_user con SET LOCAL (set_config is_local=true) dentro
        de la MISMA transaccion para que el trigger de auditoria registre al
        usuario real en lugar de session_user (el rol de BD). Sin current_user,
        la auditoria cae a session_user como hasta ahora.
        """
        conn = self._pool.getconn()
        try:
            conn.autocommit = False
            with conn.cursor() as cur:
                if current_user:
                    cur.execute(
                        "SELECT set_config('app.current_user', %s, true)",
                        (current_user,),
                    )
                cur.execute(sql, params)
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._pool.putconn(conn)

    def close(self) -> None:
        self._pool.closeall()
