#!/bin/bash
apt-get update
apt-get install -y protobuf-compiler
export PATH=$PATH:/go/bin
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.33.0
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0
protoc --go_out=. --go_opt=module=github.com/grupo4/quetxaltv-auth --go-grpc_out=. --go-grpc_opt=module=github.com/grupo4/quetxaltv-auth proto/auth.proto proto/notification.proto
