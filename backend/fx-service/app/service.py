"""Logica de negocio de tipos de cambio.

Valida la entrada, aplica la politica de cache (cache-aside) y delega la
consulta de datos al repositorio. No conoce gRPC: devuelve dicts simples que el
handler traduce a mensajes del .proto. Antes esta logica vivia mezclada con el
acceso a datos, el cliente de cache y el transporte gRPC en una sola clase.
"""
from typing import Any

from app import errors
from app.cache import RedisCache
from app.repository import FXRepository


class FXService:
    def __init__(self, repo: FXRepository, cache: RedisCache) -> None:
        self.repo = repo
        self.cache = cache

    def consultar_tasa(self, moneda_origen: str, moneda_destino: str) -> dict[str, Any]:
        _validar_par(moneda_origen, moneda_destino)

        cache_key = f"fx:{moneda_origen}:{moneda_destino}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return {
                "tasa": float(cached),
                "moneda_origen": moneda_origen,
                "moneda_destino": moneda_destino,
                "desde_cache": True,
            }

        tasa = self.repo.obtener_tasa(moneda_origen, moneda_destino)
        if tasa is None:
            raise errors.TasaNoEncontrada("No existe tasa vigente")

        self.cache.set(cache_key, str(tasa))
        return {
            "tasa": tasa,
            "moneda_origen": moneda_origen,
            "moneda_destino": moneda_destino,
            "desde_cache": False,
        }

    def convertir_monto(
        self, monto: float, moneda_origen: str, moneda_destino: str
    ) -> dict[str, Any]:
        _validar_par(moneda_origen, moneda_destino)

        convertido = self.repo.convertir_monto(monto, moneda_origen, moneda_destino)
        return {
            "monto_original": monto,
            "monto_convertido": convertido,
            "moneda_origen": moneda_origen,
            "moneda_destino": moneda_destino,
        }


def _validar_par(moneda_origen: str, moneda_destino: str) -> None:
    if not (moneda_origen or "").strip() or not (moneda_destino or "").strip():
        raise errors.DatosInvalidos(
            "moneda_origen y moneda_destino son obligatorios"
        )
