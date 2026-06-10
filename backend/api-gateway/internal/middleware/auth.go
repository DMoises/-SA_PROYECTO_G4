package middleware

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
)

// ctxKey es un tipo privado para las claves de contexto.
type ctxKey string

const (
	CtxUsuarioID ctxKey = "usuario_id"
	CtxRol       ctxKey = "rol"
	CtxCorreo    ctxKey = "correo"
)

// Auth valida la sesión antes de permitir el acceso a una ruta protegida.
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

			email := resp.GetEmail()
			if email == "" {
				email = extraerEmailDelJWT(token)
			}

			ctx := context.WithValue(r.Context(), CtxUsuarioID, resp.GetUsuarioId())
			ctx = context.WithValue(ctx, CtxRol, resp.GetRol())
			ctx = context.WithValue(ctx, CtxCorreo, email)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// extraerToken busca el JWT primero en la cookie session y luego en Authorization.
func extraerToken(r *http.Request) string {
	if cookie, err := r.Cookie("session"); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	header := r.Header.Get("Authorization")
	if strings.HasPrefix(header, "Bearer ") {
		return strings.TrimPrefix(header, "Bearer ")
	}
	return ""
}

// extraerEmailDelJWT decodifica el payload base64 del JWT para obtener el email.
// El token ya fue validado por ValidarToken, solo leemos los claims.
func extraerEmailDelJWT(token string) string {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return ""
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return ""
	}
	var claims struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return ""
	}
	return claims.Email
}
