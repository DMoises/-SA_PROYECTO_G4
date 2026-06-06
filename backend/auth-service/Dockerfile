# =====================================================================
# auth-service | Dockerfile (multi-stage)
# Etapa 1: genera el proto y compila el binario.
# Etapa 2: imagen minima con solo el binario.
# =====================================================================

FROM golang:1.22 AS build
WORKDIR /src

# Herramientas para generar el codigo gRPC desde el .proto
RUN apt-get update && apt-get install -y --no-install-recommends protobuf-compiler \
 && rm -rf /var/lib/apt/lists/*
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest \
 && go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
ENV PATH="/root/go/bin:${PATH}"

# Cache de dependencias
COPY go.mod go.sum* ./
RUN go mod download

# Codigo y generacion del proto
COPY . .
RUN make proto && go build -o /out/auth-service ./cmd/server

# ---------------------------------------------------------------------
FROM gcr.io/distroless/base-debian12
WORKDIR /
COPY --from=build /out/auth-service /auth-service
EXPOSE 50051
USER nonroot:nonroot
ENTRYPOINT ["/auth-service"]
