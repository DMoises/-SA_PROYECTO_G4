import unittest
from unittest.mock import MagicMock, patch
from .repository import CatalogRepository

class TestCatalogRepository(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.repo = CatalogRepository(self.mock_db)

    def test_explorar_cartelera(self):
        self.mock_db.fetch_all.return_value = [{"contenido_id": "1", "titulo": "Test"}]
        res = self.repo.explorar_cartelera()
        self.assertEqual(len(res), 1)
        self.mock_db.fetch_all.assert_called_once()

    def test_buscar(self):
        self.mock_db.fetch_all.return_value = []
        res = self.repo.buscar("Inception", None, None, None, None)
        self.assertEqual(res, [])
        self.mock_db.fetch_all.assert_called_once()

    def test_obtener_contenido(self):
        self.mock_db.fetch_one.return_value = {"titulo": "Breaking Bad"}
        res = self.repo.obtener_contenido("uuid-1")
        self.assertEqual(res["titulo"], "Breaking Bad")

    def test_obtener_reparto(self):
        self.mock_db.fetch_all.return_value = []
        res = self.repo.obtener_reparto("uuid-1")
        self.assertEqual(res, [])

    def test_obtener_episodios(self):
        self.mock_db.fetch_all.return_value = []
        res = self.repo.obtener_episodios("uuid-1")
        self.assertEqual(res, [])

    @patch("psycopg.connect")
    def test_obtener_historial_y_votos(self, mock_connect):
        # Mock psycopg connection & cursor
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.fetchall.return_value = [("uuid-content-1",), ("uuid-content-2",)]
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_connect.return_value = mock_conn

        hist = self.repo.obtener_historial_contenido_ids("perfil-1", "dsn1", "dsn2")
        self.assertEqual(hist, ["uuid-content-1", "uuid-content-2"])

        votos = self.repo.obtener_votos_positivos_contenido_ids("perfil-1", "dsn1")
        self.assertEqual(votos, ["uuid-content-1", "uuid-content-2"])

    @patch("psycopg.connect")
    def test_obtener_historial_y_votos_exceptions(self, mock_connect):
        mock_connect.side_effect = Exception("conn error")
        hist = self.repo.obtener_historial_contenido_ids("perfil-1", "dsn1", "dsn2")
        self.assertEqual(hist, [])

        votos = self.repo.obtener_votos_positivos_contenido_ids("perfil-1", "dsn1")
        self.assertEqual(votos, [])
