CREATE OR REPLACE FUNCTION fn_es_positiva(p_tipo tipo_calificacion, p_valor SMALLINT)
RETURNS BOOLEAN LANGUAGE sql IMMUTABLE AS $$
    SELECT (p_tipo = 'estrella' AND p_valor >= 4)
        OR (p_tipo = 'pulgar'   AND p_valor = 1);
$$;

CREATE OR REPLACE FUNCTION fn_RecalcularPorcentaje(p_contenido_id UUID)
RETURNS NUMERIC(5,2) LANGUAGE sql STABLE AS $$
    SELECT COALESCE(ROUND(
        100.0 * COUNT(*) FILTER (WHERE fn_es_positiva(tipo, valor))
              / NULLIF(COUNT(*), 0), 2), 0)
    FROM calificacion_usuario WHERE contenido_id = p_contenido_id;
$$;

CREATE OR REPLACE FUNCTION trg_fn_refrescar_resumen()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_cont UUID; v_tot INT; v_pos INT;
BEGIN
    v_cont := COALESCE(NEW.contenido_id, OLD.contenido_id);
    SELECT COUNT(*), COUNT(*) FILTER (WHERE fn_es_positiva(tipo, valor))
      INTO v_tot, v_pos
      FROM calificacion_usuario WHERE contenido_id = v_cont;

    INSERT INTO resumen_recomendacion (contenido_id, total_votos, votos_positivos, porcentaje)
    VALUES (v_cont, v_tot, v_pos,
            COALESCE(ROUND(100.0 * v_pos / NULLIF(v_tot,0), 2), 0))
    ON CONFLICT (contenido_id) DO UPDATE
        SET total_votos     = EXCLUDED.total_votos,
            votos_positivos = EXCLUDED.votos_positivos,
            porcentaje      = EXCLUDED.porcentaje;
    RETURN NULL;
END; $$;
