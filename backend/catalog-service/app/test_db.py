import unittest
from unittest.mock import MagicMock, patch
from .db import Database

class TestDatabase(unittest.TestCase):
    @patch("app.db.ConnectionPool")
    def test_database_queries(self, mock_pool_cls):
        mock_pool = MagicMock()
        mock_pool_cls.return_value = mock_pool

        # Mock connection and cursor behavior
        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_conn.__enter__.return_value = mock_conn
        mock_pool.connection.return_value = mock_conn

        cfg = MagicMock()
        cfg.dsn = "host=test"

        db = Database(cfg)
        mock_pool_cls.assert_called_once_with(conninfo="host=test", min_size=1, max_size=10, open=False)
        mock_pool.open.assert_called_once_with(wait=True)

        # 1. Test fetch_all
        mock_cur.fetchall.return_value = [{"col": "val"}]
        res_all = db.fetch_all("SELECT 1")
        self.assertEqual(res_all, [{"col": "val"}])

        # 2. Test fetch_one
        mock_cur.fetchone.return_value = {"col": "val"}
        res_one = db.fetch_one("SELECT 1")
        self.assertEqual(res_one, {"col": "val"})

        # 3. Test execute
        db.execute("UPDATE tbl SET col = 1")
        mock_conn.commit.assert_called_once()

        # 4. Test execute_returning
        mock_conn.commit.reset_mock()
        mock_cur.fetchone.return_value = {"id": 1}
        res_ret = db.execute_returning("INSERT INTO tbl DEFAULT VALUES RETURNING id")
        self.assertEqual(res_ret, {"id": 1})
        mock_conn.commit.assert_called_once()

        # 5. Test close
        db.close()
        mock_pool.close.assert_called_once()
