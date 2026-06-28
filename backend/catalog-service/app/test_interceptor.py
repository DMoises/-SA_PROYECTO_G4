import unittest
from unittest.mock import MagicMock, patch
import grpc
import jwt
from .config import Config
from .interceptor import SecurityInterceptor

class MockCallDetails:
    def __init__(self, method, metadata):
        self.method = method
        self.invocation_metadata = metadata

class TestSecurityInterceptor(unittest.TestCase):
    def setUp(self):
        # Mock Config
        self.cfg = MagicMock(spec=Config)
        self.cfg.jwt_secret = "testsecret"
        self.cfg.auth_dsn = "host=auth"
        self.cfg.sub_dsn = "host=sub"
        self.cfg.dsn = "host=catalog"

        self.interceptor = SecurityInterceptor(self.cfg)
        self.continuation = MagicMock(return_value="success")

    def test_non_secure_method_passes_through(self):
        details = MockCallDetails("/catalog.v1.CatalogService/ExplorarCartelera", [])
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertEqual(res, "success")
        self.continuation.assert_called_once_with(details)

    @patch("jwt.decode")
    def test_missing_token_rebuilt_as_terminator(self, mock_jwt):
        details = MockCallDetails("/catalog.v1.CatalogService/ObtenerFichaTecnica", [])
        res = self.interceptor.intercept_service(self.continuation, details)
        # Should return the terminator handler, not call continuation
        self.assertNotEqual(res, "success")
        self.continuation.assert_not_called()

    @patch("jwt.decode")
    def test_invalid_token_rejected(self, mock_jwt):
        mock_jwt.side_effect = jwt.PyJWTError("invalid signature")
        details = MockCallDetails(
            "/catalog.v1.CatalogService/ObtenerFichaTecnica",
            [("authorization", "invalid_token")]
        )
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertNotEqual(res, "success")
        self.continuation.assert_not_called()

    @patch("psycopg.connect")
    @patch("jwt.decode")
    def test_no_active_subscription_rejected(self, mock_jwt, mock_connect):
        mock_jwt.return_value = {"usuario_id": "usr-1"}
        
        # Mock DB response for active plan to be empty (no active subscription)
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.fetchone.return_value = None
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_connect.return_value = mock_conn

        details = MockCallDetails(
            "/catalog.v1.CatalogService/ObtenerFichaTecnica",
            [("authorization", "token")]
        )
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertNotEqual(res, "success")
        self.continuation.assert_not_called()

    @patch("psycopg.connect")
    @patch("jwt.decode")
    def test_download_request_requires_premium_plan(self, mock_jwt, mock_connect):
        mock_jwt.return_value = {"usuario_id": "usr-1"}
        
        # Case A: Plan is Basico -> download rejected
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.fetchone.side_effect = [("Basico",)] # sub plan query
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_connect.return_value = mock_conn

        details = MockCallDetails(
            "/catalog.v1.CatalogService/ObtenerFichaTecnica",
            [("authorization", "token"), ("x-download-request", "true")]
        )
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertNotEqual(res, "success")

        # Case B: Plan is Premium -> download allowed (content is TP)
        mock_cur.fetchone.side_effect = [
            ("Premium",), # sub plan query
            ("TP",)        # content classification query
        ]
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertEqual(res, "success")

    @patch("psycopg.connect")
    @patch("jwt.decode")
    def test_parental_control_blocks_child_without_pin(self, mock_jwt, mock_connect):
        mock_jwt.return_value = {"usuario_id": "usr-1"}
        
        # Case A: Kids profile, non-TP content (+13), correct PIN -> allowed
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.fetchone.side_effect = [
            ("Estandar",), # active subscription check
            ("+13",),      # content classification check (requires PIN)
            (True, "4321") # profile check: es_infantil=True, pin='4321'
        ]
        mock_conn.__enter__.return_value = mock_conn
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_connect.return_value = mock_conn

        details = MockCallDetails(
            "/catalog.v1.CatalogService/ObtenerFichaTecnica",
            [
                ("authorization", "token"),
                ("x-contenido-id", "movie-1"),
                ("x-profile-id", "prof-1"),
                ("x-parental-pin", "4321"),
                ("x-playback-request", "true")
            ]
        )
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertEqual(res, "success")

        # Case B: Kids profile, non-TP content (+13), incorrect PIN -> rejected
        mock_cur.fetchone.side_effect = [
            ("Estandar",), # active subscription check
            ("+13",),      # content classification check
            (True, "4321") # profile check
        ]
        details = MockCallDetails(
            "/catalog.v1.CatalogService/ObtenerFichaTecnica",
            [
                ("authorization", "token"),
                ("x-contenido-id", "movie-1"),
                ("x-profile-id", "prof-1"),
                ("x-parental-pin", "1111"), # wrong PIN
                ("x-playback-request", "true")
            ]
        )
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertNotEqual(res, "success")

        # Case C: Kids profile, non-TP content (+13), missing PIN -> rejected
        mock_cur.fetchone.side_effect = [
            ("Estandar",),
            ("+13",),
            (True, "4321")
        ]
        details = MockCallDetails(
            "/catalog.v1.CatalogService/ObtenerFichaTecnica",
            [
                ("authorization", "token"),
                ("x-contenido-id", "movie-1"),
                ("x-profile-id", "prof-1"), # missing X-Parental-Pin
                ("x-playback-request", "true")
            ]
        )
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertNotEqual(res, "success")

        # Case D: Kids profile, non-TP content, SIN marca de reproduccion
        # (solo viendo la ficha) -> permitido aunque no haya PIN.
        mock_cur.fetchone.side_effect = [
            ("Estandar",), # active subscription check
            ("+13",),      # content classification check
        ]
        details = MockCallDetails(
            "/catalog.v1.CatalogService/ObtenerFichaTecnica",
            [
                ("authorization", "token"),
                ("x-contenido-id", "movie-1"),
                ("x-profile-id", "prof-1") # sin x-playback-request ni PIN
            ]
        )
        res = self.interceptor.intercept_service(self.continuation, details)
        self.assertEqual(res, "success")

if __name__ == "__main__":
    unittest.main()
