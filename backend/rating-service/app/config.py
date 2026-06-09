"""Configuracion del rating-service desde variables de entorno.

Mismo enfoque que el resto de servicios: valores con defaults y un DSN listo
para psycopg. Nombres de variables consistentes (RATING_DB_*, GRPC_PORT).
"""
import os


class Config:
    def __init__(self) -> None:
        self.grpc_port = _env("GRPC_PORT", "50056")
        self.db_host = _env("RATING_DB_HOST", "rating-db")
        self.db_port = _env("RATING_DB_PORT_INTERNAL", "5432")  # puerto INTERNO de postgres
        self.db_name = _env("RATING_DB_NAME", "rating_db")
        self.db_user = _env("RATING_DB_USER", "rating_user")
        self.db_password = _env("RATING_DB_PASSWORD", "")

    @property
    def dsn(self) -> str:
        return (
            f"host={self.db_host} port={self.db_port} dbname={self.db_name} "
            f"user={self.db_user} password={self.db_password} sslmode=disable"
        )


def _env(key: str, default: str) -> str:
    value = os.getenv(key)
    return value if value else default
