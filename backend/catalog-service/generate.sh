#!/usr/bin/env bash
# Genera los stubs gRPC de Python (catalog_pb2.py, catalog_pb2_grpc.py,
# catalog_pb2.pyi) a partir de proto/catalog.proto, en app/pb/.
# Requiere: pip install grpcio-tools
set -euo pipefail

cd "$(dirname "$0")"

python -m grpc_tools.protoc \
  -I proto \
  --python_out=app/pb \
  --grpc_python_out=app/pb \
  --pyi_out=app/pb \
  proto/catalog.proto

# El *_grpc.py generado usa 'import catalog_pb2'; lo convertimos a import
# relativo del paquete para que funcione como 'app.pb.catalog_pb2_grpc'.
sed -i 's/^import catalog_pb2/from . import catalog_pb2/' app/pb/catalog_pb2_grpc.py

echo "Stubs generados en app/pb/"
