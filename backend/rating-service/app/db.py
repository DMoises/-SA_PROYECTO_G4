"""Acceso a rating_db con psycopg (sin ORM, como exige el enunciado).

Pool de conexiones + helpers de consulta que devuelven filas como dicts.
"""
from typing import Any, Optional

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import Config


class Database:
    def __init__(self, cfg: Config) -> None:
        self._pool = ConnectionPool(conninfo=cfg.dsn, min_size=1, max_size=10, open=False)
        self._pool.open(wait=True)

    def fetch_one(self, sql: str, params: Optional[dict[str, Any]] = None) -> Optional[dict[str, Any]]:
        with self._pool.connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(sql, params or {})
                return cur.fetchone()

    def execute(self, sql: str, params: Optional[dict[str, Any]] = None, current_user: Optional[str] = None) -> None:
        with self._pool.connection() as conn:
            with conn.cursor() as cur:
                if current_user:
                    cur.execute("SELECT set_config('app.current_user', %s, true)", (current_user,))
                cur.execute(sql, params or {})

    def close(self) -> None:
        self._pool.close()
