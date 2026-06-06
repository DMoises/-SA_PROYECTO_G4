CREATE OR REPLACE PROCEDURE sp_actualizar_tasa(
    IN p_origen CHAR(3), IN p_destino CHAR(3), IN p_tasa NUMERIC
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE tipos_cambio SET vigente = FALSE
     WHERE moneda_origen = p_origen AND moneda_destino = p_destino AND vigente;

    INSERT INTO tipos_cambio (moneda_origen, moneda_destino, tasa, vigente)
    VALUES (p_origen, p_destino, p_tasa, TRUE);
END; $$;
