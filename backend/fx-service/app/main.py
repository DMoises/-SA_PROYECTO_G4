"""Arranca el fx-service: conecta la configuracion, el pool de PostgreSQL, el
cache de Redis, el repositorio, el servicio y el handler gRPC, y escucha en el
puerto configurado. Antes este archivo solo instanciaba un FXService monolitico
sin pasarle dependencias; ahora hace la inyeccion explicita (como el server.py
del catalog-service).
"""
import signal
from concurrent import futures

import grpc

from app import fx_pb2_grpc
from app.cache import RedisCache
from app.config import Config
from app.db import Database
from app.handler import FXHandler
from app.repository import FXRepository
from app.service import FXService


def serve() -> None:
    cfg = Config()

    # Inyeccion de dependencias: db/cache -> repo -> service -> handler.
    db = Database(cfg)
    cache = RedisCache(cfg)
    repo = FXRepository(db)
    service = FXService(repo, cache)
    handler = FXHandler(service)

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    fx_pb2_grpc.add_FXServiceServicer_to_server(handler, server)

    server.add_insecure_port(f"[::]:{cfg.grpc_port}")  # trafico interno, sin TLS
    server.start()
    print(f"FX Service escuchando en puerto {cfg.grpc_port}", flush=True)

    # Apagado ordenado ante SIGINT/SIGTERM.
    def _shutdown(*_) -> None:
        print("apagando fx-service...", flush=True)
        server.stop(5).wait()
        db.close()

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    server.wait_for_termination()


if __name__ == "__main__":
    serve()
