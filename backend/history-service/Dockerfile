FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY history-service ./history-service

WORKDIR /app/history-service

RUN go mod download
RUN go build -o history-service .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/history-service/history-service .

EXPOSE 50056

CMD ["./history-service"]