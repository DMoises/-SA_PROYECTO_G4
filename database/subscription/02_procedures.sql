CREATE OR REPLACE PROCEDURE sp_ProcesarRenovacion(
    IN    p_usuario_id UUID,
    IN    p_plan_id    UUID,
    IN    p_monto      NUMERIC,
    IN    p_moneda     CHAR(3),
    IN    p_meses      INTEGER DEFAULT 1,
    INOUT p_suscripcion_id UUID DEFAULT NULL,
    INOUT p_pago_id        UUID DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM planes WHERE id = p_plan_id) THEN
        RAISE EXCEPTION 'El plan % no existe', p_plan_id
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    UPDATE suscripciones
       SET estado_suscripcion = 'cancelada'
     WHERE usuario_id = p_usuario_id AND estado_suscripcion = 'activa';

    INSERT INTO suscripciones (usuario_id, plan_id, estado_suscripcion, fecha_inicio, fecha_fin)
    VALUES (p_usuario_id, p_plan_id, 'activa', CURRENT_DATE,
            CURRENT_DATE + (p_meses || ' months')::INTERVAL)
    RETURNING id INTO p_suscripcion_id;

    INSERT INTO pagos (suscripcion_id, monto, moneda_pago)
    VALUES (p_suscripcion_id, p_monto, p_moneda)
    RETURNING id INTO p_pago_id;
END; $$;
