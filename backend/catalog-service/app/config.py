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

        # --- Google Cloud Storage (multimedia: videos y portadas) ---
        # Auth por ADC (cuenta de servicio de la VM/Pod): sin llaves JSON ni HMAC.
        self.gcs_bucket = _env("GCS_BUCKET_NAME", "quetxal-tv-media-bucket")
        self.gcs_project = _env("GCS_PROJECT_ID", "quetxal-tv-498705")
        # TTL de las Signed URLs v4 (por defecto 2h, como pide la tarea).
        self.gcs_signed_url_ttl_seconds = int(_env("GCS_SIGNED_URL_TTL", "7200"))
        # Permite desactivar la firma (passthrough total) sin tocar codigo.
        self.gcs_enabled = _env("GCS_ENABLED", "true").lower() in ("1", "true", "yes", "on")

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
