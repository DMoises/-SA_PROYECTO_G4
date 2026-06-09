"""Arranca el rating-service: conecta config -> pool -> repo -> service ->
handler gRPC, y escucha en el puerto configurado."""
import signal
from concurrent import futures

import grpc
from grpc_reflection.v1alpha import reflection

from .config import Config
from .db import Database
from .handler import RatingHandler
from .pb import rating_pb2 as pb
from .pb import rating_pb2_grpc as pb_grpc
from .repository import RatingRepository
from .service import RatingService


def serve() -> None:
    cfg = Config()

    db = Database(cfg)
    repo = RatingRepository(db)
    service = RatingService(repo)
    handler = RatingHandler(service)

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    pb_grpc.add_RatingServiceServicer_to_server(handler, server)

    service_names = (
        pb.DESCRIPTOR.services_by_name["RatingService"].full_name,
        reflection.SERVICE_NAME,
    )
    reflection.enable_server_reflection(service_names, server)

    server.add_insecure_port(f"[::]:{cfg.grpc_port}")
    server.start()
    print(f"rating-service escuchando gRPC en :{cfg.grpc_port}", flush=True)

    def _shutdown(*_) -> None:
        print("apagando rating-service...", flush=True)
        server.stop(5).wait()
        db.close()

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    server.wait_for_termination()


if __name__ == "__main__":
    serve()
