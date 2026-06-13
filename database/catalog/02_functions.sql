-- Refresca la vista materializada vw_cartelera de forma concurrente (sin bloquear lecturas).
-- Llamar despues de cualquier cambio masivo en contenido, generos o categorias.
CREATE OR REPLACE PROCEDURE sp_RefrescarCartelera()
LANGUAGE plpgsql AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vw_cartelera;
END; $$;

CREATE OR REPLACE FUNCTION trg_fn_validar_temporada()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_tipo tipo_contenido;
BEGIN
    SELECT tipo INTO v_tipo FROM contenido WHERE id = NEW.contenido_id;
    IF v_tipo <> 'serie' THEN
        RAISE EXCEPTION 'El contenido % no es serie; no admite temporadas', NEW.contenido_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END; $$;
