# =====================================================================
# TAREA 3 — Imagen del Job de correos de estreno (estreno-notify)
#
# Contenedor STANDALONE y ligero que ejecuta notificar_estrenos.py:
# habla SQL con catalog-db / auth-db (psycopg2) y gRPC con
# notification-service (grpcio). Los stubs Python se generan EN BUILD a
# partir de notification.proto (copiado de backend/notification-service/proto),
# de modo que el contrato gRPC queda fijado dentro de la imagen.
#
# Build (desde k8s/cronjobs/estreno-notify/):
#   docker build -t tu-registro/quetxal-estreno-notify:latest .
# =====================================================================
FROM python:3.12-slim

WORKDIR /app

# grpcio + tools para generar los stubs; psycopg2-binary para las dos BD.
RUN pip install --no-cache-dir \
        "grpcio==1.71.0" \
        "grpcio-tools==1.71.0" \
        "psycopg2-binary==2.9.10"

# Contrato gRPC y generación de stubs (notification_pb2.py / _pb2_grpc.py).
COPY notification.proto ./
RUN python -m grpc_tools.protoc \
        -I. \
        --python_out=. \
        --grpc_python_out=. \
        notification.proto

COPY notificar_estrenos.py ./

# Usuario no-root (Requisito de seguridad: no correr como root).
RUN useradd --no-create-home --uid 10001 estreno
USER 10001

ENTRYPOINT ["python", "notificar_estrenos.py"]
