CREATE OR REPLACE VIEW vw_historial_reciente AS
SELECT
    id,
    perfil_id,
    contenido_id,
    tipo,
    temporada,
    episodio,
    segundo_exacto,
    duracion_total,
    ROUND((segundo_exacto::NUMERIC / duracion_total) * 100, 2) AS porcentaje_visto,
    actualizado_en
FROM progreso_reproduccion
ORDER BY actualizado_en DESC;