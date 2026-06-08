// Package handlers expone los endpoints HTTP del gateway y los traduce a
// llamadas gRPC al auth-service.
package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
	"github.com/grupo4/quetxaltv-gateway/internal/config"
	"github.com/grupo4/quetxaltv-gateway/internal/middleware"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AuthHandler struct {
	auth *clients.AuthClient
	cfg  *config.Config
}

func NewAuthHandler(auth *clients.AuthClient, cfg *config.Config) *AuthHandler {
	return &AuthHandler{auth: auth, cfg: cfg}
}

// ---- POST /auth/register ----
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email        string `json:"email"`
		Password     string `json:"password"`
		NombrePerfil string `json:"nombre_perfil"`
	}
	if !decode(w, r, &body) {
		return
	}
	resp, err := h.auth.Registrar(r.Context(), body.Email, body.Password, body.NombrePerfil)
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{
		"usuario_id": resp.GetUsuarioId(),
		"perfil_id":  resp.GetPerfilId(),
	})
}

// ---- POST /auth/login ----
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	resp, err := h.auth.Login(r.Context(), body.Email, body.Password)
	if err != nil {
		writeGRPCError(w, err)
		return
	}

	// Guardamos el JWT en una Session Cookie segura (HttpOnly: el JS del
	// navegador no puede leerla, mitiga XSS).
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    resp.GetAccessToken(),
		Path:     "/",
		HttpOnly: true,
		Secure:   h.cfg.CookieSecure,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(resp.GetExpiraEn(), 0),
	})
	writeJSON(w, http.StatusOK, map[string]any{
		"usuario_id": resp.GetUsuarioId(),
		"expira_en":  resp.GetExpiraEn(),
	})
}

// ---- POST /auth/logout ----
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name: "session", Value: "", Path: "/",
		HttpOnly: true, Secure: h.cfg.CookieSecure,
		Expires: time.Unix(0, 0), MaxAge: -1,
	})
	writeJSON(w, http.StatusOK, map[string]string{"mensaje": "sesion cerrada"})
}

// ---- GET /auth/me ---- (protegida)
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"usuario_id": usuarioID(r),
		"rol":        rol(r),
	})
}

// ---- POST /auth/profiles ---- (protegida)
func (h *AuthHandler) CreateProfile(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Nombre     string `json:"nombre"`
		EsInfantil bool   `json:"es_infantil"`
		Idioma     string `json:"idioma"`
	}
	if !decode(w, r, &body) {
		return
	}
	// usuario_id viene del token validado, NO del body (seguridad).
	resp, err := h.auth.CrearPerfil(r.Context(), usuarioID(r), body.Nombre, body.Idioma, body.EsInfantil)
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

// ---- GET /auth/profiles ---- (protegida)
func (h *AuthHandler) ListProfiles(w http.ResponseWriter, r *http.Request) {
	resp, err := h.auth.ListarPerfiles(r.Context(), usuarioID(r))
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp.GetPerfiles())
}

// ------------------------- helpers -------------------------

func usuarioID(r *http.Request) string {
	v, _ := r.Context().Value(middleware.CtxUsuarioID).(string)
	return v
}
func rol(r *http.Request) string {
	v, _ := r.Context().Value(middleware.CtxRol).(string)
	return v
}

func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "JSON invalido"})
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// writeGRPCError traduce el codigo gRPC del auth-service al codigo HTTP
// equivalente para el cliente.
func writeGRPCError(w http.ResponseWriter, err error) {
	st, _ := status.FromError(err)
	httpCode := http.StatusInternalServerError
	switch st.Code() {
	case codes.AlreadyExists:
		httpCode = http.StatusConflict // 409
	case codes.Unauthenticated:
		httpCode = http.StatusUnauthorized // 401
	case codes.NotFound:
		httpCode = http.StatusNotFound // 404
	case codes.InvalidArgument:
		httpCode = http.StatusBadRequest // 400
	case codes.FailedPrecondition:
		httpCode = http.StatusUnprocessableEntity // 422
	}
	writeJSON(w, httpCode, map[string]string{"error": st.Message()})
}
