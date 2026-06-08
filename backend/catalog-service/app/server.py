"""Arranca el catalog-service: conecta la configuracion, el pool de PostgreSQL,
el repositorio, el servicio y el handler gRPC, y escucha en el puerto
configurado. Equivale a cmd/server/main.go del auth-service.
"""
import signal
from concurrent import futures

import grpc
from grpc_reflection.v1alpha import reflection

from .config import Config
from .db import Database
from .handler import CatalogHandler
from .pb import catalog_pb2 as pb
from .pb import catalog_pb2_grpc as pb_grpc
from .repository import CatalogRepository
from .service import CatalogService


def serve() -> None:
    cfg = Config()

    # Inyeccion de dependencias: db -> repo -> service -> handler.
    db = Database(cfg)
    repo = CatalogRepository(db)
    service = CatalogService(repo)
    handler = CatalogHandler(service)

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    pb_grpc.add_CatalogServiceServicer_to_server(handler, server)

    # Reflection: util para probar con grpcurl/Postman (como reflection.Register).
    service_names = (
        pb.DESCRIPTOR.services_by_name["CatalogService"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(service_names, server)

    server.add_insecure_port(f"[::]:{cfg.grpc_port}")  # trafico interno, sin TLS
    server.start()
    print(f"catalog-service escuchando gRPC en :{cfg.grpc_port}", flush=True)

    # Apagado ordenado ante SIGINT/SIGTERM.
    def _shutdown(*_) -> None:
        print("apagando catalog-service...", flush=True)
        server.stop(5).wait()
        db.close()

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    server.wait_for_termination()


if __name__ == "__main__":
    serve()
