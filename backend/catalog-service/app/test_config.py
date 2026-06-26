import unittest
from unittest.mock import patch
from .config import Config

class TestConfig(unittest.TestCase):
    @patch.dict('os.environ', {
        'GRPC_PORT': '50053',
        'CATALOG_ADMIN_HTTP_PORT': '8086',
        'CATALOG_DB_HOST': 'catalog-db',
        'CATALOG_DB_PORT_INTERNAL': '5432',
        'CATALOG_DB_NAME': 'catalog_db',
        'CATALOG_DB_USER': 'catalog_user',
        'CATALOG_DB_PASSWORD': 'password',
        'AUTH_DB_HOST': 'auth-db',
        'AUTH_DB_PORT_INTERNAL': '5432',
        'AUTH_DB_NAME': 'auth_db',
        'AUTH_DB_USER': 'auth_user',
        'AUTH_DB_PASSWORD': 'password',
        'SUBSCRIPTION_DB_HOST': 'subscription-db',
        'SUBSCRIPTION_DB_PORT_INTERNAL': '5432',
        'SUBSCRIPTION_DB_NAME': 'subscription_db',
        'SUBSCRIPTION_DB_USER': 'subscription_user',
        'SUBSCRIPTION_DB_PASSWORD': 'password',
        'HISTORY_DB_HOST': 'history-db',
        'HISTORY_DB_PORT_INTERNAL': '5432',
        'HISTORY_DB_NAME': 'history_db',
        'HISTORY_DB_USER': 'history_user',
        'HISTORY_DB_PASSWORD': 'password',
        'RATING_DB_HOST': 'rating-db',
        'RATING_DB_PORT_INTERNAL': '5432',
        'RATING_DB_NAME': 'rating_db',
        'RATING_DB_USER': 'rating_user',
        'RATING_DB_PASSWORD': 'password'
    })
    def test_config_properties(self):
        cfg = Config()
        self.assertEqual(cfg.grpc_port, '50053')
        self.assertEqual(cfg.admin_http_port, 8086)
        
        self.assertIn("host=catalog-db", cfg.dsn)
        self.assertIn("port=5432", cfg.dsn)
        self.assertIn("dbname=catalog_db", cfg.dsn)
        self.assertIn("user=catalog_user", cfg.dsn)
        self.assertIn("password=password", cfg.dsn)

        self.assertIn("host=auth-db", cfg.auth_dsn)
        self.assertIn("dbname=auth_db", cfg.auth_dsn)

        self.assertIn("host=subscription-db", cfg.sub_dsn)
        self.assertIn("dbname=subscription_db", cfg.sub_dsn)

        self.assertIn("host=history-db", cfg.history_dsn)
        self.assertIn("dbname=history_db", cfg.history_dsn)

        self.assertIn("host=rating-db", cfg.rating_dsn)
        self.assertIn("dbname=rating_db", cfg.rating_dsn)
