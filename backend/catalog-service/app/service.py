"""Logica de negocio del catalogo.

Valida argumentos y ensambla la ficha tecnica (cabecera + reparto + temporadas)
a partir del repositorio. No conoce gRPC: devuelve dicts simples que el handler
traduce a mensajes del .proto.
"""
from typing import Any

from . import errors
from .repository import CatalogRepository


class CatalogService:
    def __init__(self, repo: CatalogRepository) -> None:
        self.repo = repo

    def explorar_cartelera(self) -> list[dict[str, Any]]:
        return self.repo.explorar_cartelera()

    def buscar(
        self, titulo: str, categoria: str, genero: str, actor: str, tipo: str
    ) -> list[dict[str, Any]]:
        # Los strings vacios del request se normalizan a None (sin filtro).
        return self.repo.buscar(
            _limpiar(titulo), _limpiar(categoria), _limpiar(genero),
            _limpiar(actor), _limpiar(tipo)
        )

    def obtener_ficha(self, contenido_id: str) -> dict[str, Any]:
        if not _limpiar(contenido_id):
            raise errors.DatosInvalidos("contenido_id es obligatorio")

        cabecera = self.repo.obtener_contenido(contenido_id)
        if cabecera is None:
            raise errors.ContenidoNoEncontrado("el contenido no existe")

        cabecera["reparto"] = self.repo.obtener_reparto(contenido_id)

        # Las temporadas/episodios solo aplican a series.
        temporadas: list[dict[str, Any]] = []
        if cabecera["tipo"] == "serie":
            temporadas = _agrupar_temporadas(self.repo.obtener_episodios(contenido_id))
        cabecera["temporadas"] = temporadas

        return cabecera


def _limpiar(valor: str) -> str | None:
    """Convierte '' o espacios en None para que el filtro se ignore."""
    if valor is None:
        return None
    valor = valor.strip()
    return valor or None


def _agrupar_temporadas(filas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Agrupa las filas planas (temporada, episodio...) en temporadas con
    sus episodios, preservando el orden de la consulta."""
    temporadas: list[dict[str, Any]] = []
    indice: dict[int, dict[str, Any]] = {}
    for f in filas:
        num = f["temporada"]
        if num not in indice:
            indice[num] = {"numero": num, "episodios": []}
            temporadas.append(indice[num])
        indice[num]["episodios"].append(
            {"numero": f["episodio"], "titulo": f["titulo"],
             "duracion_min": f["duracion_min"], "video_url": f.get("video_url")}
        )
    return temporadas
