package handlers

import (
	"net/http"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
)

type HistoryHandler struct {
	history *clients.HistoryClient
}

func NewHistoryHandler(history *clients.HistoryClient) *HistoryHandler {
	return &HistoryHandler{history: history}
}

func (h *HistoryHandler) SaveProgress(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PerfilID       string `json:"perfil_id"`
		ContenidoID    string `json:"contenido_id"`
		Tipo           string `json:"tipo"`
		Temporada      int32  `json:"temporada"`
		Episodio       int32  `json:"episodio"`
		SegundoExacto  int32  `json:"segundo_exacto"`
		DuracionTotal  int32  `json:"duracion_total"`
	}

	if !decode(w, r, &body) {
		return
	}

	resp, err := h.history.SaveProgress(
		r.Context(),
		body.PerfilID,
		body.ContenidoID,
		body.Tipo,
		body.Temporada,
		body.Episodio,
		body.SegundoExacto,
		body.DuracionTotal,
	)
	if err != nil {
		writeGRPCError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *HistoryHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	perfilID := r.PathValue("perfilId")

	resp, err := h.history.GetHistory(r.Context(), perfilID)
	if err != nil {
		writeGRPCError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp.GetHistorial())
}

func (h *HistoryHandler) GetResume(w http.ResponseWriter, r *http.Request) {
	perfilID := r.PathValue("perfilId")
	contenidoID := r.PathValue("contenidoId")

	resp, err := h.history.GetResume(r.Context(), perfilID, contenidoID)
	if err != nil {
		writeGRPCError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}