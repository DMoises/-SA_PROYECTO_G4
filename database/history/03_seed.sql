DO $$
DECLARE
    perfil UUID := '11111111-1111-1111-1111-111111111111';
    peli   UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    serie  UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
    CALL sp_guardar_progreso(perfil, peli, 'pelicula', NULL, NULL, 600, 7080);
    CALL sp_guardar_progreso(perfil, serie, 'serie', 1::SMALLINT, 2::SMALLINT, 1320, 2880);
END; $$;
