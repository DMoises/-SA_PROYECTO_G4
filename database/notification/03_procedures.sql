CREATE OR REPLACE PROCEDURE sp_encolar_correo(
    IN    p_usuario_id UUID,
    IN    p_tipo       tipo_correo,
    IN    p_payload    JSONB,
    INOUT p_id         UUID DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO buzon_salida (usuario_id, tipo, payload)
    VALUES (p_usuario_id, p_tipo, p_payload)
    RETURNING id INTO p_id;
END; $$;
