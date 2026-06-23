package config

import "os"

type Config struct {
	Port              string
	WSPort            string
	JWTSecret         string
	SubscriptionDBURL string
}

func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "50059"
	}

	wsPort := os.Getenv("WS_PORT")
	if wsPort == "" {
		wsPort = "8085"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "merequetengue"
	}

	subURL := os.Getenv("SUBSCRIPTION_DB_URL")

	return Config{
		Port:              port,
		WSPort:            wsPort,
		JWTSecret:         jwtSecret,
		SubscriptionDBURL: subURL,
	}
}
