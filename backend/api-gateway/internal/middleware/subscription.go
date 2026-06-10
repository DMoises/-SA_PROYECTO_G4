package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
)

// RequireActiveSubscription comprueba que el usuario autenticado tenga
// una suscripcion activa antes de permitir el acceso al contenido.
func RequireActiveSubscription(
	billing *clients.BillingClient,
) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			usuarioID, ok := r.Context().Value(CtxUsuarioID).(string)

			if !ok || strings.TrimSpace(usuarioID) == "" {
				writeSubscriptionError(
					w,
					http.StatusUnauthorized,
					"no autenticado",
				)
				return
			}

			suscripcion, err := billing.GetUserSubscription(
				r.Context(),
				usuarioID,
			)

			if err != nil {
				writeSubscriptionError(
					w,
					http.StatusServiceUnavailable,
					"no se pudo verificar la suscripcion",
				)
				return
			}

			tieneSuscripcion :=
				suscripcion.GetSuscripcionId() != "" &&
					strings.EqualFold(
						suscripcion.GetEstadoSuscripcion(),
						"activa",
					)

			if !tieneSuscripcion {
				writeSubscriptionError(
					w,
					http.StatusForbidden,
					"necesitas una suscripcion activa para reproducir contenido",
				)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func writeSubscriptionError(
	w http.ResponseWriter,
	status int,
	message string,
) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	_ = json.NewEncoder(w).Encode(map[string]string{
		"error": message,
	})
}