CREATE OR REPLACE FUNCTION fn_porcentaje_visto(
    p_segundo INTEGER,
    p_duracion INTEGER
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_duracion <= 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((p_segundo::NUMERIC / p_duracion) * 100, 2);
END;
$$;