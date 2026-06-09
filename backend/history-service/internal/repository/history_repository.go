package repository

import (
	"context"

	"github.com/grupo4/quetxaltv-history/internal/models"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HistoryRepository struct {
	db *pgxpool.Pool
}

func NewHistoryRepository(db *pgxpool.Pool) *HistoryRepository {
	return &HistoryRepository{db: db}
}

func (r *HistoryRepository) GuardarProgreso(ctx context.Context, req models.GuardarProgresoRequest) error {
	_, err := r.db.Exec(ctx,
		`CALL sp_guardar_progreso($1, $2, $3::tipo_contenido, $4, $5, $6, $7)`,
		req.PerfilID,
		req.ContenidoID,
		req.Tipo,
		req.Temporada,
		req.Episodio,
		req.SegundoExacto,
		req.DuracionTotal,
	)
	return err
}

func (r *HistoryRepository) ObtenerHistorial(ctx context.Context, perfilID string) ([]models.HistorialItem, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			id,
			perfil_id,
			contenido_id,
			tipo::text,
			temporada,
			episodio,
			segundo_exacto,
			duracion_total,
			fn_porcentaje_visto(segundo_exacto, duracion_total) AS porcentaje_visto,
			actualizado_en
		FROM progreso_reproduccion
		WHERE perfil_id = $1
		ORDER BY actualizado_en DESC
	`, perfilID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var historial []models.HistorialItem

	for rows.Next() {
		var item models.HistorialItem

		err := rows.Scan(
			&item.ID,
			&item.PerfilID,
			&item.ContenidoID,
			&item.Tipo,
			&item.Temporada,
			&item.Episodio,
			&item.SegundoExacto,
			&item.DuracionTotal,
			&item.PorcentajeVisto,
			&item.ActualizadoEn,
		)
		if err != nil {
			return nil, err
		}

		historial = append(historial, item)
	}

	return historial, rows.Err()
}

func (r *HistoryRepository) ObtenerProgreso(ctx context.Context, perfilID, contenidoID string) (*models.HistorialItem, error) {
	row := r.db.QueryRow(ctx, `
		SELECT
			id,
			perfil_id,
			contenido_id,
			tipo::text,
			temporada,
			episodio,
			segundo_exacto,
			duracion_total,
			fn_porcentaje_visto(segundo_exacto, duracion_total) AS porcentaje_visto,
			actualizado_en
		FROM progreso_reproduccion
		WHERE perfil_id = $1 AND contenido_id = $2
		ORDER BY actualizado_en DESC
		LIMIT 1
	`, perfilID, contenidoID)

	var item models.HistorialItem

	err := row.Scan(
		&item.ID,
		&item.PerfilID,
		&item.ContenidoID,
		&item.Tipo,
		&item.Temporada,
		&item.Episodio,
		&item.SegundoExacto,
		&item.DuracionTotal,
		&item.PorcentajeVisto,
		&item.ActualizadoEn,
	)
	if err != nil {
		return nil, err
	}

	return &item, nil
}