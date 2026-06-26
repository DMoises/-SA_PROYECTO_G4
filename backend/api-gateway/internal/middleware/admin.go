package middleware

import "net/http"

// AdminOnly verifica que el usuario autenticado tenga rol "admin".
// Debe encadenarse DESPUES de Auth (que ya valido el token y poblo el contexto).
func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rol, _ := r.Context().Value(CtxRol).(string)
		if rol != "admin" {
			http.Error(w, `{"error":"acceso restringido a administradores"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
