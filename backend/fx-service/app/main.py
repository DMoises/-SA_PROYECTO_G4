"""Inicializacion del servidor gRPC del fx-service."""

import signal
from concurrent import futures

import grpc

from app import fx_pb2_grpc
from app.cache import RedisCache
from app.config import Config
from app.db import Database
from app.handler import FXHandler
from app.provider import ExternalFXProvider
from app.repository import FXRepository
from app.service import FXService


def serve() -> None:
    cfg = Config()

    db = Database(cfg)
    cache = RedisCache(cfg)
    provider = ExternalFXProvider(cfg)

    repo = FXRepository(db)
    service = FXService(repo, cache, provider)
    handler = FXHandler(service)

    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10)
    )

    fx_pb2_grpc.add_FXServiceServicer_to_server(
        handler,
        server,
    )

    server.add_insecure_port(f"[::]:{cfg.grpc_port}")
    server.start()

    print(
        f"FX Service escuchando en puerto {cfg.grpc_port}",
        flush=True,
    )

    def _shutdown(*_) -> None:
        print("Apagando fx-service...", flush=True)

        server.stop(5).wait()
        provider.close()
        db.close()

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    server.wait_for_termination()


if __name__ == "__main__":
    serve()