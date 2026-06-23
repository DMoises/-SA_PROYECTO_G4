FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum* ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o watchparty-service cmd/server/main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/watchparty-service ./watchparty-service

EXPOSE 50059
EXPOSE 8085

CMD ["./watchparty-service"]
