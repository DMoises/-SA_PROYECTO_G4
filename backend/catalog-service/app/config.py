"""Carga la configuracion del catalog-service desde variables de entorno.

Equivale a internal/config/config.go del auth-service: valores con defaults
y un DSN listo para psycopg. Los nombres de las variables siguen la misma
convencion que el resto de servicios (CATALOG_DB_*, GRPC_PORT).
"""
import os


class Config:
    def __init__(self) -> None:
        self.grpc_port = _env("GRPC_PORT", "50053")
        self.admin_http_port = int(_env("CATALOG_ADMIN_HTTP_PORT", "8086"))
        self.db_host = _env("CATALOG_DB_HOST", "catalog-db")
        self.db_port = _env("CATALOG_DB_PORT_INTERNAL", "5432")  # puerto INTERNO de postgres
        self.db_name = _env("CATALOG_DB_NAME", "catalog_db")
        self.db_user = _env("CATALOG_DB_USER", "catalog_user")
        self.db_password = _env("CATALOG_DB_PASSWORD", "")

    @property
    def dsn(self) -> str:
        # Trafico interno en la red de Docker: sin TLS (sslmode disable).
        return (
            f"host={self.db_host} port={self.db_port} dbname={self.db_name} "
            f"user={self.db_user} password={self.db_password} sslmode=disable"
        )


def _env(key: str, default: str) -> str:
    value = os.getenv(key)
    return value if value else default
