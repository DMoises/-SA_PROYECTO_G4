CREATE OR REPLACE PROCEDURE sp_guardar_progreso(
    IN p_perfil_id    UUID,
    IN p_contenido_id UUID,
    IN p_tipo         tipo_contenido,
    IN p_temporada    SMALLINT,
    IN p_episodio     SMALLINT,
    IN p_segundo      INTEGER,
    IN p_duracion     INTEGER
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO progreso_reproduccion
        (perfil_id, contenido_id, tipo, temporada, episodio, segundo_exacto, duracion_total)
    VALUES
        (p_perfil_id, p_contenido_id, p_tipo, p_temporada, p_episodio, p_segundo, p_duracion)
    ON CONFLICT (perfil_id, contenido_id, temporada, episodio) DO UPDATE
        SET segundo_exacto = EXCLUDED.segundo_exacto,
            duracion_total = EXCLUDED.duracion_total,
            actualizado_en = now();
END; $$;
