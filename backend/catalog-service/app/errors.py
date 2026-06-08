"""Errores de dominio del catalog-service.

El handler gRPC los traduce a codigos gRPC (igual que aGRPC en el auth-service),
manteniendo el dominio independiente del transporte.
"""


class CatalogError(Exception):
    """Base de los errores de dominio del catalogo."""


class DatosInvalidos(CatalogError):
    """Argumento de entrada invalido (-> INVALID_ARGUMENT)."""


class ContenidoNoEncontrado(CatalogError):
    """El contenido solicitado no existe (-> NOT_FOUND)."""
