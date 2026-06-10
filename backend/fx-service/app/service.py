"""Logica de negocio de tipos de cambio.

Aplica cache-aside usando Redis. Cuando una tasa no se encuentra
en cache, consulta el proveedor externo. PostgreSQL se utiliza
como respaldo si la API externa no esta disponible.
"""

from typing import Any

from app import errors
from app.cache import RedisCache
from app.provider import ExternalFXProvider
from app.repository import FXRepository


class FXService:
    def __init__(
        self,
        repo: FXRepository,
        cache: RedisCache,
        provider: ExternalFXProvider,
    ) -> None:
        self.repo = repo
        self.cache = cache
        self.provider = provider

    def consultar_tasa(
        self,
        moneda_origen: str,
        moneda_destino: str,
    ) -> dict[str, Any]:
        moneda_origen, moneda_destino = _normalizar_par(
            moneda_origen,
            moneda_destino,
        )

        if moneda_origen == moneda_destino:
            return {
                "tasa": 1.0,
                "moneda_origen": moneda_origen,
                "moneda_destino": moneda_destino,
                "desde_cache": False,
            }

        cache_key = f"fx:{moneda_origen}:{moneda_destino}"

        cached = self.cache.get(cache_key)

        if cached is not None:
            return {
                "tasa": float(cached),
                "moneda_origen": moneda_origen,
                "moneda_destino": moneda_destino,
                "desde_cache": True,
            }

        tasa = self._obtener_tasa_con_respaldo(
            moneda_origen,
            moneda_destino,
        )

        self.cache.set(cache_key, str(tasa))

        return {
            "tasa": tasa,
            "moneda_origen": moneda_origen,
            "moneda_destino": moneda_destino,
            "desde_cache": False,
        }

    def convertir_monto(
        self,
        monto: float,
        moneda_origen: str,
        moneda_destino: str,
    ) -> dict[str, Any]:
        if monto < 0:
            raise errors.DatosInvalidos(
                "El monto no puede ser negativo"
            )

        resultado_tasa = self.consultar_tasa(
            moneda_origen,
            moneda_destino,
        )

        convertido = round(
            monto * float(resultado_tasa["tasa"]),
            2,
        )

        return {
            "monto_original": monto,
            "monto_convertido": convertido,
            "moneda_origen": resultado_tasa["moneda_origen"],
            "moneda_destino": resultado_tasa["moneda_destino"],
        }

    def _obtener_tasa_con_respaldo(
        self,
        moneda_origen: str,
        moneda_destino: str,
    ) -> float:
        try:
            return self.provider.obtener_tasa(
                moneda_origen,
                moneda_destino,
            )

        except (
            errors.ProveedorFXNoDisponible,
            errors.TasaNoEncontrada,
        ):
            tasa_respaldo = self.repo.obtener_tasa(
                moneda_origen,
                moneda_destino,
            )

            if tasa_respaldo is None:
                raise errors.TasaNoEncontrada(
                    "No existe tasa externa ni tasa de respaldo vigente"
                )

            return tasa_respaldo


def _normalizar_par(
    moneda_origen: str,
    moneda_destino: str,
) -> tuple[str, str]:
    origen = (moneda_origen or "").strip().upper()
    destino = (moneda_destino or "").strip().upper()

    if not origen or not destino:
        raise errors.DatosInvalidos(
            "moneda_origen y moneda_destino son obligatorios"
        )

    if len(origen) != 3 or len(destino) != 3:
        raise errors.DatosInvalidos(
            "Las monedas deben utilizar códigos ISO de tres letras"
        )

    return origen, destino