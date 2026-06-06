CREATE TRIGGER trg_validar_temporada
    BEFORE INSERT ON temporadas
    FOR EACH ROW EXECUTE FUNCTION trg_fn_validar_temporada();
