# =====================================================================
# api-gateway | Dockerfile (multi-stage)
# =====================================================================

FROM golang:1.23 AS build
WORKDIR /src

RUN apt-get update && apt-get install -y --no-install-recommends protobuf-compiler \
 && rm -rf /var/lib/apt/lists/*

# Versiones fijadas para evitar conflictos con actualizaciones de Go
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.33.0 \
 && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

ENV PATH="/root/go/bin:${PATH}"

COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN make proto && go mod tidy && go build -o /out/api-gateway ./cmd/server

# ---------------------------------------------------------------------
FROM gcr.io/distroless/base-debian12
WORKDIR /
COPY --from=build /out/api-gateway /api-gateway
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/api-gateway"]