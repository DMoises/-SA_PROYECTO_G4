import os
import redis
import grpc

from app import fx_pb2
from app import fx_pb2_grpc
from app.db import get_connection


class FXService(fx_pb2_grpc.FXServiceServicer):

    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            password=os.getenv("REDIS_PASSWORD"),
            decode_responses=True
        )

    def ConsultarTasa(self, request, context):

        cache_key = f"fx:{request.moneda_origen}:{request.moneda_destino}"

        cached = self.redis_client.get(cache_key)

        if cached:
            return fx_pb2.ConsultarTasaResponse(
                tasa=float(cached),
                moneda_origen=request.moneda_origen,
                moneda_destino=request.moneda_destino,
                desde_cache=True
            )

        conn = get_connection()

        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT tasa
                    FROM tipos_cambio
                    WHERE moneda_origen = %s
                    AND moneda_destino = %s
                    AND vigente = TRUE
                """, (
                    request.moneda_origen,
                    request.moneda_destino
                ))

                row = cur.fetchone()

                if not row:
                    context.abort(
                        grpc.StatusCode.NOT_FOUND,
                        "No existe tasa vigente"
                    )

                tasa = float(row[0])

                self.redis_client.setex(
                    cache_key,
                    300,
                    str(tasa)
                )

                return fx_pb2.ConsultarTasaResponse(
                    tasa=tasa,
                    moneda_origen=request.moneda_origen,
                    moneda_destino=request.moneda_destino,
                    desde_cache=False
                )

        finally:
            conn.close()

    def ConvertirMonto(self, request, context):

        conn = get_connection()

        try:
            with conn.cursor() as cur:

                cur.execute(
                    """
                    SELECT fn_convertir(%s,%s,%s)
                    """,
                    (
                        request.monto,
                        request.moneda_origen,
                        request.moneda_destino
                    )
                )

                monto_convertido = float(cur.fetchone()[0])

                return fx_pb2.ConvertirMontoResponse(
                    monto_original=request.monto,
                    monto_convertido=monto_convertido,
                    moneda_origen=request.moneda_origen,
                    moneda_destino=request.moneda_destino
                )

        finally:
            conn.close()