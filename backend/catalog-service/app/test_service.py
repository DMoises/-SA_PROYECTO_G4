import unittest
from unittest.mock import MagicMock

from . import errors
from .config import Config
from .service import CatalogService, _limpiar, _agrupar_temporadas


class TestCatalogService(unittest.TestCase):
    def setUp(self):
        self.mock_repo = MagicMock()
        self.service = CatalogService(self.mock_repo)

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


class TestConfig(unittest.TestCase):
    """Cubre la construccion de DSNs y la lectura de variables de entorno,
    incluidas las conexiones a auth_db y subscription_db que usa el
    interceptor de Control Parental."""

    def test_dsn_catalogo(self):
        cfg = Config()
        dsn = cfg.dsn
        self.assertIn("dbname=", dsn)
        self.assertIn("host=", dsn)
        self.assertIn("sslmode=disable", dsn)

    def test_dsn_auth_y_subscripcion(self):
        cfg = Config()
        # El DSN debe construirse con los nombres de cada base de datos.
        self.assertIn(cfg.auth_db_name, cfg.auth_dsn)
        self.assertIn(cfg.sub_db_name, cfg.sub_dsn)
        self.assertIn("sslmode=disable", cfg.auth_dsn)
        self.assertIn("sslmode=disable", cfg.sub_dsn)

    def test_valores_por_defecto(self):
        cfg = Config()
        self.assertTrue(cfg.jwt_secret)
        self.assertIsInstance(cfg.admin_http_port, int)
        self.assertIsInstance(cfg.gcs_enabled, bool)
        self.assertGreater(cfg.gcs_signed_url_ttl_seconds, 0)


if __name__ == "__main__":
    unittest.main()
