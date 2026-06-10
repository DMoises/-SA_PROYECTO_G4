INSERT INTO generos (nombre) VALUES ('Accion'), ('Drama'), ('Ciencia Ficcion');
INSERT INTO categorias (nombre) VALUES ('Destacados'), ('Tendencias');

DO $$
DECLARE
    v_peli UUID; v_serie UUID; t1 UUID;
    g_acc UUID; g_sci UUID; cat_d UUID;
    a1 UUID; a2 UUID;
BEGIN
    SELECT id INTO g_acc FROM generos WHERE nombre='Accion';
    SELECT id INTO g_sci FROM generos WHERE nombre='Ciencia Ficcion';
    SELECT id INTO cat_d FROM categorias WHERE nombre='Destacados';

    INSERT INTO contenido (titulo, tipo, anio, clasificacion, duracion_min)
    VALUES ('El Ultimo Quetzal', 'pelicula', 2024, '+13', 118) RETURNING id INTO v_peli;
    INSERT INTO contenido (titulo, tipo, anio, clasificacion)
    VALUES ('Codigo Tikal', 'serie', 2025, '+16') RETURNING id INTO v_serie;

    INSERT INTO contenido_genero VALUES (v_peli, g_acc), (v_serie, g_sci);
    INSERT INTO contenido_categoria VALUES (v_peli, cat_d);

    INSERT INTO temporadas (contenido_id, numero) VALUES (v_serie, 1) RETURNING id INTO t1;
    INSERT INTO episodios (temporada_id, numero, titulo, duracion_min) VALUES
        (t1, 1, 'Glifos', 45), (t1, 2, 'La red', 48);

    INSERT INTO actores (nombre) VALUES ('Lucia Mendez') RETURNING id INTO a1;
    INSERT INTO actores (nombre) VALUES ('Diego Arana')  RETURNING id INTO a2;
    INSERT INTO reparto (contenido_id, actor_id, personaje, rol) VALUES
        (v_peli,  a1, 'Itzel', 'protagonista'),
        (v_serie, a2, 'Balam', 'protagonista');
END; $$;

-- Poblar la vista materializada con los datos del seed
CALL sp_RefrescarCartelera();

