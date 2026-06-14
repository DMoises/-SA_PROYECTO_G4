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

	historyClient, err := clients.NewHistoryClient(cfg.HistoryServiceAddr)
	if err != nil {
		log.Fatalf("no se pudo conectar al history-service: %v", err)
	}
	defer historyClient.Close()
	// Cliente gRPC al catalog-service.
	catalogClient, err := clients.NewCatalogClient(cfg.CatalogServiceAddr)
	if err != nil {
		log.Fatalf("no se pudo conectar al catalog-service: %v", err)
	}
	defer catalogClient.Close()

	// Cliente gRPC al rating-service.
	ratingClient, err := clients.NewRatingClient(cfg.RatingServiceAddr)
	if err != nil {
		log.Fatalf("no se pudo conectar al rating-service: %v", err)
	}
	defer ratingClient.Close()

	h := handlers.NewAuthHandler(authClient, cfg)
	authMW := middleware.Auth(authClient)
	adminMW := middleware.AdminOnly
	billingH := handlers.NewBillingHandler(billingClient)
	catalogH := handlers.NewCatalogHandler(catalogClient)
	catalogAdminH := handlers.NewCatalogAdminHandler(cfg.CatalogAdminHTTPAddr)
	ratingH := handlers.NewRatingHandler(ratingClient)
	historyH := handlers.NewHistoryHandler(historyClient)
	adminH := handlers.NewAdminHandler(cfg)
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
	mux.Handle("PUT /auth/me/password", authMW(http.HandlerFunc(h.ChangePassword)))
	mux.Handle("POST /auth/profiles", authMW(http.HandlerFunc(h.CreateProfile)))
	mux.Handle("GET /auth/profiles", authMW(http.HandlerFunc(h.ListProfiles)))
	mux.Handle("PUT /auth/profiles/{id}", authMW(http.HandlerFunc(h.UpdateProfile)))
	mux.Handle("DELETE /auth/profiles/{id}", authMW(http.HandlerFunc(h.DeleteProfile)))
	mux.Handle("GET /admin/audit-logs", authMW(http.HandlerFunc(adminH.GetAuditLogs)))

	// Rutas de billing
	mux.Handle("GET /billing/plans", authMW(http.HandlerFunc(billingH.GetPlans)))
	mux.Handle("POST /billing/subscriptions", authMW(http.HandlerFunc(billingH.CreateSubscription)))
	mux.Handle("GET /billing/subscriptions/me", authMW(http.HandlerFunc(billingH.GetUserSubscription)))
	mux.Handle("PUT /billing/subscriptions/change", authMW(http.HandlerFunc(billingH.ChangeSubscription)))
	mux.Handle("PUT /billing/subscriptions/cancel", authMW(http.HandlerFunc(billingH.CancelSubscription)))
	mux.Handle("POST /billing/plans/price", authMW(http.HandlerFunc(billingH.GetPlanPrice)))

	// Rutas de catalogo (solo lectura, publicas: navegar el catalogo).
	mux.HandleFunc("GET /catalog/cartelera", catalogH.ExplorarCartelera)
	mux.HandleFunc("GET /catalog/buscar", catalogH.BuscarContenido)
	mux.HandleFunc("GET /catalog/contenido/{id}", catalogH.ObtenerFichaTecnica)

	// Rutas de administracion del catalogo (requieren sesion + rol admin).
	adminChain := func(h http.HandlerFunc) http.Handler {
		return authMW(adminMW(http.HandlerFunc(h)))
	}
	mux.Handle("GET /catalog/admin/contenidos", adminChain(catalogAdminH.ListarContenidos))
	mux.Handle("POST /catalog/admin/contenidos", adminChain(catalogAdminH.CrearContenido))
	mux.Handle("GET /catalog/admin/contenidos/{id}", adminChain(catalogAdminH.ObtenerContenido))
	mux.Handle("PUT /catalog/admin/contenidos/{id}", adminChain(catalogAdminH.ActualizarContenido))
	mux.Handle("DELETE /catalog/admin/contenidos/{id}", adminChain(catalogAdminH.EliminarContenido))
	mux.Handle("GET /catalog/admin/generos", adminChain(catalogAdminH.ListarGeneros))
	mux.Handle("GET /catalog/admin/categorias", adminChain(catalogAdminH.ListarCategorias))

	// Rutas de calificaciones (rating). Calificar requiere sesion (RFS-04.1);
	// el % de recomendacion es publico.
	mux.Handle("POST /ratings", authMW(http.HandlerFunc(ratingH.Calificar)))
	mux.HandleFunc("GET /ratings/{contenido_id}", ratingH.ObtenerRecomendacion)
	mux.Handle("GET /ratings/{contenido_id}/usuario", authMW(http.HandlerFunc(ratingH.ObtenerCalificacionUsuario)))

	mux.Handle("POST /history/progress", authMW(http.HandlerFunc(historyH.SaveProgress)))
	mux.Handle("GET /history/{perfilId}", authMW(http.HandlerFunc(historyH.GetHistory)))
	mux.Handle("GET /history/{perfilId}/resume/{contenidoId}", authMW(http.HandlerFunc(historyH.GetResume)))

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
