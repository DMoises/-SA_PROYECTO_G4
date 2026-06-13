CREATE MATERIALIZED VIEW IF NOT EXISTS vw_cartelera AS
SELECT
    c.id           AS contenido_id,
    c.titulo,
    c.tipo,
    c.anio,
    c.clasificacion,
    COALESCE((SELECT string_agg(g.nombre, ', ' ORDER BY g.nombre)
              FROM contenido_genero cg JOIN generos g ON g.id = cg.genero_id
              WHERE cg.contenido_id = c.id), '') AS generos,
    COALESCE((SELECT string_agg(ct.nombre, ', ' ORDER BY ct.nombre)
              FROM contenido_categoria cc JOIN categorias ct ON ct.id = cc.categoria_id
              WHERE cc.contenido_id = c.id), '') AS categorias
FROM contenido c
WHERE c.activo = TRUE;

-- Indice unico requerido para REFRESH CONCURRENTLY (no bloquea lecturas durante el refresco)
CREATE UNIQUE INDEX IF NOT EXISTS idx_vw_cartelera_id ON vw_cartelera (contenido_id);
