package service

import (
	"context"
	"errors"

	"github.com/grupo4/quetxaltv-history/internal/models"
	"github.com/grupo4/quetxaltv-history/internal/repository"
)

type HistoryService struct {
	repo *repository.HistoryRepository
}

func NewHistoryService(repo *repository.HistoryRepository) *HistoryService {
	return &HistoryService{repo: repo}
}

func (s *HistoryService) GuardarProgreso(ctx context.Context, req models.GuardarProgresoRequest) error {
	if req.PerfilID == "" || req.ContenidoID == "" {
		return errors.New("perfil_id y contenido_id son obligatorios")
	}

	if req.Tipo != "pelicula" && req.Tipo != "serie" {
		return errors.New("tipo debe ser pelicula o serie")
	}

	if req.Tipo == "serie" && (req.Temporada == nil || req.Episodio == nil) {
		return errors.New("una serie debe tener temporada y episodio")
	}

	if req.Tipo == "pelicula" && (req.Temporada != nil || req.Episodio != nil) {
		return errors.New("una pelicula no debe tener temporada ni episodio")
	}

	if req.DuracionTotal <= 0 {
		return errors.New("duracion_total debe ser mayor a 0")
	}

	if req.SegundoExacto < 0 || req.SegundoExacto > req.DuracionTotal {
		return errors.New("segundo_exacto debe estar entre 0 y duracion_total")
	}

	return s.repo.GuardarProgreso(ctx, req)
}

func (s *HistoryService) ObtenerHistorial(ctx context.Context, perfilID string) ([]models.HistorialItem, error) {
	if perfilID == "" {
		return nil, errors.New("perfil_id es obligatorio")
	}

	return s.repo.ObtenerHistorial(ctx, perfilID)
}

func (s *HistoryService) ObtenerProgreso(ctx context.Context, perfilID, contenidoID string) (*models.HistorialItem, error) {
	if perfilID == "" || contenidoID == "" {
		return nil, errors.New("perfil_id y contenido_id son obligatorios")
	}

	return s.repo.ObtenerProgreso(ctx, perfilID, contenidoID)
}