DO $$
DECLARE v_ana UUID; v_beto UUID; v_admin UUID;
BEGIN
    INSERT INTO usuarios (email, password_hash)
    VALUES ('ana@quetxal.tv', '$2b$12$hashAna') RETURNING id INTO v_ana;
    INSERT INTO usuarios (email, oauth_proveedor)
    VALUES ('beto@quetxal.tv', 'google') RETURNING id INTO v_beto;

    -- Usuario administrador: email admin@quetxal.tv / password Admin1234!
    INSERT INTO usuarios (email, password_hash, rol_base)
    VALUES ('admin@quetxal.tv', crypt('Admin1234!', gen_salt('bf', 12)), 'admin')
    RETURNING id INTO v_admin;

    INSERT INTO perfiles (usuario_id, nombre, es_infantil) VALUES
        (v_ana, 'Ana', FALSE),
        (v_ana, 'Kids', TRUE),
        (v_beto, 'Beto', FALSE),
        (v_admin, 'Administrador', FALSE);
END; $$;

