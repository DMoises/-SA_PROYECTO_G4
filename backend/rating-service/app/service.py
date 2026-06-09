"""Logica de negocio de calificaciones: valida la entrada, emite el voto y
devuelve la recomendacion actualizada. No conoce gRPC."""
from typing import Any, Optional

from . import errors
from .repository import RatingRepository

TIPOS = ("estrella", "pulgar")


class RatingService:
    def __init__(self, repo: RatingRepository) -> None:
        self.repo = repo

    def calificar(self, perfil_id: str, contenido_id: str, tipo: str, valor: int) -> dict[str, Any]:
        if not _limpiar(perfil_id) or not _limpiar(contenido_id):
            raise errors.DatosInvalidos("perfil_id y contenido_id son obligatorios")
        if tipo not in TIPOS:
            raise errors.DatosInvalidos("tipo debe ser 'estrella' o 'pulgar'")
        if tipo == "estrella" and not (1 <= valor <= 5):
            raise errors.DatosInvalidos("estrella admite valores de 1 a 5")
        if tipo == "pulgar" and valor not in (0, 1):
            raise errors.DatosInvalidos("pulgar admite 0 o 1")

        self.repo.calificar(perfil_id, contenido_id, tipo, valor)
        return self.obtener_recomendacion(contenido_id)

    def obtener_recomendacion(self, contenido_id: str) -> dict[str, Any]:
        if not _limpiar(contenido_id):
            raise errors.DatosInvalidos("contenido_id es obligatorio")
        return self.repo.obtener_recomendacion(contenido_id)

    def obtener_calificacion_usuario(self, perfil_id: str, contenido_id: str) -> Optional[dict[str, Any]]:
        if not _limpiar(perfil_id) or not _limpiar(contenido_id):
            raise errors.DatosInvalidos("perfil_id y contenido_id son obligatorios")
        return self.repo.obtener_calificacion_usuario(perfil_id, contenido_id)


def _limpiar(valor: str) -> str | None:
    if valor is None:
        return None
    valor = valor.strip()
    return valor or None
