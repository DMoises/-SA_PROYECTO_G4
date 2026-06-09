"""Acceso a rating_db con SQL crudo (sin ORM).

Inserta/actualiza el voto (un voto por perfil+contenido) y delega el calculo
del % de recomendacion en la Funcion SQL nativa fn_RecalcularPorcentaje
(RFS-04.2 / RES-04). El trigger trg_refrescar_resumen mantiene el resumen.
"""
from typing import Any, Optional

import psycopg

from . import errors
from .db import Database


class RatingRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    # Emite o actualiza la calificacion. ON CONFLICT respeta el voto unico por
    # (perfil, contenido). El CHECK de la BD valida el rango; si falla, se mapea.
    def calificar(self, perfil_id: str, contenido_id: str, tipo: str, valor: int) -> None:
        try:
            self.db.execute(
                """
                INSERT INTO calificacion_usuario (perfil_id, contenido_id, tipo, valor)
                VALUES (%(perfil)s::uuid, %(contenido)s::uuid,
                        %(tipo)s::tipo_calificacion, %(valor)s::smallint)
                ON CONFLICT (perfil_id, contenido_id) DO UPDATE
                    SET tipo = EXCLUDED.tipo, valor = EXCLUDED.valor, creada_en = now()
                """,
                {"perfil": perfil_id, "contenido": contenido_id, "tipo": tipo, "valor": valor},
            )
        except psycopg.errors.CheckViolation as e:
            raise errors.DatosInvalidos("valor fuera de rango para el tipo de calificacion") from e
        except psycopg.errors.InvalidTextRepresentation as e:
            raise errors.DatosInvalidos("tipo o id invalido") from e

    # % de recomendacion + conteos, usando las funciones SQL nativas.
    def obtener_recomendacion(self, contenido_id: str) -> dict[str, Any]:
        return self.db.fetch_one(
            """
            SELECT
              (SELECT COUNT(*) FROM calificacion_usuario
                 WHERE contenido_id = %(id)s::uuid) AS total_votos,
              (SELECT COUNT(*) FROM calificacion_usuario
                 WHERE contenido_id = %(id)s::uuid AND fn_es_positiva(tipo, valor)) AS votos_positivos,
              fn_RecalcularPorcentaje(%(id)s::uuid) AS porcentaje
            """,
            {"id": contenido_id},
        )

    def obtener_calificacion_usuario(self, perfil_id: str, contenido_id: str) -> Optional[dict[str, Any]]:
        return self.db.fetch_one(
            """
            SELECT tipo, valor FROM calificacion_usuario
            WHERE perfil_id = %(perfil)s::uuid AND contenido_id = %(contenido)s::uuid
            """,
            {"perfil": perfil_id, "contenido": contenido_id},
        )
