"""Adaptador gRPC: implementa CatalogServiceServicer y traduce los errores de
dominio a codigos gRPC (igual que el handler del auth-service). Los nombres de
servicio/metodos coinciden con catalog.proto.
"""
from typing import Any

import grpc

from . import errors
from .gcs import MediaStorage
from .pb import catalog_pb2 as pb
from .pb import catalog_pb2_grpc as pb_grpc
from .service import CatalogService


class CatalogHandler(pb_grpc.CatalogServiceServicer):
    def __init__(self, service: CatalogService, media: MediaStorage) -> None:
        self.service = service
        self.media = media

    def ExplorarCartelera(self, request, context):
        items = self.service.explorar_cartelera()
        return pb.CarteleraResponse(items=[self._item(i) for i in items])

    def BuscarContenido(self, request, context):
        items = self.service.buscar(
            request.titulo, request.categoria, request.genero,
            request.actor, request.tipo
        )
        return pb.CarteleraResponse(items=[self._item(i) for i in items])

    def ObtenerFichaTecnica(self, request, context):
        try:
            ficha = self.service.obtener_ficha(request.contenido_id)
        except errors.DatosInvalidos as e:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(e))
        except errors.ContenidoNoEncontrado as e:
            context.abort(grpc.StatusCode.NOT_FOUND, str(e))
        return self._ficha(ficha)

    # ----------------------- mapeo dict -> mensajes pb -----------------------
    # Postgres puede devolver NULL en columnas opcionales (anio, sinopsis,
    # duracion_min); proto3 no admite None, asi que se normaliza a su default.
    # La portada se resuelve a una Signed URL de GCS si es un objeto privado.

    def _item(self, row: dict[str, Any]) -> pb.ItemCartelera:
        return pb.ItemCartelera(
            contenido_id=str(row["contenido_id"]),
            titulo=row["titulo"],
            tipo=row["tipo"],
            anio=row["anio"] or 0,
            clasificacion=row["clasificacion"],
            generos=row["generos"] or "",
            categorias=row["categorias"] or "",
            portada_url=self.media.to_playable_url(row.get("portada_url")) or "",
        )

    def _ficha(self, f: dict[str, Any]) -> pb.FichaTecnicaResponse:
        return pb.FichaTecnicaResponse(
            contenido_id=str(f["contenido_id"]),
            titulo=f["titulo"],
            tipo=f["tipo"],
            sinopsis=f["sinopsis"] or "",
            anio=f["anio"] or 0,
            clasificacion=f["clasificacion"],
            duracion_min=f["duracion_min"] or 0,
            generos=f["generos"] or "",
            categorias=f["categorias"] or "",
            reparto=[
                pb.MiembroReparto(actor=r["actor"], personaje=r["personaje"], rol=r["rol"])
                for r in f["reparto"]
            ],
            temporadas=[
                pb.Temporada(
                    numero=t["numero"],
                    episodios=[
                        pb.Episodio(
                            numero=e["numero"],
                            titulo=e["titulo"],
                            duracion_min=e["duracion_min"] or 0,
                        )
                        for e in t["episodios"]
                    ],
                )
                for t in f["temporadas"]
            ],
            portada_url=self.media.to_playable_url(f.get("portada_url")) or "",
        )

