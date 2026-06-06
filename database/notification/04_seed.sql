DO $$
DECLARE u UUID := '11111111-1111-1111-1111-111111111111'; n1 UUID; n2 UUID;
BEGIN
    CALL sp_encolar_correo(u, 'registro',
        '{"nombre":"Ana","email":"ana@quetxal.tv"}'::JSONB, n1);
    CALL sp_encolar_correo(u, 'recibo',
        '{"plan":"Premium","monto":14.99,"moneda":"USD"}'::JSONB, n2);
END; $$;
