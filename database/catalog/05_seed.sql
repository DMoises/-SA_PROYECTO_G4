INSERT INTO generos (nombre) VALUES 
('Accion'), ('Drama'), ('Ciencia Ficcion');

INSERT INTO categorias (nombre) VALUES 
('Destacados'), ('Tendencias');

DO $$
DECLARE
    v_peli UUID; 
    v_serie UUID; 
    t1 UUID;
    g_acc UUID; 
    g_sci UUID; 
    cat_d UUID;
    a1 UUID; 
    a2 UUID;
BEGIN
    SELECT id INTO g_acc FROM generos WHERE nombre = 'Accion';
    SELECT id INTO g_sci FROM generos WHERE nombre = 'Ciencia Ficcion';
    SELECT id INTO cat_d FROM categorias WHERE nombre = 'Destacados';

    INSERT INTO contenido (
        titulo, tipo, anio, clasificacion, duracion_min, portada_url, video_url
    )
    VALUES (
        'El Ultimo Quetzal',
        'pelicula',
        2024,
        '+13',
        118,
        'https://storage.googleapis.com/quetxal-tv/portadas/el-ultimo-quetzal.jpg',
        'https://storage.googleapis.com/quetxal-tv/videos/el-ultimo-quetzal.mp4'
    ) 
    RETURNING id INTO v_peli;

    INSERT INTO contenido (
        titulo, tipo, anio, clasificacion, portada_url
    )
    VALUES (
        'Codigo Tikal',
        'serie',
        2025,
        '+16',
        'https://storage.googleapis.com/quetxal-tv/portadas/codigo-tikal.jpg'
    ) 
    RETURNING id INTO v_serie;

    INSERT INTO contenido_genero VALUES 
        (v_peli, g_acc), 
        (v_serie, g_sci);

    INSERT INTO contenido_categoria VALUES 
        (v_peli, cat_d);

    INSERT INTO temporadas (contenido_id, numero) 
    VALUES (v_serie, 1) 
    RETURNING id INTO t1;

    INSERT INTO episodios (
        temporada_id, numero, titulo, duracion_min, video_url
    ) 
    VALUES
        (
            t1, 
            1, 
            'Glifos', 
            45,
            'https://storage.googleapis.com/quetxal-tv/videos/codigo-tikal/t1-e1-glifos.mp4'
        ),
        (
            t1, 
            2, 
            'La red', 
            48,
            'https://storage.googleapis.com/quetxal-tv/videos/codigo-tikal/t1-e2-la-red.mp4'
        );

    INSERT INTO actores (nombre) 
    VALUES ('Lucia Mendez') 
    RETURNING id INTO a1;

    INSERT INTO actores (nombre) 
    VALUES ('Diego Arana')  
    RETURNING id INTO a2;

    INSERT INTO reparto (contenido_id, actor_id, personaje, rol) 
    VALUES
        (v_peli,  a1, 'Itzel', 'protagonista'),
        (v_serie, a2, 'Balam', 'protagonista');
END; $$;

CALL sp_RefrescarCartelera();