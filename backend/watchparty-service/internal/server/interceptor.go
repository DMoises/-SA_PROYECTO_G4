package server

import (
	"context"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type Claims struct {
	UsuarioID string `json:"usuario_id"`
	Rol       string `json:"rol"`
	Email     string `json:"email"`
	jwt.RegisteredClaims
}

type AuthInterceptor struct {
	jwtSecret         []byte
	subscriptionDBURL string
}

func NewAuthInterceptor(jwtSecret string, subscriptionDBURL string) *AuthInterceptor {
	return &AuthInterceptor{
		jwtSecret:         []byte(jwtSecret),
		subscriptionDBURL: subscriptionDBURL,
	}
}

func (i *AuthInterceptor) UnaryServerInterceptor() grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "metadata is missing")
		}

		authHeaders := md.Get("authorization")
		if len(authHeaders) == 0 {
			return nil, status.Error(codes.Unauthenticated, "authorization token is missing")
		}

		authHeader := authHeaders[0]
		tokenStr := ""
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			tokenStr = authHeader
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return i.jwtSecret, nil
		})

		if err != nil || !token.Valid {
			return nil, status.Errorf(codes.Unauthenticated, "invalid or expired token: %v", err)
		}

		if i.subscriptionDBURL != "" {
			planName, err := i.queryActivePlan(ctx, claims.UsuarioID)
			if err != nil {
				return nil, status.Errorf(codes.Internal, "failed to validate subscription: %v", err)
			}

			// Solo usuarios Premium pueden crear/iniciar salas
			if strings.Contains(info.FullMethod, "CrearSala") {
				if planName != "Premium" {
					return nil, status.Error(codes.PermissionDenied, "solo los suscriptores Premium pueden iniciar salas de Watch Party")
				}
			} else {
				// Cualquier plan activo puede validar o unirse
				if planName == "" {
					return nil, status.Error(codes.PermissionDenied, "se requiere suscripcion activa para participar en Watch Party")
				}
			}
		}

		return handler(ctx, req)
	}
}

func (i *AuthInterceptor) queryActivePlan(ctx context.Context, usuarioID string) (string, error) {
	conn, err := pgx.Connect(ctx, i.subscriptionDBURL)
	if err != nil {
		return "", err
	}
	defer conn.Close(ctx)

	var planName string
	query := `
		SELECT p.nombre_plan 
		FROM suscripciones s
		INNER JOIN planes p ON p.id = s.plan_id
		WHERE s.usuario_id = $1 AND s.estado_suscripcion = 'activa'
		LIMIT 1
	`
	err = conn.QueryRow(ctx, query, usuarioID).Scan(&planName)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", nil
		}
		return "", err
	}

	return planName, nil
}
