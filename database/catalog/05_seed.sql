INSERT INTO generos (nombre) VALUES 
('Accion'), ('Drama'), ('Ciencia Ficcion');

INSERT INTO categorias (nombre) VALUES 
('Destacados'), ('Tendencias');

DO $$
DECLARE
    v_peli UUID; 
    v_serie UUID; 
    v_peli2 UUID;
    v_peli3 UUID;
    v_peli4 UUID;
    t1 UUID;
    g_acc UUID; 
    g_sci UUID; 
    g_dra UUID;
    cat_d UUID;
    cat_t UUID;
    a1 UUID; 
    a2 UUID;
BEGIN
    SELECT id INTO g_acc FROM generos WHERE nombre = 'Accion';
    SELECT id INTO g_sci FROM generos WHERE nombre = 'Ciencia Ficcion';
    SELECT id INTO g_dra FROM generos WHERE nombre = 'Drama';
    SELECT id INTO cat_d FROM categorias WHERE nombre = 'Destacados';
    SELECT id INTO cat_t FROM categorias WHERE nombre = 'Tendencias';

    -- Peli original
    INSERT INTO contenido (
        titulo, tipo, anio, clasificacion, duracion_min, portada_url, video_url
    )
    VALUES (
        'El Ultimo Quetzal',
        'pelicula',
        2024,
        '+18',
        118,
        'https://storage.googleapis.com/quetxal-tv/portadas/el-ultimo-quetzal.jpg',
        'https://storage.googleapis.com/quetxal-tv/videos/el-ultimo-quetzal.mp4'
    ) 
    RETURNING id INTO v_peli;

    -- Peli Extra 1 (Para pruebas de Watch Party con YT)
    INSERT INTO contenido (
        titulo, tipo, anio, clasificacion, duracion_min, portada_url, video_url
    )
    VALUES (
        'Aventuras en la Nube (Prueba YT)',
        'pelicula',
        2025,
        'L',
        95,
        'https://picsum.photos/seed/nube/800/1200', -- Portada generada dummy
        'https://www.youtube.com/watch?v=aqz-KE-bpKQ' -- Big Buck Bunny
    ) 
    RETURNING id INTO v_peli2;

    -- Peli Extra 2 (Para pruebas de Watch Party con YT)
    INSERT INTO contenido (
        titulo, tipo, anio, clasificacion, duracion_min, portada_url, video_url
    )
    VALUES (
        'Odisea Marciana (Prueba YT)',
        'pelicula',
        2023,
        '+16',
        130,
        'https://picsum.photos/seed/marte/800/1200', -- Portada generada dummy
        'https://www.youtube.com/watch?v=YE7VzlLtp-4' -- Blender Sintel
    ) 
    RETURNING id INTO v_peli3;

    -- Peli Extra 3 (Clasificación +18)
    INSERT INTO contenido (
        titulo, tipo, anio, clasificacion, duracion_min, portada_url, video_url
    )
    VALUES (
        'Venganza Nocturna (+18)',
        'pelicula',
        2024,
        '+18',
        110,
        'https://picsum.photos/seed/terror/800/1200', -- Portada generada dummy
        'https://www.youtube.com/watch?v=cZpE5iYyFm4' -- Dummy trailer de prueba
    ) 
    RETURNING id INTO v_peli4;

    -- Serie original
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
        (v_peli2, g_acc),
        (v_peli3, g_sci),
        (v_peli4, g_dra),
        (v_serie, g_sci);

    INSERT INTO contenido_categoria VALUES 
        (v_peli, cat_d),
        (v_peli2, cat_t),
        (v_peli3, cat_d),
        (v_peli4, cat_t);

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
        (v_peli2, a1, 'Heroina', 'protagonista'),
        (v_peli4, a2, 'Villano', 'antagonista'),
        (v_serie, a2, 'Balam', 'protagonista');
END; $$;

REFRESH MATERIALIZED VIEW vw_cartelera;