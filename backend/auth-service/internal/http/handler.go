// Package httpserver expone un servidor HTTP interno para operaciones que
// no se exponen via gRPC (e.g. cambio de contraseña con verificacion bcrypt).
package httpserver

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/grupo4/quetxaltv-auth/internal/domain"
	"github.com/grupo4/quetxaltv-auth/internal/service"
)

type Handler struct {
	svc *service.AuthService
}

func NewHandler(svc *service.AuthService) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("PUT /change-password", h.ChangePassword)
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}

type changePasswordRequest struct {
	UsuarioID       string `json:"usuario_id"`
	PasswordActual  string `json:"password_actual"`
	PasswordNuevo   string `json:"password_nuevo"`
}

func (h *Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	var body changePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON invalido"})
		return
	}
	if body.UsuarioID == "" || body.PasswordActual == "" || body.PasswordNuevo == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Faltan campos requeridos"})
		return
	}

	err := h.svc.CambiarPassword(context.Background(), body.UsuarioID, body.PasswordActual, body.PasswordNuevo)
	if err != nil {
		code := http.StatusInternalServerError
		msg := "Error interno"
		switch err {
		case domain.ErrCredencialesInvalidas:
			code = http.StatusUnauthorized
			msg = "Contraseña actual incorrecta"
		case domain.ErrDatosInvalidos:
			code = http.StatusBadRequest
			msg = "La nueva contraseña debe tener al menos 8 caracteres"
		case domain.ErrUsuarioNoEncontrado:
			code = http.StatusNotFound
			msg = "Usuario no encontrado"
		case domain.ErrCuentaSoloOAuth:
			code = http.StatusBadRequest
			msg = "Esta cuenta usa inicio de sesion externo"
		}
		writeJSON(w, code, map[string]string{"error": msg})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"mensaje": "Contraseña actualizada"})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
