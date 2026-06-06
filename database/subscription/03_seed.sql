INSERT INTO planes (nombre_plan, precio_base) VALUES
    ('Basico',   5.99),
    ('Estandar', 9.99),
    ('Premium', 14.99);

DO $$
DECLARE v_plan UUID; v_s UUID; v_p UUID;
BEGIN
    SELECT id INTO v_plan FROM planes WHERE nombre_plan = 'Premium';
    CALL sp_ProcesarRenovacion(
        '11111111-1111-1111-1111-111111111111', v_plan, 14.99, 'USD', 1, v_s, v_p);
END; $$;
