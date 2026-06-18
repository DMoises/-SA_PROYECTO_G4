"""Entrega de multimedia desde Google Cloud Storage (GCS).

Convierte el valor guardado en la BD (contenido.video_url / contenido.portada_url /
episodios.video_url) en una URL reproducible por el navegador. NO hace falta migrar el
seed: el valor se PARSEA para extraer la clave del objeto y se firma contra el bucket
privado configurado (GCS_BUCKET_NAME). Formas reconocidas como objeto de GCS:

- 'gs://bucket/objeto'
- 'https://storage.googleapis.com/bucket/objeto'        (path-style)
- 'https://bucket.storage.googleapis.com/objeto'        (virtual-hosted)
- 'https://storage.cloud.google.com/bucket/objeto'      (consola)
- 'videos/x.mp4'                                        (clave relativa)

En todos los casos solo se toma la CLAVE del objeto (p.ej. 'videos/x.mp4') y se firma
contra self._bucket: asi el nombre del bucket vive en un unico lugar (env) y el bucket
que venga embebido en una URL legacy ('quetxal-tv') no importa.

Cualquier otra URL http(s) (CDN externo) o enlace de YouTube se devuelve TAL CUAL.

Autenticacion por ADC (Application Default Credentials): al correr en la VM/Pod con la
cuenta de servicio asignada, el SDK toma las credenciales por si solo. NO se usan llaves
JSON ni HMAC. Como en GCE no hay llave privada local, la firma v4 se delega en la API IAM
signBlob: ESTO EXIGE que la cuenta de servicio tenga, ademas de acceso al bucket
(Storage Object Viewer/Admin), el rol roles/iam.serviceAccountTokenCreator sobre si misma.

Degrada con gracia: si el SDK/ADC no esta disponible (p.ej. en local o en los tests del CI)
o la firma falla, se devuelve el valor original sin romper el flujo de reproduccion.
"""
from __future__ import annotations

import time
from datetime import timedelta
from typing import Optional
from urllib.parse import unquote, urlparse

# Hosts que sirven objetos de GCS por HTTP.
_GCS_PATH_HOSTS = ("storage.googleapis.com", "storage.cloud.google.com")
_GCS_VHOST_SUFFIX = ".storage.googleapis.com"
# Pistas para no tratar enlaces de YouTube como objetos (cuando vienen sin esquema).
_PASSTHROUGH_HINTS = ("youtube.com", "youtu.be")
_MEDIA_EXTS = (
    ".mp4", ".webm", ".mov", ".m4v", ".mkv",
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif",
)


class MediaStorage:
    """Resuelve valores de media a URLs reproducibles, firmando los objetos de GCS."""

    def __init__(self, cfg) -> None:
        self._bucket = cfg.gcs_bucket
        self._project = cfg.gcs_project
        self._ttl = timedelta(seconds=cfg.gcs_signed_url_ttl_seconds)
        self._enabled = cfg.gcs_enabled
        # Inicializacion perezosa: importar el SDK / contactar ADC solo cuando
        # de verdad hay que firmar (asi el import del modulo nunca falla).
        self._client = None
        self._creds = None
        # Cache simple por objeto para no llamar a IAM signBlob en cada portada
        # de la cartelera. Se guarda hasta la mitad del TTL para no entregar
        # URLs casi vencidas. Valor: (expira_monotonic, url_firmada).
        self._cache: dict[str, tuple[float, str]] = {}

    # ------------------------------------------------------------------
    def to_playable_url(self, value: Optional[str]) -> Optional[str]:
        """Devuelve una URL lista para el navegador a partir del valor guardado."""
        if not value:
            return value
        v = value.strip()
        key = self._object_key(v)
        if not self._enabled or key is None:
            return v  # YouTube / CDN externo / valor vacio -> passthrough
        return self._signed_url(key) or v

    # ------------------------------------------------------------------
    def _object_key(self, v: str) -> Optional[str]:
        """Extrae la clave del objeto de GCS, o None si no es un objeto de GCS."""
        low = v.lower()

        if low.startswith("gs://"):
            _bucket, _, blob = v[len("gs://"):].partition("/")
            return blob or None

        if "://" in v:
            parsed = urlparse(v)
            host = parsed.netloc.lower()
            path = unquote(parsed.path).lstrip("/")
            if host in _GCS_PATH_HOSTS:
                # path-style: /<bucket>/<objeto...>  -> descartamos el bucket
                _bucket, _, blob = path.partition("/")
                return blob or None
            if host.endswith(_GCS_VHOST_SUFFIX):
                # virtual-hosted: <bucket>.storage.googleapis.com/<objeto...>
                return path or None
            return None  # otro host http(s) (YouTube, CDN externo) -> passthrough

        # Sin esquema: clave relativa. Excluye IDs sueltos de YouTube.
        if any(hint in low for hint in _PASSTHROUGH_HINTS):
            return None
        if "/" in v or low.endswith(_MEDIA_EXTS):
            return v.lstrip("/")
        return None

    def _signed_url(self, blob_name: str) -> Optional[str]:
        now = time.monotonic()
        cached = self._cache.get(blob_name)
        if cached and cached[0] > now:
            return cached[1]
        try:
            from google.auth.transport import requests as ga_requests

            client = self._get_client()
            blob = client.bucket(self._bucket).blob(blob_name)
            # Refresca el token de la cuenta de servicio para poder firmar via IAM.
            self._creds.refresh(ga_requests.Request())
            url = blob.generate_signed_url(
                version="v4",
                expiration=self._ttl,
                method="GET",
                # Al pasar email + token, el SDK firma con la API IAM signBlob
                # (no necesita llave privada local: puro ADC de la VM/Pod).
                service_account_email=getattr(self._creds, "service_account_email", None),
                access_token=getattr(self._creds, "token", None),
            )
            self._cache[blob_name] = (now + self._ttl.total_seconds() / 2, url)
            return url
        except Exception as exc:  # noqa: BLE001 - degradar sin romper la reproduccion
            print(f"[gcs] no se pudo firmar {self._bucket}/{blob_name}: {exc}", flush=True)
            return None

    def _get_client(self):
        if self._client is None:
            import google.auth
            from google.cloud import storage

            self._creds, _ = google.auth.default()
            self._client = storage.Client(project=self._project, credentials=self._creds)
        return self._client
