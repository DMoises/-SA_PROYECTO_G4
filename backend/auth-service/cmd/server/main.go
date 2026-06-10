// Command server arranca el microservicio de Identidad (auth-service).
// Conecta la configuracion, el pool de PostgreSQL, el repositorio, el
// servicio y los handlers gRPC + HTTP, y escucha en los puertos configurados.
package main

import (
	"context"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/joho/godotenv/autoload"
	"github.com/grupo4/quetxaltv-auth/internal/config"
	grpcserver "github.com/grupo4/quetxaltv-auth/internal/grpc"
	httpserver "github.com/grupo4/quetxaltv-auth/internal/http"
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

	// Conexion al servicio de notificaciones.
	notifConn, err := grpc.Dial(cfg.NotificationURL, grpc.WithInsecure())
	if err != nil {
		log.Printf("advertencia: no se pudo conectar al servicio de notificaciones: %v", err)
	}
	defer notifConn.Close()
	notifClient := pb.NewNotificationServiceClient(notifConn)

	// Inyeccion de dependencias: repo -> service -> handlers.
	repo := repository.NewPostgresUsuarioRepo(pool)
	jwtMgr := service.NewJWTManager(cfg.JWTSecret, cfg.JWTTTL)
	authSvc := service.NewAuthService(repo, jwtMgr, notifClient)

	// Servidor gRPC.
	grpcHandler := grpcserver.NewAuthHandler(authSvc)
	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		log.Fatalf("no se pudo escuchar en el puerto %s: %v", cfg.GRPCPort, err)
	}
	grpcSrv := grpc.NewServer()
	pb.RegisterAuthServiceServer(grpcSrv, grpcHandler)
	reflection.Register(grpcSrv)

	go func() {
		log.Printf("auth-service escuchando gRPC en :%s", cfg.GRPCPort)
		if err := grpcSrv.Serve(lis); err != nil {
			log.Printf("gRPC error: %v", err)
		}
	}()

	// Servidor HTTP interno (cambio de contraseña y otros endpoints REST).
	httpMux := http.NewServeMux()
	httpserver.NewHandler(authSvc).RegisterRoutes(httpMux)
	httpSrv := &http.Server{
		Addr:         ":" + cfg.HTTPPort,
		Handler:      httpMux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("auth-service escuchando HTTP en :%s", cfg.HTTPPort)
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("HTTP error: %v", err)
		}
	}()

	// Apagado ordenado ante SIGINT/SIGTERM.
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig
	log.Println("apagando auth-service...")
	grpcSrv.GracefulStop()
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutCancel()
	_ = httpSrv.Shutdown(shutCtx)
}
