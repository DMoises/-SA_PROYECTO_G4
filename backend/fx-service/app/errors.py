"""Errores de dominio del fx-service."""


class FXError(Exception):
    """Base de los errores de dominio de tipos de cambio."""


class DatosInvalidos(FXError):
    """Los datos proporcionados no son validos."""


class TasaNoEncontrada(FXError):
    """No existe una tasa para el par de monedas solicitado."""


class ProveedorFXNoDisponible(FXError):
    """El proveedor externo de tipos de cambio no esta disponible."""