#!/usr/bin/env bash
# Genera los stubs gRPC de Python (rating_pb2.py, rating_pb2_grpc.py,
# rating_pb2.pyi) a partir de proto/rating.proto, en app/pb/.
# Requiere: pip install grpcio-tools
set -euo pipefail

cd "$(dirname "$0")"

python -m grpc_tools.protoc \
  -I proto \
  --python_out=app/pb \
  --grpc_python_out=app/pb \
  --pyi_out=app/pb \
  proto/rating.proto

# El *_grpc.py generado usa 'import rating_pb2'; lo convertimos a import relativo.
sed -i 's/^import rating_pb2/from . import rating_pb2/' app/pb/rating_pb2_grpc.py

echo "Stubs generados en app/pb/"
