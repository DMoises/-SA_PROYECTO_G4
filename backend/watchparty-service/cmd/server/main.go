package main

import (
	"log"
	"net"
	"net/http"

	"github.com/grupo4/quetxaltv-watchparty/internal/config"
	"github.com/grupo4/quetxaltv-watchparty/internal/pb"
	"github.com/grupo4/quetxaltv-watchparty/internal/server"
	"google.golang.org/grpc"
)

func main() {
	cfg := config.Load()

	// 1. Start gRPC Server
	lis, err := net.Listen("tcp", ":"+cfg.Port)
	if err != nil {
		log.Fatalf("no se pudo escuchar en puerto gRPC %s: %v", cfg.Port, err)
	}

	authInterceptor := server.NewAuthInterceptor(cfg.JWTSecret, cfg.SubscriptionDBURL)
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(authInterceptor.UnaryServerInterceptor()),
	)

	wpServer := server.NewWatchPartyServer()
	pb.RegisterWatchPartyServiceServer(grpcServer, wpServer)

	go func() {
		log.Printf("watchparty-service gRPC escuchando en :%s", cfg.Port)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("error al iniciar gRPC server: %v", err)
		}
	}()

	// 2. Start HTTP/WebSocket Server
	http.HandleFunc("/ws", wpServer.HandleWebSocket)
	log.Printf("watchparty-service WebSocket escuchando en :%s", cfg.WSPort)
	if err := http.ListenAndServe(":"+cfg.WSPort, nil); err != nil {
		log.Fatalf("error al iniciar WebSocket server: %v", err)
	}
}
