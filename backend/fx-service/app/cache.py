"""Cache de tasas en Redis, detras de una interfaz minima (get/set).

El servicio depende de esta clase inyectada, no de redis directamente: antes el
cliente redis se instanciaba dentro del propio servicio, lo que acoplaba la
logica de negocio al detalle de infraestructura e impedia sustituirlo en
pruebas (violacion de DIP).
"""
from typing import Optional

import redis

from app.config import Config


class RedisCache:
    def __init__(self, cfg: Config) -> None:
        self._client = redis.Redis(
            host=cfg.redis_host,
            port=cfg.redis_port,
            password=cfg.redis_password,
            decode_responses=True,
        )
        self._ttl = cfg.cache_ttl

    def get(self, key: str) -> Optional[str]:
        return self._client.get(key)

    def set(self, key: str, value: str) -> None:
        self._client.setex(key, self._ttl, value)
