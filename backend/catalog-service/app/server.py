"""Arranca el catalog-service: conecta la configuracion, el pool de PostgreSQL,
el repositorio, el servicio y el handler gRPC, y escucha en el puerto
configurado. Equivale a cmd/server/main.go del auth-service.
"""
import signal
import threading
from concurrent import futures

import grpc
from grpc_reflection.v1alpha import reflection

from .admin_handler_http import make_server
from .admin_repository import AdminRepository
from .config import Config
from .db import Database
from .gcs import MediaStorage
from .handler import CatalogHandler
from .pb import catalog_pb2 as pb
from .pb import catalog_pb2_grpc as pb_grpc
from .interceptor import SecurityInterceptor
from .repository import CatalogRepository
from .service import CatalogService


def serve() -> None:
    cfg = Config()

    # Inyeccion de dependencias: db -> repo -> service -> handler.
    db = Database(cfg)
    repo = CatalogRepository(db)
    service = CatalogService(repo, rating_dsn=cfg.rating_dsn, history_dsn=cfg.history_dsn)
    # Entrega de multimedia desde GCS (firma Signed URLs v4 para objetos privados).
    media = MediaStorage(cfg)
    handler = CatalogHandler(service, media)

    # Servidor gRPC (lectura publica via gateway, protegida por interceptor de seguridad).
    security_interceptor = SecurityInterceptor(cfg)
    grpc_server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        interceptors=[security_interceptor]
    )
    pb_grpc.add_CatalogServiceServicer_to_server(handler, grpc_server)

    service_names = (
        pb.DESCRIPTOR.services_by_name["CatalogService"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(service_names, grpc_server)

    grpc_server.add_insecure_port(f"[::]:{cfg.grpc_port}")
    grpc_server.start()
    print(f"catalog-service escuchando gRPC en :{cfg.grpc_port}", flush=True)

    # Servidor HTTP admin (CRUD interno, solo accesible desde la red Docker).
    admin_repo = AdminRepository(db)
    http_srv = make_server(cfg.admin_http_port, admin_repo, media, cfg.jwt_secret)
    http_thread = threading.Thread(target=http_srv.serve_forever, daemon=True)
    http_thread.start()
    print(f"catalog-service admin HTTP en :{cfg.admin_http_port}", flush=True)

    # Apagado ordenado ante SIGINT/SIGTERM.
    def _shutdown(*_) -> None:
        print("apagando catalog-service...", flush=True)
        http_srv.shutdown()
        grpc_server.stop(5).wait()
        db.close()

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    grpc_server.wait_for_termination()


if __name__ == "__main__":
    serve()
