"""Errores de dominio del rating-service. El handler los traduce a codigos gRPC."""


class RatingError(Exception):
    """Base de los errores de dominio."""


class DatosInvalidos(RatingError):
    """Argumento de entrada invalido (-> INVALID_ARGUMENT)."""
