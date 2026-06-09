from concurrent import futures
import grpc

from app import fx_pb2_grpc
from app.fx_service import FXService


def serve():

    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10)
    )

    fx_pb2_grpc.add_FXServiceServicer_to_server(
        FXService(),
        server
    )

    server.add_insecure_port("[::]:50053")

    server.start()

    print("FX Service escuchando en puerto 50053")

    server.wait_for_termination()


if __name__ == "__main__":
    serve()