package handlers

import (
	"net/http"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
)

type CatalogHandler struct {
	catalog *clients.CatalogClient
}

func NewCatalogHandler(catalog *clients.CatalogClient) *CatalogHandler {
	return &CatalogHandler{catalog: catalog}
}

// GET /catalog/cartelera -> toda la cartelera activa.
func (h *CatalogHandler) ExplorarCartelera(w http.ResponseWriter, r *http.Request) {
	resp, err := h.catalog.ExplorarCartelera(r.Context())
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp.GetItems())
}

// GET /catalog/buscar?titulo=&categoria=&genero=&actor= -> filtros opcionales.
func (h *CatalogHandler) BuscarContenido(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	resp, err := h.catalog.BuscarContenido(r.Context(),
		q.Get("titulo"), q.Get("categoria"), q.Get("genero"), q.Get("actor"))
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp.GetItems())
}

// GET /catalog/contenido/{id} -> ficha tecnica + reparto (+ temporadas si serie).
func (h *CatalogHandler) ObtenerFichaTecnica(w http.ResponseWriter, r *http.Request) {
	resp, err := h.catalog.ObtenerFichaTecnica(r.Context(), r.PathValue("id"))
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}
