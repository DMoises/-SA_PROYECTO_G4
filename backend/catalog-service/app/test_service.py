import unittest
from unittest.mock import MagicMock

from . import errors
from .service import CatalogService, _limpiar, _agrupar_temporadas


class TestCatalogService(unittest.TestCase):
    def setUp(self):
        self.mock_repo = MagicMock()
        self.service = CatalogService(self.mock_repo, rating_dsn="", history_dsn="")

    def test_limpiar_helper(self):
        self.assertIsNone(_limpiar(None))
        self.assertIsNone(_limpiar(""))
        self.assertIsNone(_limpiar("   "))
        self.assertEqual(_limpiar(" Matrix "), "Matrix")
        self.assertEqual(_limpiar("Acción"), "Acción")

    def test_agrupar_temporadas_helper(self):
        filas = [
            {"temporada": 1, "episodio": 1, "titulo": "Piloto", "duracion_min": 45, "video_url": "videos/s1e1.mp4"},
            {"temporada": 1, "episodio": 2, "titulo": "El Regreso", "duracion_min": 42, "video_url": "videos/s1e2.mp4"},
            {"temporada": 2, "episodio": 1, "titulo": "Nuevo Comienzo", "duracion_min": 48, "video_url": "videos/s2e1.mp4"},
        ]
        resultado = _agrupar_temporadas(filas)
        esperado = [
            {
                "numero": 1,
                "episodios": [
                    {"numero": 1, "titulo": "Piloto", "duracion_min": 45, "video_url": "videos/s1e1.mp4"},
                    {"numero": 2, "titulo": "El Regreso", "duracion_min": 42, "video_url": "videos/s1e2.mp4"},
                ]
            },
            {
                "numero": 2,
                "episodios": [
                    {"numero": 1, "titulo": "Nuevo Comienzo", "duracion_min": 48, "video_url": "videos/s2e1.mp4"},
                ]
            }
        ]
        self.assertEqual(resultado, esperado)

    def test_explorar_cartelera(self):
        self.mock_repo.explorar_cartelera.return_value = [
            {"contenido_id": "uuid-1", "titulo": "Movie 1", "tipo": "pelicula", "anio": 2020, "clasificacion": "TP", "generos": "Accion", "categorias": "General"},
            {"contenido_id": "uuid-2", "titulo": "Serie 1", "tipo": "serie", "anio": 2021, "clasificacion": "+13", "generos": "Drama", "categorias": "General"},
        ]
        result = self.service.explorar_cartelera()
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["titulo"], "Movie 1")
        self.mock_repo.explorar_cartelera.assert_called_once()

    def test_buscar(self):
        self.mock_repo.buscar.return_value = [
            {"contenido_id": "uuid-1", "titulo": "Movie 1", "tipo": "pelicula", "anio": 2020, "clasificacion": "TP", "generos": "Accion", "categorias": "General"},
        ]
        result = self.service.buscar(" Movie ", "  ", "Accion", None, "pelicula")
        self.assertEqual(len(result), 1)
        self.mock_repo.buscar.assert_called_once_with(
            "Movie", None, "Accion", None, "pelicula"
        )

    def test_obtener_ficha_datos_invalidos(self):
        with self.assertRaises(errors.DatosInvalidos):
            self.service.obtener_ficha("")

        with self.assertRaises(errors.DatosInvalidos):
            self.service.obtener_ficha("   ")

    def test_obtener_ficha_no_encontrado(self):
        self.mock_repo.obtener_contenido.return_value = None
        with self.assertRaises(errors.ContenidoNoEncontrado):
            self.service.obtener_ficha("uuid-nonexistent")

    def test_obtener_ficha_pelicula(self):
        self.mock_repo.obtener_contenido.return_value = {
            "contenido_id": "uuid-1",
            "titulo": "Inception",
            "tipo": "pelicula",
            "sinopsis": "Un ladrón que roba secretos...",
            "anio": 2010,
            "clasificacion": "+13",
            "duracion_min": 148,
            "generos": "Sci-Fi, Accion",
            "categorias": "Estrenos",
        }
        self.mock_repo.obtener_reparto.return_value = [
            {"actor": "Leonardo DiCaprio", "personaje": "Cobb", "rol": "protagonista"},
            {"actor": "Joseph Gordon-Levitt", "personaje": "Arthur", "rol": "secundario"},
        ]

        result = self.service.obtener_ficha("uuid-1")
        self.assertEqual(result["titulo"], "Inception")
        self.assertEqual(len(result["reparto"]), 2)
        self.assertEqual(result["temporadas"], [])
        self.mock_repo.obtener_contenido.assert_called_once_with("uuid-1")
        self.mock_repo.obtener_reparto.assert_called_once_with("uuid-1")

    def test_obtener_ficha_serie(self):
        self.mock_repo.obtener_contenido.return_value = {
            "contenido_id": "uuid-2",
            "titulo": "Breaking Bad",
            "tipo": "serie",
            "sinopsis": "Un profesor de química...",
            "anio": 2008,
            "clasificacion": "+16",
            "duracion_min": None,
            "generos": "Drama, Crimen",
            "categorias": "Recomendados",
        }
        self.mock_repo.obtener_reparto.return_value = [
            {"actor": "Bryan Cranston", "personaje": "Walter White", "rol": "protagonista"},
        ]
        self.mock_repo.obtener_episodios.return_value = [
            {"temporada": 1, "episodio": 1, "titulo": "Pilot", "duracion_min": 58},
        ]

        result = self.service.obtener_ficha("uuid-2")
        self.assertEqual(result["titulo"], "Breaking Bad")
        self.assertEqual(len(result["temporadas"]), 1)
        self.assertEqual(result["temporadas"][0]["numero"], 1)
        self.assertEqual(len(result["temporadas"][0]["episodios"]), 1)
        self.mock_repo.obtener_episodios.assert_called_once_with("uuid-2")

    # =========================================================================
    # Tests del Motor de Recomendacion (Content-Based Filtering por generos)
    # =========================================================================

    def test_recomendaciones_perfil_id_vacio_lanza_error(self):
        """perfil_id obligatorio: lanza DatosInvalidos si esta vacio."""
        with self.assertRaises(errors.DatosInvalidos):
            self.service.obtener_recomendaciones("")

    def test_recomendaciones_sin_interacciones_devuelve_cartelera(self):
        """Si el perfil no tiene historial ni votos, devuelve los primeros
        12 items de la cartelera como fallback."""
        self.mock_repo.obtener_historial_contenido_ids.return_value = []
        self.mock_repo.obtener_votos_positivos_contenido_ids.return_value = []
        cartelera = [
            {"contenido_id": f"uuid-{i}", "titulo": f"Movie {i}", "tipo": "pelicula",
             "anio": 2020, "clasificacion": "TP", "generos": "Accion", "categorias": ""}
            for i in range(15)
        ]
        self.mock_repo.explorar_cartelera.return_value = cartelera

        result = self.service.obtener_recomendaciones("perfil-1")
        self.assertEqual(len(result), 12)

    def test_recomendaciones_prioriza_generos_calificados(self):
        """Los contenidos con generos que coinciden con los que el perfil
        califico positivamente deben aparecer primero."""
        self.mock_repo.obtener_historial_contenido_ids.return_value = []
        self.mock_repo.obtener_votos_positivos_contenido_ids.return_value = ["uuid-1"]
        self.mock_repo.explorar_cartelera.return_value = [
            {"contenido_id": "uuid-1", "titulo": "Accion Movie", "tipo": "pelicula",
             "anio": 2020, "clasificacion": "TP", "generos": "Accion", "categorias": ""},
            {"contenido_id": "uuid-2", "titulo": "Drama Movie", "tipo": "pelicula",
             "anio": 2021, "clasificacion": "+13", "generos": "Drama", "categorias": ""},
            {"contenido_id": "uuid-3", "titulo": "Otra Accion", "tipo": "pelicula",
             "anio": 2022, "clasificacion": "TP", "generos": "Accion", "categorias": ""},
        ]

        result = self.service.obtener_recomendaciones("perfil-1")
        # uuid-3 (Accion, no visto) debe tener mayor puntaje que uuid-2 (Drama, no visto)
        titulos = [r["titulo"] for r in result]
        self.assertIn("Otra Accion", titulos)
        # El contenido de Accion NO visto debe estar antes que el de Drama
        idx_accion = titulos.index("Otra Accion")
        idx_drama = titulos.index("Drama Movie")
        self.assertLess(idx_accion, idx_drama)

    def test_recomendaciones_penaliza_ya_vistos(self):
        """Los contenidos ya vistos en el historial se penalizan con factor 0.2
        para priorizar el descubrimiento de contenido nuevo."""
        self.mock_repo.obtener_historial_contenido_ids.return_value = ["uuid-1"]
        self.mock_repo.obtener_votos_positivos_contenido_ids.return_value = ["uuid-1"]
        self.mock_repo.explorar_cartelera.return_value = [
            {"contenido_id": "uuid-1", "titulo": "Visto Accion", "tipo": "pelicula",
             "anio": 2020, "clasificacion": "TP", "generos": "Accion", "categorias": ""},
            {"contenido_id": "uuid-2", "titulo": "Nueva Accion", "tipo": "pelicula",
             "anio": 2022, "clasificacion": "TP", "generos": "Accion", "categorias": ""},
        ]

        result = self.service.obtener_recomendaciones("perfil-1")
        titulos = [r["titulo"] for r in result]
        # "Nueva Accion" (no vista, mismo genero) debe estar antes que "Visto Accion"
        idx_nueva = titulos.index("Nueva Accion")
        idx_visto = titulos.index("Visto Accion")
        self.assertLess(idx_nueva, idx_visto)


if __name__ == "__main__":
    unittest.main()
