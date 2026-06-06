DO $$
DECLARE
    cont_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    p1 UUID := '11111111-1111-1111-1111-111111111111';
    p2 UUID := '22222222-2222-2222-2222-222222222222';
    p3 UUID := '33333333-3333-3333-3333-333333333333';
    p4 UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    INSERT INTO calificacion_usuario (perfil_id, contenido_id, tipo, valor) VALUES
        (p1, cont_a, 'estrella', 5),
        (p2, cont_a, 'estrella', 4),
        (p3, cont_a, 'pulgar',   1),
        (p4, cont_a, 'estrella', 2);
END; $$;
