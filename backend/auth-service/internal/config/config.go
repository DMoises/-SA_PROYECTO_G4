// Package config carga la configuracion desde variables de entorno.
// Toda la informacion sensible viene del archivo .env (no del codigo).
package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	GRPCPort  string
	DSN       string // cadena de conexion a PostgreSQL
	JWTSecret string
	JWTTTL    time.Duration
}

// Load construye la configuracion. Devuelve error si falta algo critico.
func Load() (*Config, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET es obligatorio")
	}

	ttlMin := getInt("JWT_TTL_MIN", 60) // 60 minutos por defecto

	cfg := &Config{
		GRPCPort:  getEnv("GRPC_PORT", "50051"),
		JWTSecret: jwtSecret,
		JWTTTL:    time.Duration(ttlMin) * time.Minute,
		DSN: fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			getEnv("AUTH_DB_USER", "auth_user"),
			os.Getenv("AUTH_DB_PASSWORD"),
			getEnv("AUTH_DB_HOST", "auth-db"),
			getEnv("AUTH_DB_PORT_INTERNAL", "5432"),
			getEnv("AUTH_DB_NAME", "auth_db"),
			getEnv("DB_SSLMODE", "disable"),
		),
	}
	return cfg, nil
}

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getInt(k string, def int) int {
	if v := os.Getenv(k); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return def
}
