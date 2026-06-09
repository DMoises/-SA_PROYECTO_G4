"""Adaptador gRPC: implementa RatingServiceServicer y traduce errores de
dominio a codigos gRPC. Los nombres de servicio/metodos coinciden con rating.proto.
"""
from typing import Any

import grpc

from . import errors
from .pb import rating_pb2 as pb
from .pb import rating_pb2_grpc as pb_grpc
from .service import RatingService


class RatingHandler(pb_grpc.RatingServiceServicer):
    def __init__(self, service: RatingService) -> None:
        self.service = service

    def Calificar(self, request, context):
        try:
            rec = self.service.calificar(
                request.perfil_id, request.contenido_id, request.tipo, request.valor
            )
        except errors.DatosInvalidos as e:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(e))
        return _recomendacion(request.contenido_id, rec)

    def ObtenerRecomendacion(self, request, context):
        try:
            rec = self.service.obtener_recomendacion(request.contenido_id)
        except errors.DatosInvalidos as e:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(e))
        return _recomendacion(request.contenido_id, rec)

    def ObtenerCalificacionUsuario(self, request, context):
        try:
            row = self.service.obtener_calificacion_usuario(request.perfil_id, request.contenido_id)
        except errors.DatosInvalidos as e:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(e))
        if not row:
            return pb.CalificacionUsuarioResponse(existe=False)
        return pb.CalificacionUsuarioResponse(existe=True, tipo=row["tipo"], valor=int(row["valor"]))


def _recomendacion(contenido_id: str, rec: dict[str, Any]) -> pb.RecomendacionResponse:
    # porcentaje viene como Decimal (NUMERIC); proto3 usa double.
    return pb.RecomendacionResponse(
        contenido_id=contenido_id,
        total_votos=int(rec["total_votos"] or 0),
        votos_positivos=int(rec["votos_positivos"] or 0),
        porcentaje=float(rec["porcentaje"] or 0),
    )
