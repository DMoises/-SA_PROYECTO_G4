"""Acceso a datos de tipos de cambio con SQL crudo (sin ORM).

Lee la tabla tipos_cambio y la funcion almacenada fn_convertir. Recibe el
Database por constructor y no conoce ni gRPC ni Redis.
"""
from typing import Optional

from app.db import Database


class FXRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    def obtener_tasa(self, moneda_origen: str, moneda_destino: str) -> Optional[float]:
        row = self.db.fetch_one(
            """
            SELECT tasa
            FROM tipos_cambio
            WHERE moneda_origen = %s
              AND moneda_destino = %s
              AND vigente = TRUE
            """,
            (moneda_origen, moneda_destino),
        )
        return float(row[0]) if row else None

    def convertir_monto(
        self, monto: float, moneda_origen: str, moneda_destino: str
    ) -> float:
        row = self.db.fetch_one(
            "SELECT fn_convertir(%s, %s, %s)",
            (monto, moneda_origen, moneda_destino),
        )
        return float(row[0])
