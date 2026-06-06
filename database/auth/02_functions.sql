CREATE OR REPLACE FUNCTION trg_fn_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END; $$;


CREATE OR REPLACE FUNCTION trg_fn_audit_credenciales()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        INSERT INTO auditoria_usuarios (usuario_id, estado_anterior, estado_nuevo, campo_actualizar)
        VALUES (NEW.id, OLD.email, NEW.email, 'email');
    END IF;
    IF NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
        INSERT INTO auditoria_usuarios (usuario_id, estado_anterior, estado_nuevo, campo_actualizar)
        VALUES (NEW.id, '***', '***', 'password_hash');
    END IF;
    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        INSERT INTO auditoria_usuarios (usuario_id, estado_anterior, estado_nuevo, campo_actualizar)
        VALUES (NEW.id, OLD.estado::TEXT, NEW.estado::TEXT, 'estado');
    END IF;
    RETURN NEW;
END; $$;


CREATE OR REPLACE FUNCTION trg_fn_limite_perfiles()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF (SELECT COUNT(*) FROM perfiles WHERE usuario_id = NEW.usuario_id) >= 5 THEN
        RAISE EXCEPTION 'La cuenta % ya tiene el maximo de 5 perfiles', NEW.usuario_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END; $$;
