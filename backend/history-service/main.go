package main

import (
	"log"
	"net"

	"github.com/grupo4/quetxaltv-history/internal/pb"
	"github.com/grupo4/quetxaltv-history/internal/config"
	"github.com/grupo4/quetxaltv-history/internal/database"
	"github.com/grupo4/quetxaltv-history/internal/repository"
	historyserver "github.com/grupo4/quetxaltv-history/internal/server"
	"github.com/grupo4/quetxaltv-history/internal/service"
	"google.golang.org/grpc"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("no se pudo conectar a history-db: %v", err)
	}
	defer db.Close()

	repo := repository.NewHistoryRepository(db)
	svc := service.NewHistoryService(repo)
	srv := historyserver.NewHistoryServer(svc)

	lis, err := net.Listen("tcp", ":"+cfg.Port)
	if err != nil {
		log.Fatalf("no se pudo escuchar en el puerto %s: %v", cfg.Port, err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterHistoryServiceServer(grpcServer, srv)

	log.Printf("history-service gRPC escuchando en :%s", cfg.Port)

	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("error al iniciar history-service: %v", err)
	}
}