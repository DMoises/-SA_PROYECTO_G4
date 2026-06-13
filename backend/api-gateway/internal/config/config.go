// Package config carga la configuracion del API Gateway desde variables
// de entorno.
package config

import "os"

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

type Config struct {
	Port                string // puerto HTTP que expone el gateway
	AuthServiceAddr     string // direccion gRPC del auth-service
	AuthServiceHTTPAddr string // direccion HTTP interna del auth-service
	CookieSecure        bool   // true en produccion (HTTPS)
	BillingServiceAddr  string // direccion gRPC del billing-service
	CatalogServiceAddr  string // direccion gRPC del catalog-service
	RatingServiceAddr   string // direccion gRPC del rating-service
	CORSOrigin          string // origen permitido (el frontend)
	HistoryServiceAddr  string // direccion gRPC del history-service

	// DB configs
	AuthDB         DBConfig
	SubscriptionDB DBConfig
	CatalogDB      DBConfig
	RatingDB       DBConfig
	FXDB           DBConfig
	HistoryDB      DBConfig
	NotificationDB DBConfig
}

func Load() *Config {
	authHost := getEnv("AUTH_DB_HOST", "auth-db")
	subHost := getEnv("SUBSCRIPTION_DB_HOST", "subscription-db")
	catHost := getEnv("CATALOG_DB_HOST", "catalog-db")
	ratHost := getEnv("RATING_DB_HOST", "rating-db")
	fxHost := getEnv("FX_DB_HOST", "fx-db")
	histHost := getEnv("HISTORY_DB_HOST", "history-db")
	notHost := getEnv("NOTIFICATION_DB_HOST", "notification-db")

	return &Config{
		Port:                getEnv("GATEWAY_PORT", "8080"),
		AuthServiceAddr:     getEnv("AUTH_SERVICE_ADDR", "auth-service:50051"),
		AuthServiceHTTPAddr: getEnv("AUTH_SERVICE_HTTP_ADDR", "http://auth-service:8081"),
		CookieSecure:        getEnv("COOKIE_SECURE", "false") == "true",
		BillingServiceAddr:  getEnv("BILLING_SERVICE_ADDR", "billing-service:50052"),
		CatalogServiceAddr:  getEnv("CATALOG_SERVICE_ADDR", "catalog-service:50055"),
		RatingServiceAddr:   getEnv("RATING_SERVICE_ADDR", "rating-service:50056"),
		CORSOrigin:          getEnv("CORS_ORIGIN", "http://localhost:3000"),
		HistoryServiceAddr:  getEnv("HISTORY_SERVICE_ADDR", "history-service:50057"),

		AuthDB: DBConfig{
			Host:     authHost,
			Port:     getDBPort(getEnv("AUTH_DB_PORT", "5433"), authHost),
			User:     getEnv("AUTH_DB_USER", "auth_user"),
			Password: getEnv("AUTH_DB_PASSWORD", "admin"),
			Name:     getEnv("AUTH_DB_NAME", "auth_db"),
		},
		SubscriptionDB: DBConfig{
			Host:     subHost,
			Port:     getDBPort(getEnv("SUBSCRIPTION_DB_PORT", "5434"), subHost),
			User:     getEnv("SUBSCRIPTION_DB_USER", "subscription_user"),
			Password: getEnv("SUBSCRIPTION_DB_PASSWORD", "admin"),
			Name:     getEnv("SUBSCRIPTION_DB_NAME", "subscription_db"),
		},
		CatalogDB: DBConfig{
			Host:     catHost,
			Port:     getDBPort(getEnv("CATALOG_DB_PORT", "5435"), catHost),
			User:     getEnv("CATALOG_DB_USER", "catalog_user"),
			Password: getEnv("CATALOG_DB_PASSWORD", "admin"),
			Name:     getEnv("CATALOG_DB_NAME", "catalog_db"),
		},
		RatingDB: DBConfig{
			Host:     ratHost,
			Port:     getDBPort(getEnv("RATING_DB_PORT", "5436"), ratHost),
			User:     getEnv("RATING_DB_USER", "rating_user"),
			Password: getEnv("RATING_DB_PASSWORD", "admin"),
			Name:     getEnv("RATING_DB_NAME", "rating_db"),
		},
		FXDB: DBConfig{
			Host:     fxHost,
			Port:     getDBPort(getEnv("FX_DB_PORT", "5437"), fxHost),
			User:     getEnv("FX_DB_USER", "fx_user"),
			Password: getEnv("FX_DB_PASSWORD", "admin"),
			Name:     getEnv("FX_DB_NAME", "fx_db"),
		},
		HistoryDB: DBConfig{
			Host:     histHost,
			Port:     getDBPort(getEnv("HISTORY_DB_PORT", "5438"), histHost),
			User:     getEnv("HISTORY_DB_USER", "history_user"),
			Password: getEnv("HISTORY_DB_PASSWORD", "admin"),
			Name:     getEnv("HISTORY_DB_NAME", "history_db"),
		},
		NotificationDB: DBConfig{
			Host:     notHost,
			Port:     getDBPort(getEnv("NOTIFICATION_DB_PORT", "5439"), notHost),
			User:     getEnv("NOTIFICATION_DB_USER", "notification_user"),
			Password: getEnv("NOTIFICATION_DB_PASSWORD", "admin"),
			Name:     getEnv("NOTIFICATION_DB_NAME", "notification_db"),
		},
	}
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getDBPort(envPort, host string) string {
	if host == "localhost" || host == "127.0.0.1" {
		return envPort
	}
	return "5432"
}
