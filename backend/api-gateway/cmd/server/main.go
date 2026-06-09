// Command server arranca el API Gateway: servidor HTTP que enruta hacia
// los microservicios via gRPC. Por ahora cablea el auth-service; los
// demas servicios se agregan con el mismo patron (cliente + handlers).
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
	"github.com/grupo4/quetxaltv-gateway/internal/config"
	"github.com/grupo4/quetxaltv-gateway/internal/handlers"
	"github.com/grupo4/quetxaltv-gateway/internal/middleware"
)

func main() {
	cfg := config.Load()

	// Cliente gRPC al auth-service.
	authClient, err := clients.NewAuthClient(cfg.AuthServiceAddr)
	if err != nil {
		log.Fatalf("no se pudo conectar al auth-service: %v", err)
	}
	defer authClient.Close()

	// Cliente gRPC al billing-service.
	billingClient, err := clients.NewBillingClient(cfg.BillingServiceAddr)
	if err != nil {
		log.Fatalf("no se pudo conectar al billing-service: %v", err)
	}
	defer billingClient.Close()


	h := handlers.NewAuthHandler(authClient, cfg)
	authMW := middleware.Auth(authClient)
  billingH := handlers.NewBillingHandler(billingClient)
	mux := http.NewServeMux()

	// Salud (util para healthcheck de Docker / GCP).
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// Rutas publicas de autenticacion.
	mux.HandleFunc("POST /auth/register", h.Register)
	mux.HandleFunc("POST /auth/login", h.Login)
	mux.HandleFunc("POST /auth/logout", h.Logout)

	// Rutas protegidas (pasan por el middleware de validacion de sesion).
	mux.Handle("GET /auth/me", authMW(http.HandlerFunc(h.Me)))
	mux.Handle("POST /auth/profiles", authMW(http.HandlerFunc(h.CreateProfile)))
	mux.Handle("GET /auth/profiles", authMW(http.HandlerFunc(h.ListProfiles)))

	// Rutas de billing
	mux.Handle("GET /billing/plans", authMW(http.HandlerFunc(billingH.GetPlans)))
	mux.Handle("POST /billing/subscriptions", authMW(http.HandlerFunc(billingH.CreateSubscription)))
	mux.Handle("GET /billing/subscriptions/me", authMW(http.HandlerFunc(billingH.GetUserSubscription)))
	mux.Handle("PUT /billing/subscriptions/change", authMW(http.HandlerFunc(billingH.ChangeSubscription)))
	mux.Handle("PUT /billing/subscriptions/cancel", authMW(http.HandlerFunc(billingH.CancelSubscription)))
	mux.Handle("POST /billing/plans/price", authMW(http.HandlerFunc(billingH.GetPlanPrice)))
	
	// CORS envuelve todo el router.
	handler := middleware.CORS(cfg.CORSOrigin)(mux)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Apagado ordenado.
	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("apagando api-gateway...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
	}()

	log.Printf("api-gateway escuchando HTTP en :%s -> auth-service en %s", cfg.Port, cfg.AuthServiceAddr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("error al servir HTTP: %v", err)
	}
}
