# =====================================================================
# auth-service | Makefile
# =====================================================================

# Genera el codigo Go a partir del contrato proto.
# Requiere: protoc, protoc-gen-go y protoc-gen-go-grpc instalados.
#   go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
#   go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
.PHONY: proto
proto:
	mkdir -p internal/pb
	protoc --go_out=. --go_opt=module=github.com/grupo4/quetxaltv-auth \
	       --go-grpc_out=. --go-grpc_opt=module=github.com/grupo4/quetxaltv-auth \
	       proto/auth.proto

.PHONY: deps
deps:
	go mod tidy

.PHONY: build
build:
	go build -o bin/auth-service ./cmd/server

.PHONY: run
run:
	go run ./cmd/server

.PHONY: clean
clean:
	rm -rf bin internal/pb
