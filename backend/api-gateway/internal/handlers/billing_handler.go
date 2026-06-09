package handlers

import (
	"net/http"

	"github.com/grupo4/quetxaltv-gateway/internal/clients"
	"github.com/grupo4/quetxaltv-gateway/internal/middleware"
)

type BillingHandler struct {
	billing *clients.BillingClient
}

func NewBillingHandler(billing *clients.BillingClient) *BillingHandler {
	return &BillingHandler{billing: billing}
}

func (h *BillingHandler) GetPlans(w http.ResponseWriter, r *http.Request) {
	resp, err := h.billing.GetPlans(r.Context())
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp.GetPlanes())
}

func (h *BillingHandler) CreateSubscription(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PlanID string  `json:"plan_id"`
		Monto  float64 `json:"monto"`
		Moneda string  `json:"moneda"`
		Meses  int32   `json:"meses"`
	}
	if !decode(w, r, &body) {
		return
	}

	resp, err := h.billing.CreateSubscription(
		r.Context(),
		usuarioID(r),
		body.PlanID,
		body.Monto,
		body.Moneda,
		body.Meses,
	)
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

func (h *BillingHandler) GetUserSubscription(w http.ResponseWriter, r *http.Request) {
	resp, err := h.billing.GetUserSubscription(r.Context(), usuarioID(r))
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *BillingHandler) ChangeSubscription(w http.ResponseWriter, r *http.Request) {
	var body struct {
		NuevoPlanID string  `json:"nuevo_plan_id"`
		Monto       float64 `json:"monto"`
		Moneda      string  `json:"moneda"`
		Meses       int32   `json:"meses"`
	}
	if !decode(w, r, &body) {
		return
	}

	resp, err := h.billing.ChangeSubscription(
		r.Context(),
		usuarioID(r),
		body.NuevoPlanID,
		body.Monto,
		body.Moneda,
		body.Meses,
	)
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *BillingHandler) CancelSubscription(w http.ResponseWriter, r *http.Request) {
	resp, err := h.billing.CancelSubscription(r.Context(), usuarioID(r))
	if err != nil {
		writeGRPCError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func _evitarImportNoUsado() {
	_ = middleware.CtxUsuarioID
}

func (h *BillingHandler) GetPlanPrice(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PlanID         string `json:"plan_id"`
		MonedaDestino string `json:"moneda_destino"`
	}

	if !decode(w, r, &body) {
		return
	}

	resp, err := h.billing.GetPlanPrice(r.Context(), body.PlanID, body.MonedaDestino)
	if err != nil {
		writeGRPCError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}