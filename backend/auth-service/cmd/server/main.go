// Command server arranca el microservicio de Identidad (auth-service).
// Conecta la configuracion, el pool de PostgreSQL, el repositorio, el
// servicio y el handler gRPC, y escucha en el puerto configurado.
package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/joho/godotenv/autoload"
	"github.com/grupo4/quetxaltv-auth/internal/config"
	grpcserver "github.com/grupo4/quetxaltv-auth/internal/grpc"
	"github.com/grupo4/quetxaltv-auth/internal/pb"
	"github.com/grupo4/quetxaltv-auth/internal/repository"
	"github.com/grupo4/quetxaltv-auth/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	// Pool de conexiones a auth_db.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, cfg.DSN)
	if err != nil {
		log.Fatalf("no se pudo crear el pool de PostgreSQL: %v", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("no hay conexion a auth_db: %v", err)
	}

	// Inyeccion de dependencias: repo -> service -> handler.
	repo := repository.NewPostgresUsuarioRepo(pool)
	jwtMgr := service.NewJWTManager(cfg.JWTSecret, cfg.JWTTTL)
	authSvc := service.NewAuthService(repo, jwtMgr)
	handler := grpcserver.NewAuthHandler(authSvc)

	// Servidor gRPC.
	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		log.Fatalf("no se pudo escuchar en el puerto %s: %v", cfg.GRPCPort, err)
	}
	grpcSrv := grpc.NewServer()
	pb.RegisterAuthServiceServer(grpcSrv, handler)
	reflection.Register(grpcSrv) // util para probar con grpcurl/Postman

	// Apagado ordenado ante SIGINT/SIGTERM.
	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("apagando auth-service...")
		grpcSrv.GracefulStop()
	}()

	log.Printf("auth-service escuchando gRPC en :%s", cfg.GRPCPort)
	if err := grpcSrv.Serve(lis); err != nil {
		log.Fatalf("error al servir gRPC: %v", err)
	}
}
