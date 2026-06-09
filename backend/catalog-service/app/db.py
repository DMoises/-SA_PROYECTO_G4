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

    def close(self) -> None:
        self._pool.close()
