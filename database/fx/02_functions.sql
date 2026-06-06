CREATE OR REPLACE FUNCTION fn_convertir(p_monto NUMERIC, p_origen CHAR(3), p_destino CHAR(3))
RETURNS NUMERIC(18,4) LANGUAGE plpgsql STABLE AS $$
DECLARE v_tasa NUMERIC(18,8);
BEGIN
    IF p_origen = p_destino THEN RETURN ROUND(p_monto, 4); END IF;

    SELECT tasa INTO v_tasa FROM tipos_cambio
     WHERE moneda_origen = p_origen AND moneda_destino = p_destino AND vigente;
    IF FOUND THEN RETURN ROUND(p_monto * v_tasa, 4); END IF;

    SELECT tasa INTO v_tasa FROM tipos_cambio
     WHERE moneda_origen = p_destino AND moneda_destino = p_origen AND vigente;
    IF FOUND THEN RETURN ROUND(p_monto / v_tasa, 4); END IF;

    RAISE EXCEPTION 'No hay tasa vigente para % -> %', p_origen, p_destino
        USING ERRCODE = 'no_data_found';
END; $$;
