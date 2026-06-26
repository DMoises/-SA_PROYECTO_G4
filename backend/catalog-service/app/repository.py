"""Acceso a datos de catalog_db con SQL crudo (sin ORM).

Consume la VISTA vw_cartelera para la cartelera y la busqueda (es la "Vista
SQL" del RFS-03.2), y las tablas base (contenido, reparto, actores,
temporadas, episodios) para completar la ficha tecnica. Mismo enfoque que el
notification-service, que lee de su vista vista_buzon_pendiente.
"""
from typing import Any, Optional

from .db import Database

# Columnas que expone vw_cartelera (proyeccion de la cartelera).
_COLS_CARTELERA = "contenido_id, titulo, tipo, anio, clasificacion, generos, categorias, portada_url"


class CatalogRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    # Para el algoritmo de recomendacion, obtenemos el historial de progreso y votos positivos.
    # Postgres permite hacer query a otros DSNs instanciando conexiones psycopg directas.
    def obtener_historial_contenido_ids(self, perfil_id: str, rating_dsn: str, history_dsn: str) -> list[str]:
        contenido_ids = []
        try:
            import psycopg
            # 1. Leer del historial
            with psycopg.connect(history_dsn) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT DISTINCT contenido_id FROM progreso_reproduccion WHERE perfil_id = %s::uuid",
                        (perfil_id,)
                    )
                    contenido_ids.extend([str(row[0]) for row in cur.fetchall()])
        except Exception as e:
            print(f"Error al leer historial para recomendacion: {e}")
        return contenido_ids

    def obtener_votos_positivos_contenido_ids(self, perfil_id: str, rating_dsn: str) -> list[str]:
        contenido_ids = []
        try:
            import psycopg
            # 2. Leer calificaciones positivas (votos estrella >= 4 o pulgar = 1)
            with psycopg.connect(rating_dsn) as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT contenido_id FROM calificacion_usuario 
                        WHERE perfil_id = %s::uuid AND (
                            (tipo = 'estrella' AND valor >= 4) OR 
                            (tipo = 'pulgar' AND valor = 1)
                        )
                        """,
                        (perfil_id,)
                    )
                    contenido_ids.extend([str(row[0]) for row in cur.fetchall()])
        except Exception as e:
            print(f"Error al leer votos para recomendacion: {e}")
        return contenido_ids

    # ---- Explorar: toda la cartelera activa (RFS-03 / "Explorar Cartelera") ----
    def explorar_cartelera(self) -> list[dict[str, Any]]:
        return self.db.fetch_all(
            f"SELECT {_COLS_CARTELERA} FROM vw_cartelera ORDER BY titulo"
        )

    # ---- Buscar con filtros multicriterio simultaneos (RFS-03.1) ----
    # Cada filtro es opcional: si llega NULL, el AND lo ignora. genero,
    # categoria y actor se resuelven con EXISTS contra las tablas puente.
    def buscar(
        self,
        titulo: Optional[str],
        categoria: Optional[str],
        genero: Optional[str],
        actor: Optional[str],
        tipo: Optional[str],
    ) -> list[dict[str, Any]]:
        # Los parametros se castean a ::text para que Postgres pueda inferir su
        # tipo (psycopg los envia como 'unknown' y '$1 IS NULL' fallaria sin el cast).
        # tipo compara contra el ENUM tipo_contenido (se castea a text en ambos lados).
        sql = f"""
            SELECT {_COLS_CARTELERA}
            FROM vw_cartelera v
            WHERE (%(titulo)s::text IS NULL OR v.titulo ILIKE '%%' || %(titulo)s::text || '%%')
              AND (%(tipo)s::text IS NULL OR LOWER(v.tipo::text) = LOWER(%(tipo)s::text))
              AND (%(genero)s::text IS NULL OR EXISTS (
                    SELECT 1 FROM contenido_genero cg
                    JOIN generos g ON g.id = cg.genero_id
                    WHERE cg.contenido_id = v.contenido_id AND g.nombre ILIKE %(genero)s::text))
              AND (%(categoria)s::text IS NULL OR EXISTS (
                    SELECT 1 FROM contenido_categoria cc
                    JOIN categorias ct ON ct.id = cc.categoria_id
                    WHERE cc.contenido_id = v.contenido_id AND ct.nombre ILIKE %(categoria)s::text))
              AND (%(actor)s::text IS NULL OR EXISTS (
                    SELECT 1 FROM reparto r
                    JOIN actores a ON a.id = r.actor_id
                    WHERE r.contenido_id = v.contenido_id
                      AND a.nombre ILIKE '%%' || %(actor)s::text || '%%'))
            ORDER BY v.titulo
        """
        return self.db.fetch_all(
            sql,
            {"titulo": titulo, "categoria": categoria, "genero": genero,
             "actor": actor, "tipo": tipo},
        )

    # ---- Ficha tecnica: cabecera (RFS-03.2) ----
    # Toma sinopsis/duracion de la tabla base y generos/categorias de la vista.
    def obtener_contenido(self, contenido_id: str) -> Optional[dict[str, Any]]:
        return self.db.fetch_one(
            """
            SELECT c.id AS contenido_id, c.titulo, c.tipo, c.sinopsis, c.anio,
                   c.clasificacion, c.duracion_min, c.portada_url, c.video_url,
                   COALESCE(v.generos, '')    AS generos,
                   COALESCE(v.categorias, '') AS categorias
            FROM contenido c
            LEFT JOIN vw_cartelera v ON v.contenido_id = c.id
            WHERE c.id = %(id)s::uuid
            """,
            {"id": contenido_id},
        )


    def obtener_reparto(self, contenido_id: str) -> list[dict[str, Any]]:
        return self.db.fetch_all(
            """
            SELECT a.nombre AS actor, r.personaje, r.rol
            FROM reparto r
            JOIN actores a ON a.id = r.actor_id
            WHERE r.contenido_id = %(id)s::uuid
            ORDER BY r.rol, a.nombre
            """,
            {"id": contenido_id},
        )

    # Temporadas + episodios aplanados (se agrupan en la capa de servicio).
    def obtener_episodios(self, contenido_id: str) -> list[dict[str, Any]]:
        return self.db.fetch_all(
            """
            SELECT t.numero AS temporada, e.numero AS episodio,
                   e.titulo, e.duracion_min, e.video_url
            FROM temporadas t
            JOIN episodios e ON e.temporada_id = t.id
            WHERE t.contenido_id = %(id)s::uuid
            ORDER BY t.numero, e.numero
            """,
            {"id": contenido_id},
        )
