"""Acceso a catalog_db con psycopg (sin ORM, como exige el enunciado).

Es el equivalente del database.service.ts del notification-service: un pool de
conexiones y un par de helpers de consulta que devuelven filas como dicts.
"""
from typing import Any, Optional

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import Config


class Database:
    def __init__(self, cfg: Config) -> None:
        # open=False + open(wait=True): espera a que catalog-db acepte conexiones.
        self._pool = ConnectionPool(conninfo=cfg.dsn, min_size=1, max_size=10, open=False)
        self._pool.open(wait=True)

    def fetch_all(self, sql: str, params: Optional[dict[str, Any]] = None) -> list[dict[str, Any]]:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(sql, params or {})
                return cur.fetchall()

    def fetch_one(self, sql: str, params: Optional[dict[str, Any]] = None) -> Optional[dict[str, Any]]:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(sql, params or {})
                return cur.fetchone()

    def execute(self, sql: str, params: Optional[dict[str, Any]] = None, current_user: Optional[str] = None) -> None:
        with self._pool.connection() as conn:
            with conn.cursor() as cur:
                # SET LOCAL (set_config con is_local=true) deja el usuario disponible
                # para el trigger de auditoria dentro de ESTA transaccion. Sin esto,
                # el trigger cae a session_user (el rol de BD) en vez del usuario real.
                if current_user:
                    cur.execute("SELECT set_config('app.current_user', %(u)s, true)", {"u": current_user})
                cur.execute(sql, params or {})
            conn.commit()

    def execute_returning(self, sql: str, params: Optional[dict[str, Any]] = None, current_user: Optional[str] = None) -> Optional[dict[str, Any]]:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                if current_user:
                    cur.execute("SELECT set_config('app.current_user', %(u)s, true)", {"u": current_user})
                cur.execute(sql, params or {})
                row = cur.fetchone()
            conn.commit()
            return row

    def close(self) -> None:
        self._pool.close()
