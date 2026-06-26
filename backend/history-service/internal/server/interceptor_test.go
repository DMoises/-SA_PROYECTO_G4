package server

import (
	"context"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

func TestAuthInterceptor_MissingMetadata(t *testing.T) {
	interceptor := NewAuthInterceptor("secret", "")
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "success", nil
	}

	_, err := interceptor.UnaryServerInterceptor()(context.Background(), nil, &grpc.UnaryServerInfo{}, handler)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	st, ok := status.FromError(err)
	if !ok || st.Code() != codes.Unauthenticated {
		t.Errorf("expected Unauthenticated status, got %v", err)
	}
}

func TestAuthInterceptor_MissingAuthorization(t *testing.T) {
	interceptor := NewAuthInterceptor("secret", "")
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "success", nil
	}

	md := metadata.Pairs("x-profile-id", "some-profile")
	ctx := metadata.NewIncomingContext(context.Background(), md)

	_, err := interceptor.UnaryServerInterceptor()(ctx, nil, &grpc.UnaryServerInfo{}, handler)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	st, ok := status.FromError(err)
	if !ok || st.Code() != codes.Unauthenticated {
		t.Errorf("expected Unauthenticated status, got %v", err)
	}
}

func TestAuthInterceptor_InvalidToken(t *testing.T) {
	interceptor := NewAuthInterceptor("secret", "")
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "success", nil
	}

	md := metadata.Pairs("authorization", "invalid-token-string")
	ctx := metadata.NewIncomingContext(context.Background(), md)

	_, err := interceptor.UnaryServerInterceptor()(ctx, nil, &grpc.UnaryServerInfo{}, handler)
	if err == nil {
		t.Fatal("expected error, got nil")
	}

	st, ok := status.FromError(err)
	if !ok || st.Code() != codes.Unauthenticated {
		t.Errorf("expected Unauthenticated status, got %v", err)
	}
}

func TestAuthInterceptor_ValidTokenPasses(t *testing.T) {
	secret := "secret"
	interceptor := NewAuthInterceptor(secret, "")
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "success", nil
	}

	// Generate a valid JWT token
	exp := time.Now().Add(time.Hour)
	claims := Claims{
		UsuarioID: "user-123",
		Rol:       "usuario",
		Email:     "user@test.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}

	md := metadata.Pairs("authorization", "Bearer "+tokenStr)
	ctx := metadata.NewIncomingContext(context.Background(), md)

	res, err := interceptor.UnaryServerInterceptor()(ctx, nil, &grpc.UnaryServerInfo{}, handler)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if res != "success" {
		t.Errorf("expected 'success', got %v", res)
	}
}
