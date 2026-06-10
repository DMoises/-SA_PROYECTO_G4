"""Adaptador gRPC: implementa FXServiceServicer y traduce los errores de
dominio a codigos gRPC (igual que el handler del catalog-service). Los nombres
de servicio/metodos coinciden con fx.proto.
"""
import grpc

from app import errors
from app import fx_pb2
from app import fx_pb2_grpc
from app.service import FXService


class FXHandler(fx_pb2_grpc.FXServiceServicer):
    def __init__(self, service: FXService) -> None:
        self.service = service

    def ConsultarTasa(self, request, context):
        try:
            r = self.service.consultar_tasa(
                request.moneda_origen, request.moneda_destino
            )
        except errors.DatosInvalidos as e:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(e))
        except errors.TasaNoEncontrada as e:
            context.abort(grpc.StatusCode.NOT_FOUND, str(e))
        return fx_pb2.ConsultarTasaResponse(
            tasa=r["tasa"],
            moneda_origen=r["moneda_origen"],
            moneda_destino=r["moneda_destino"],
            desde_cache=r["desde_cache"],
        )

    def ConvertirMonto(self, request, context):
        try:
            r = self.service.convertir_monto(
                request.monto, request.moneda_origen, request.moneda_destino
            )
        except errors.DatosInvalidos as e:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(e))
        return fx_pb2.ConvertirMontoResponse(
            monto_original=r["monto_original"],
            monto_convertido=r["monto_convertido"],
            moneda_origen=r["moneda_origen"],
            moneda_destino=r["moneda_destino"],
        )
