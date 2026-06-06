CREATE TRIGGER trg_AuditCredenciales
    AFTER UPDATE OF email, password_hash, estado ON usuarios
    FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_credenciales();

CREATE TRIGGER trg_timestamp_usuarios
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION trg_fn_timestamp();

CREATE TRIGGER trg_limite_perfiles
    BEFORE INSERT ON perfiles
    FOR EACH ROW EXECUTE FUNCTION trg_fn_limite_perfiles();
