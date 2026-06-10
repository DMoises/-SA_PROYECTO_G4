"""Errores de dominio del fx-service.

El handler gRPC los traduce a codigos gRPC, manteniendo el dominio
independiente del transporte (igual que el errors.py del catalog-service).
"""


class FXError(Exception):
    """Base de los errores de dominio de tipos de cambio."""


class DatosInvalidos(FXError):
    """Argumento de entrada invalido (-> INVALID_ARGUMENT)."""


class TasaNoEncontrada(FXError):
    """No existe una tasa vigente para el par de monedas (-> NOT_FOUND)."""
