-- Migracion: habilita auditoria de DELETE en catalog-db (TAREA 1).
-- Re-crea trg_fn_auditar_transaccion (ahora maneja DELETE: estado_anterior=
-- registro borrado, estado_nuevo=NULL) y re-define los triggers de
-- auditoria como AFTER INSERT OR UPDATE OR DELETE.
--
-- Por que: el DDL de triggers de 06_audit.sql solo corre en el primer
-- arranque (directorio de datos vacio). En una catalog-db que YA existe, los
-- triggers siguen como AFTER INSERT OR UPDATE y los DELETE no se auditan.
--
-- Idempotente: usa CREATE OR REPLACE FUNCTION/TRIGGER (requiere PostgreSQL 14+;
-- las imagenes de BD usan postgres:16). Se puede correr mas de una vez.
--
-- Como aplicarla:
--   Docker (VM de BD):  docker exec -i quetxal-catalog-db \
--                         psql -U "$CATALOG_DB_USER" -d "$CATALOG_DB_NAME" \
--                         < database/catalog/migrations/2026-06-30_audit_delete_triggers.sql
--
--   BD externa (Fase 3, VM 10.10.0.10): usar psql -h 10.10.0.10 -p <puerto-catalog>
--   con $CATALOG_DB_USER / $CATALOG_DB_NAME y -f sobre este archivo.
-- ------------------------------------------------------------------------

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
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );

    -- En DELETE no existe NEW; se devuelve OLD para no romper el trigger AFTER.
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_audit_contenido AFTER INSERT OR UPDATE OR DELETE ON contenido FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE OR REPLACE TRIGGER trg_audit_generos AFTER INSERT OR UPDATE OR DELETE ON generos FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE OR REPLACE TRIGGER trg_audit_categorias AFTER INSERT OR UPDATE OR DELETE ON categorias FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE OR REPLACE TRIGGER trg_audit_contenido_genero AFTER INSERT OR UPDATE OR DELETE ON contenido_genero FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE OR REPLACE TRIGGER trg_audit_contenido_categoria AFTER INSERT OR UPDATE OR DELETE ON contenido_categoria FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE OR REPLACE TRIGGER trg_audit_temporadas AFTER INSERT OR UPDATE OR DELETE ON temporadas FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE OR REPLACE TRIGGER trg_audit_episodios AFTER INSERT OR UPDATE OR DELETE ON episodios FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE OR REPLACE TRIGGER trg_audit_actores AFTER INSERT OR UPDATE OR DELETE ON actores FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
CREATE OR REPLACE TRIGGER trg_audit_reparto AFTER INSERT OR UPDATE OR DELETE ON reparto FOR EACH ROW EXECUTE FUNCTION trg_fn_auditar_transaccion();
