# =====================================================================
# rating-service | Dockerfile (multi-stage, Python/gRPC)
# =====================================================================

# ---- build: genera los stubs gRPC desde el .proto ----
FROM python:3.12-slim AS build
WORKDIR /gen
RUN pip install --no-cache-dir grpcio-tools==1.68.1
COPY proto ./proto
RUN mkdir -p pb \
 && python -m grpc_tools.protoc -I proto \
      --python_out=pb --grpc_python_out=pb --pyi_out=pb proto/rating.proto \
 && sed -i 's/^import rating_pb2/from . import rating_pb2/' pb/rating_pb2_grpc.py

# ---- runtime: solo dependencias de ejecucion ----
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY proto ./proto
COPY --from=build /gen/pb/ ./app/pb/
EXPOSE 50056
CMD ["python", "-m", "app.server"]
