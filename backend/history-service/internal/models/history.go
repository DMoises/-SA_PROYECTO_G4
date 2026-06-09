package models

import "time"

type GuardarProgresoRequest struct {
	PerfilID      string `json:"perfil_id"`
	ContenidoID   string `json:"contenido_id"`
	Tipo          string `json:"tipo"`
	Temporada     *int16 `json:"temporada,omitempty"`
	Episodio      *int16 `json:"episodio,omitempty"`
	SegundoExacto int32  `json:"segundo_exacto"`
	DuracionTotal int32  `json:"duracion_total"`
}

type HistorialItem struct {
	ID              string    `json:"id"`
	PerfilID        string    `json:"perfil_id"`
	ContenidoID     string    `json:"contenido_id"`
	Tipo            string    `json:"tipo"`
	Temporada       *int16    `json:"temporada,omitempty"`
	Episodio        *int16    `json:"episodio,omitempty"`
	SegundoExacto   int32     `json:"segundo_exacto"`
	DuracionTotal   int32     `json:"duracion_total"`
	PorcentajeVisto float64   `json:"porcentaje_visto"`
	ActualizadoEn   time.Time `json:"actualizado_en"`
}