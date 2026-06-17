"""Operaciones de escritura del catalogo para el panel de administracion.

Solo se usa desde el servidor HTTP admin (no desde gRPC). Trabaja directamente
sobre las tablas base (contenido, generos, categorias, reparto, etc.) sin tocar
la vista materializada vw_cartelera, que se refresca despues de cada cambio.
"""
from typing import Any, Optional

from .db import Database


class AdminRepository:
    def __init__(self, db: Database) -> None:
        self.db = db

    # ---- Listar todo el contenido (incluyendo inactivos) ----
    def listar_todos(self) -> list[dict[str, Any]]:
        return self.db.fetch_all(
            """
            SELECT c.id AS contenido_id, c.titulo, c.tipo::text, c.sinopsis,
                   c.anio, c.clasificacion::text, c.duracion_min,
                   c.portada_url, c.video_url, c.activo,
                   c.fecha_estreno,
                   COALESCE((SELECT string_agg(g.nombre, ', ' ORDER BY g.nombre)
                              FROM contenido_genero cg JOIN generos g ON g.id = cg.genero_id
                              WHERE cg.contenido_id = c.id), '') AS generos,
                   COALESCE((SELECT string_agg(ct.nombre, ', ' ORDER BY ct.nombre)
                              FROM contenido_categoria cc JOIN categorias ct ON ct.id = cc.categoria_id
                              WHERE cc.contenido_id = c.id), '') AS categorias
            FROM contenido c
            ORDER BY c.titulo
            """
        )

    def obtener_por_id(self, contenido_id: str) -> Optional[dict[str, Any]]:
        return self.db.fetch_one(
            """
            SELECT c.id AS contenido_id, c.titulo, c.tipo::text, c.sinopsis,
                   c.anio, c.clasificacion::text, c.duracion_min,
                   c.portada_url, c.video_url, c.activo,
                   c.fecha_estreno,
                   COALESCE((SELECT string_agg(g.nombre, ', ' ORDER BY g.nombre)
                              FROM contenido_genero cg JOIN generos g ON g.id = cg.genero_id
                              WHERE cg.contenido_id = c.id), '') AS generos,
                   COALESCE((SELECT string_agg(ct.nombre, ', ' ORDER BY ct.nombre)
                              FROM contenido_categoria cc JOIN categorias ct ON ct.id = cc.categoria_id
                              WHERE cc.contenido_id = c.id), '') AS categorias
            FROM contenido c
            WHERE c.id = %(id)s::uuid
            """,
            {"id": contenido_id},
        )

    # ---- Crear contenido ----
    def crear_contenido(self, datos: dict[str, Any]) -> dict[str, Any]:
        row = self.db.execute_returning(
            """
            INSERT INTO contenido (titulo, tipo, sinopsis, anio, clasificacion,
                                   duracion_min, portada_url, video_url, fecha_estreno, activo)
            VALUES (%(titulo)s, %(tipo)s::tipo_contenido, %(sinopsis)s, %(anio)s,
                    %(clasificacion)s::clasificacion_edad, %(duracion_min)s,
                    %(portada_url)s, %(video_url)s, %(fecha_estreno)s, %(activo)s)
            RETURNING id
            """,
            {
                "titulo": datos["titulo"],
                "tipo": datos["tipo"],
                "sinopsis": datos.get("sinopsis"),
                "anio": datos.get("anio"),
                "clasificacion": datos.get("clasificacion", "TP"),
                "duracion_min": datos.get("duracion_min"),
                "portada_url": datos.get("portada_url"),
                "video_url": datos.get("video_url"),
                "fecha_estreno": datos.get("fecha_estreno"),
                "activo": datos.get("activo", True),
            },
        )
        nuevo_id = row["id"]
        self._sync_generos(nuevo_id, datos.get("generos", []))
        self._sync_categorias(nuevo_id, datos.get("categorias", []))
        self._refresh_cartelera()
        return self.obtener_por_id(str(nuevo_id))

    # ---- Actualizar contenido ----
    def actualizar_contenido(self, contenido_id: str, datos: dict[str, Any]) -> Optional[dict[str, Any]]:
        self.db.execute(
            """
            UPDATE contenido SET
                titulo        = COALESCE(%(titulo)s,        titulo),
                tipo          = COALESCE(%(tipo)s::tipo_contenido, tipo),
                sinopsis      = %(sinopsis)s,
                anio          = %(anio)s,
                clasificacion = COALESCE(%(clasificacion)s::clasificacion_edad, clasificacion),
                duracion_min  = %(duracion_min)s,
                portada_url   = %(portada_url)s,
                video_url     = %(video_url)s,
                fecha_estreno = %(fecha_estreno)s,
                activo        = COALESCE(%(activo)s,        activo)
            WHERE id = %(id)s::uuid
            """,
            {
                "id": contenido_id,
                "titulo": datos.get("titulo"),
                "tipo": datos.get("tipo"),
                "sinopsis": datos.get("sinopsis"),
                "anio": datos.get("anio"),
                "clasificacion": datos.get("clasificacion"),
                "duracion_min": datos.get("duracion_min"),
                "portada_url": datos.get("portada_url"),
                "video_url": datos.get("video_url"),
                "fecha_estreno": datos.get("fecha_estreno"),
                "activo": datos.get("activo"),
            },
        )
        if "generos" in datos:
            self._sync_generos(contenido_id, datos["generos"])
        if "categorias" in datos:
            self._sync_categorias(contenido_id, datos["categorias"])
        self._refresh_cartelera()
        return self.obtener_por_id(contenido_id)

    # ---- Eliminar (soft delete) ----
    def eliminar_contenido(self, contenido_id: str) -> bool:
        self.db.execute(
            "UPDATE contenido SET activo = FALSE WHERE id = %(id)s::uuid",
            {"id": contenido_id},
        )
        self._refresh_cartelera()
        return True

    # ---- Programar estreno ----
    def programar_estreno(self, contenido_id: str, fecha_estreno: Optional[str]) -> Optional[dict[str, Any]]:
        self.db.execute(
            "UPDATE contenido SET fecha_estreno = %(fecha)s WHERE id = %(id)s::uuid",
            {"id": contenido_id, "fecha": fecha_estreno},
        )
        self._refresh_cartelera()
        return self.obtener_por_id(contenido_id)

    # ---- Metadatos ----
    def listar_generos(self) -> list[dict[str, Any]]:
        return self.db.fetch_all("SELECT id, nombre FROM generos ORDER BY nombre")

    def listar_categorias(self) -> list[dict[str, Any]]:
        return self.db.fetch_all("SELECT id, nombre FROM categorias ORDER BY nombre")

    # ---- Obtener URLs de Video ----
    def obtener_video_pelicula(self, contenido_id: str) -> Optional[str]:
        row = self.db.fetch_one(
            "SELECT video_url FROM contenido WHERE id = %(id)s::uuid AND tipo = 'pelicula'",
            {"id": contenido_id}
        )
        return row["video_url"] if row else None

    def obtener_video_episodio(self, contenido_id: str, temporada: int, episodio: int) -> Optional[str]:
        row = self.db.fetch_one(
            """
            SELECT e.video_url 
            FROM episodios e
            JOIN temporadas t ON t.id = e.temporada_id
            WHERE t.contenido_id = %(id)s::uuid AND t.numero = %(temporada)s AND e.numero = %(episodio)s
            """,
            {"id": contenido_id, "temporada": temporada, "episodio": episodio}
        )
        return row["video_url"] if row else None

    # ---- Helpers internos ----
    def _sync_generos(self, contenido_id: Any, generos: list[str]) -> None:
        self.db.execute(
            "DELETE FROM contenido_genero WHERE contenido_id = %(id)s::uuid",
            {"id": str(contenido_id)},
        )
        for nombre in generos:
            if not nombre.strip():
                continue
            row = self.db.execute_returning(
                "INSERT INTO generos (nombre) VALUES (%(n)s) ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id",
                {"n": nombre.strip()},
            )
            self.db.execute(
                "INSERT INTO contenido_genero (contenido_id, genero_id) VALUES (%(cid)s::uuid, %(gid)s) ON CONFLICT DO NOTHING",
                {"cid": str(contenido_id), "gid": row["id"]},
            )

    def _sync_categorias(self, contenido_id: Any, categorias: list[str]) -> None:
        self.db.execute(
            "DELETE FROM contenido_categoria WHERE contenido_id = %(id)s::uuid",
            {"id": str(contenido_id)},
        )
        for nombre in categorias:
            if not nombre.strip():
                continue
            row = self.db.execute_returning(
                "INSERT INTO categorias (nombre) VALUES (%(n)s) ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id",
                {"n": nombre.strip()},
            )
            self.db.execute(
                "INSERT INTO contenido_categoria (contenido_id, categoria_id) VALUES (%(cid)s::uuid, %(catid)s) ON CONFLICT DO NOTHING",
                {"cid": str(contenido_id), "catid": row["id"]},
            )

    def _refresh_cartelera(self) -> None:
        self.db.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY vw_cartelera")
