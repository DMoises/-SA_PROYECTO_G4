CREATE TRIGGER trg_refrescar_resumen
    AFTER INSERT OR UPDATE OR DELETE ON calificacion_usuario
    FOR EACH ROW EXECUTE FUNCTION trg_fn_refrescar_resumen();
