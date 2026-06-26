"""Logica de negocio del catalogo.

Valida argumentos y ensambla la ficha tecnica (cabecera + reparto + temporadas)
a partir del repositorio. No conoce gRPC: devuelve dicts simples que el handler
traduce a mensajes del .proto.
"""
from typing import Any

from . import errors
from .repository import CatalogRepository


class CatalogService:
    def __init__(self, repo: CatalogRepository, rating_dsn: str = "", history_dsn: str = "") -> None:
        self.repo = repo
        self.rating_dsn = rating_dsn
        self.history_dsn = history_dsn

    def obtener_recomendaciones(self, perfil_id: str) -> list[dict[str, Any]]:
        if not _limpiar(perfil_id):
            raise errors.DatosInvalidos("perfil_id es obligatorio")

        # 1. Obtener contenidos consumidos en historial y contenidos con voto positivo
        hist_ids = self.repo.obtener_historial_contenido_ids(perfil_id, self.rating_dsn, self.history_dsn)
        voto_ids = self.repo.obtener_votos_positivos_contenido_ids(perfil_id, self.rating_dsn)

        all_interacted = list(set(hist_ids + voto_ids))

        # 2. Si no hay interacciones, devolvemos los destacados o tendencias por defecto
        cartelera = self.repo.explorar_cartelera()
        if not all_interacted:
            # Si no hay interacciones previas, devolvemos la cartelera ordenada por titulo
            return cartelera[:12]

        # 3. Analizar los géneros de los contenidos con los que el usuario interactuó.
        # Las calificaciones positivas aportan más peso (peso 3) que los consumidos en historial (peso 1).
        genre_weights: dict[str, int] = {}
        for c in cartelera:
            c_id = str(c["contenido_id"])
            if c_id in all_interacted:
                weight = 1
                if c_id in voto_ids:
                    weight = 3
                
                # c["generos"] es un string separado por comas
                generos = [g.strip() for g in c["generos"].split(",") if g.strip()]
                for g in generos:
                    genre_weights[g] = genre_weights.get(g, 0) + weight

        if not genre_weights:
            return cartelera[:12]

        # 4. Puntuar todos los contenidos de la cartelera
        scored_contents = []
        for c in cartelera:
            c_id = str(c["contenido_id"])
            # El sistema prioriza contenidos que el usuario NO ha visto (opcional, pero excelente UX)
            ya_visto = c_id in hist_ids
            
            # Calcular afinidad basada en coincidencia de géneros
            generos = [g.strip() for g in c["generos"].split(",") if g.strip()]
            score = 0
            for g in generos:
                score += genre_weights.get(g, 0)

            # Penalizamos levemente lo ya visto para incentivar el descubrimiento
            if ya_visto:
                score = score * 0.2

            if score > 0 or not ya_visto:
                scored_contents.append((score, c))

        # 5. Ordenar por score descendente
        scored_contents.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_contents[:12]]

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
