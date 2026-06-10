# =====================================================================
# api-gateway | Makefile
# =====================================================================

MODULE := github.com/grupo4/quetxaltv-gateway
PROTO_FILES := $(wildcard proto/*.proto)

.PHONY: proto
proto:
	mkdir -p internal/pb
	rm -f internal/pb/*.pb.go
	protoc -I=. \
		--go_out=. \
		--go_opt=module=$(MODULE) \
		--go-grpc_out=. \
		--go-grpc_opt=module=$(MODULE) \
		$(PROTO_FILES)

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