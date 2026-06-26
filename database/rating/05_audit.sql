CREATE TABLE IF NOT EXISTS auditoria_transaccional (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_responsable VARCHAR(255) NOT NULL,
    fecha_exacta      TIMESTAMPTZ NOT NULL DEFAULT now(),
    tabla_afectada    VARCHAR(100) NOT NULL,
    estado_anterior   JSONB,
    estado_nuevo      JSONB
);

CREATE OR REPLACE FUNCTION trg_fn_auditar_transaccion()
RETURNS TRIGGER AS $$
DECLARE
    v_user VARCHAR(255);
BEGIN
    v_user := current_setting('app.current_user', true);
    IF v_user IS NULL OR v_user = '' THEN
        v_user := session_user;
    END IF;

    INSERT INTO auditoria_transaccional (usuario_responsable, tabla_afectada, estado_anterior, estado_nuevo)
    VALUES (
        v_user,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        to_jsonb(NEW)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_calificacion_usuario AFTER INSERT OR UPDATE ON calificacion_usuario FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE TRIGGER trg_audit_resumen_recomendacion AFTER INSERT OR UPDATE ON resumen_recomendacion FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
