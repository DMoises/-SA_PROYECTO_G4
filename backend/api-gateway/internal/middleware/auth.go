package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
)

// ctxKey es un tipo privado para las claves de contexto (evita colisiones).
type ctxKey string

const (
	CtxUsuarioID ctxKey = "usuario_id"
	CtxRol       ctxKey = "rol"
)

// Auth valida la sesion ANTES de dejar pasar a una ruta protegida.
// Toma el JWT de la cookie 'session' (o del header Authorization), lo
// valida llamando por gRPC al auth-service, y propaga la identidad por el
// contexto de la peticion. Asi se centraliza la seguridad en el gateway,
// como exige el enunciado.
func Auth(auth *clients.AuthClient) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := extraerToken(r)
			if token == "" {
				http.Error(w, `{"error":"no autenticado"}`, http.StatusUnauthorized)
				return
			}

			resp, err := auth.ValidarToken(r.Context(), token)
			if err != nil || !resp.GetValido() {
				http.Error(w, `{"error":"sesion invalida o expirada"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), CtxUsuarioID, resp.GetUsuarioId())
			ctx = context.WithValue(ctx, CtxRol, resp.GetRol())
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// extraerToken busca el JWT primero en la cookie 'session', luego en el
// header Authorization: Bearer <token>.
func extraerToken(r *http.Request) string {
	if c, err := r.Cookie("session"); err == nil && c.Value != "" {
		return c.Value
	}
	if h := r.Header.Get("Authorization"); strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	return ""
}
