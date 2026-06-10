"""Cliente para consultar tasas de cambio desde una API externa."""

import httpx

from app import errors
from app.config import Config


class ExternalFXProvider:
    def __init__(self, cfg: Config) -> None:
        self._client = httpx.Client(
            base_url=cfg.fx_api_url.rstrip("/"),
            timeout=cfg.fx_api_timeout,
        )

    def obtener_tasa(self, moneda_origen: str, moneda_destino: str) -> float:
        if moneda_origen == moneda_destino:
            return 1.0

        try:
            response = self._client.get(
                f"/v2/rate/{moneda_origen}/{moneda_destino}"
            )

            if response.status_code in (400, 404, 422):
                raise errors.TasaNoEncontrada(
                    f"No existe tasa para {moneda_origen}/{moneda_destino}"
                )

            response.raise_for_status()
            data = response.json()

        except errors.TasaNoEncontrada:
            raise

        except (
            httpx.RequestError,
            httpx.HTTPStatusError,
            ValueError,
            TypeError,
        ) as exc:
            raise errors.ProveedorFXNoDisponible(
                "No fue posible consultar el proveedor externo de divisas"
            ) from exc

        tasa = data.get("rate")

        if tasa is None:
            raise errors.ProveedorFXNoDisponible(
                "El proveedor externo no devolvió una tasa válida"
            )

        tasa_float = float(tasa)

        if tasa_float <= 0:
            raise errors.ProveedorFXNoDisponible(
                "El proveedor externo devolvió una tasa inválida"
            )

        return tasa_float

    def close(self) -> None:
        self._client.close()