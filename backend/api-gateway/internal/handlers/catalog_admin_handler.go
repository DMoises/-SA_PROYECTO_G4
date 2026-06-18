package handlers

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// CatalogAdminHandler proxea las peticiones CRUD del panel de administracion
// hacia el servidor HTTP interno del catalog-service.
// El gateway solo reenvía la peticion despues de que Auth + AdminOnly la validaron.
type CatalogAdminHandler struct {
	adminBaseURL string // ej. "http://catalog-service:8086"
}

func NewCatalogAdminHandler(adminBaseURL string) *CatalogAdminHandler {
	return &CatalogAdminHandler{adminBaseURL: adminBaseURL}
}

// proxy reenvía cualquier metodo HTTP al backend admin del catalog-service,
// quitando el prefijo "/catalog" que el gateway agrega al path publico.
func (h *CatalogAdminHandler) proxy(w http.ResponseWriter, r *http.Request) {
	backendPath := strings.TrimPrefix(r.URL.RequestURI(), "/catalog")
	targetURL := fmt.Sprintf("%s%s", h.adminBaseURL, backendPath)

	var bodyReader io.Reader = r.Body
	var contentLength int64 = r.ContentLength

	if r.Method == http.MethodPost || r.Method == http.MethodPut {
		bodyBytes, err := io.ReadAll(r.Body)
		if err == nil {
			bodyReader = bytes.NewReader(bodyBytes)
			contentLength = int64(len(bodyBytes))
		}
	}

	proxyReq, err := http.NewRequestWithContext(r.Context(), r.Method, targetURL, bodyReader)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "error interno"})
		return
	}
	proxyReq.ContentLength = contentLength

	if ct := r.Header.Get("Content-Type"); ct != "" {
		proxyReq.Header.Set("Content-Type", ct)
	}

	resp, err := http.DefaultClient.Do(proxyReq)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "catalog-admin no disponible"})
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func (h *CatalogAdminHandler) ListarContenidos(w http.ResponseWriter, r *http.Request)  { h.proxy(w, r) }
func (h *CatalogAdminHandler) CrearContenido(w http.ResponseWriter, r *http.Request)    { h.proxy(w, r) }
func (h *CatalogAdminHandler) ObtenerContenido(w http.ResponseWriter, r *http.Request)  { h.proxy(w, r) }
func (h *CatalogAdminHandler) ActualizarContenido(w http.ResponseWriter, r *http.Request) { h.proxy(w, r) }
func (h *CatalogAdminHandler) EliminarContenido(w http.ResponseWriter, r *http.Request) { h.proxy(w, r) }
func (h *CatalogAdminHandler) ListarGeneros(w http.ResponseWriter, r *http.Request)     { h.proxy(w, r) }
func (h *CatalogAdminHandler) ListarCategorias(w http.ResponseWriter, r *http.Request)  { h.proxy(w, r) }
