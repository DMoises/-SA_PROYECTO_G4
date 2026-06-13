package handlers

import (
	"net/http"
	"sort"

	"github.com/grupo4/quetxaltv-gateway/internal/config"
	"github.com/grupo4/quetxaltv-gateway/internal/db"
	"github.com/grupo4/quetxaltv-gateway/internal/middleware"
)

type AdminHandler struct {
	cfg *config.Config
}

func NewAdminHandler(cfg *config.Config) *AdminHandler {
	return &AdminHandler{cfg: cfg}
}

func (h *AdminHandler) GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	rol, _ := r.Context().Value(middleware.CtxRol).(string)
	if rol != "admin" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Acceso denegado: se requieren permisos de administrador"})
		return
	}

	logs, err := db.FetchAllAuditLogs(h.cfg)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Error consultando logs de auditoria: " + err.Error()})
		return
	}

	sort.Slice(logs, func(i, j int) bool {
		return logs[i].FechaExacta.After(logs[j].FechaExacta)
	})

	writeJSON(w, http.StatusOK, logs)
}
