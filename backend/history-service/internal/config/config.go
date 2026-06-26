package config

import "os"

type Config struct {
	Port              string
	DatabaseURL       string
	JWTSecret         string
	SubscriptionDBURL string
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8086"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "merequetengue"
	}

	return Config{
		Port:              port,
		DatabaseURL:       os.Getenv("DATABASE_URL"),
		JWTSecret:         jwtSecret,
		SubscriptionDBURL: os.Getenv("SUBSCRIPTION_DB_URL"),
	}
}