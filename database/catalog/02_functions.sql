CREATE OR REPLACE FUNCTION trg_fn_validar_temporada()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_tipo tipo_contenido;
BEGIN
    SELECT tipo INTO v_tipo FROM contenido WHERE id = NEW.contenido_id;

    IF v_tipo IS NULL THEN
        RAISE EXCEPTION 'El contenido % no existe', NEW.contenido_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF v_tipo <> 'serie' THEN
        RAISE EXCEPTION 'El contenido % no es serie; no admite temporadas', NEW.contenido_id
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END; $$;