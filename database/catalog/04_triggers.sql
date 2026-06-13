CREATE TRIGGER trg_validar_temporada
BEFORE INSERT OR UPDATE ON temporadas
FOR EACH ROW
EXECUTE FUNCTION trg_fn_validar_temporada();