package handlers

import (
	"net/http"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
)

type RatingHandler struct {
	rating *clients.RatingClient
}

func NewRatingHandler(rating *clients.RatingClient) *RatingHandler {
	return &RatingHandler{rating: rating}
}

// POST /ratings (protegida) -> emite/actualiza la calificacion del perfil.
func (h *RatingHandler) Calificar(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PerfilID    string `json:"perfil_id"`
		ContenidoID string `json:"contenido_id"`
		Tipo        string `json:"tipo"`
		Valor       int32  `json:"valor"`
	}
	if !decode(w, r, &body) {
		return
	}
	resp, err := h.rating.Calificar(r.Context(), body.PerfilID, body.ContenidoID, body.Tipo, body.Valor)
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

// GET /ratings/{contenido_id} (publica) -> % de recomendacion del contenido.
func (h *RatingHandler) ObtenerRecomendacion(w http.ResponseWriter, r *http.Request) {
	resp, err := h.rating.ObtenerRecomendacion(r.Context(), r.PathValue("contenido_id"))
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

// GET /ratings/{contenido_id}/usuario?perfil_id=X (protegida) -> voto actual del perfil.
func (h *RatingHandler) ObtenerCalificacionUsuario(w http.ResponseWriter, r *http.Request) {
	resp, err := h.rating.ObtenerCalificacionUsuario(r.Context(), r.URL.Query().Get("perfil_id"), r.PathValue("contenido_id"))
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}
