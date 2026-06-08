# =====================================================================
# api-gateway | Makefile
# =====================================================================

# Genera el cliente gRPC desde el contrato proto.
# Requiere protoc, protoc-gen-go y protoc-gen-go-grpc.
.PHONY: proto
proto:
	mkdir -p internal/pb
	protoc --go_out=. --go_opt=module=github.com/grupo4/quetxaltv-gateway \
	       --go-grpc_out=. --go-grpc_opt=module=github.com/grupo4/quetxaltv-gateway \
	       proto/auth.proto

.PHONY: deps
deps:
	go mod tidy

.PHONY: build
build:
	go build -o bin/api-gateway ./cmd/server

.PHONY: run
run:
	go run ./cmd/server

.PHONY: clean
clean:
	rm -rf bin internal/pb
