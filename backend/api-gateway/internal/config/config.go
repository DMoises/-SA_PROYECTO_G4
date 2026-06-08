// Package config carga la configuracion del API Gateway desde variables
// de entorno.
package config

import "os"

type Config struct {
	Port            string // puerto HTTP que expone el gateway
	AuthServiceAddr string // direccion gRPC del auth-service
	CookieSecure    bool   // true en produccion (HTTPS)
	CORSOrigin      string // origen permitido (el frontend)
}

func Load() *Config {
	return &Config{
		Port:            getEnv("GATEWAY_PORT", "8080"),
		AuthServiceAddr: getEnv("AUTH_SERVICE_ADDR", "auth-service:50051"),
		CookieSecure:    getEnv("COOKIE_SECURE", "false") == "true",
		CORSOrigin:      getEnv("CORS_ORIGIN", "http://localhost:3000"),
	}
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
