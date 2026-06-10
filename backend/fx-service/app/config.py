"""Configuracion del fx-service desde variables de entorno."""

import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    def __init__(self) -> None:
        self.grpc_port = _env("FX_GRPC_PORT", "50053")

        self.db_host = _env("FX_DB_HOST", "localhost")
        self.db_port = _env("FX_DB_PORT", "5437")
        self.db_name = _env("FX_DB_NAME", "fx")
        self.db_user = _env("FX_DB_USER", "fx")
        self.db_password = _env("FX_DB_PASSWORD", "admin")

        self.redis_host = _env("REDIS_HOST", "localhost")
        self.redis_port = int(_env("REDIS_PORT", "6379"))
        self.redis_password = os.getenv("REDIS_PASSWORD")
        self.cache_ttl = int(_env("FX_CACHE_TTL", "300"))

        self.fx_api_url = _env(
            "FX_API_URL",
            "https://api.frankfurter.dev",
        )
        self.fx_api_timeout = float(
            _env("FX_API_TIMEOUT", "5")
        )

    @property
    def dsn(self) -> str:
        return (
            f"host={self.db_host} port={self.db_port} "
            f"dbname={self.db_name} "
            f"user={self.db_user} password={self.db_password} "
            f"sslmode=disable"
        )


def _env(key: str, default: str) -> str:
    value = os.getenv(key)
    return value if value else default