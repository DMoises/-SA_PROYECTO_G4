"""
locustfile.py — Pruebas de carga ligera (Locust) · Quetxal TV · Fase 3, Tarea 15.

Simula usuarios concurrentes inyectando tráfico masivo sobre las RUTAS CRÍTICAS
de la plataforma. El tráfico entra por el frontend público (Next.js), que sigue el
patrón BFF y enruta internamente al API Gateway (ClusterIP). Por eso las pruebas
golpean las rutas que un navegador real consume:

    Rutas críticas (anónimas / lectura — el grueso del tráfico):
      GET  /                       Landing (SSR)
      GET  /api/catalog            Cartelera completa   -> gateway /catalog/cartelera
      GET  /api/catalog?q=...      Búsqueda             -> gateway /catalog/buscar
      GET  /api/catalog/{id}       Ficha técnica        -> gateway /catalog/contenido/{id}
      GET  /api/ratings/{id}       % de recomendación   -> gateway /ratings/{id}
      GET  /login                  Página de inicio de sesión (SSR)
      GET  /health                 Healthcheck          -> gateway /health

    Rutas críticas (autenticadas — opcionales, requieren credenciales):
      POST /api/auth/login         Inicio de sesión     -> gateway /auth/login
      GET  /api/auth/me            Sesión actual        -> gateway /auth/me
      GET  /api/profiles           Perfiles del usuario -> gateway /auth/profiles
      GET  /api/billing/plans      Planes de suscripción-> gateway /billing/plans

USO RÁPIDO (modo headless, genera reporte HTML):

    locust -f locustfile.py --host http://34.123.30.232 \
           --users 200 --spawn-rate 20 --run-time 3m --headless \
           --html reports/quetxal-develop.html --csv reports/quetxal-develop

Variables de entorno reconocidas:
    QUETXAL_HOST   Host por defecto si no se pasa --host (default: develop).
    QUETXAL_USER   Email de un usuario real -> habilita la clase UsuarioAutenticado.
    QUETXAL_PASS   Contraseña de ese usuario.
    QUETXAL_SHAPE  Si vale "stress", activa la rampa escalonada de carga (StressShape),
                   que ignora --users/--spawn-rate y aplica los escalones definidos abajo.

Consulte README.md para los escenarios predefinidos y los scripts de ejecución.
"""

from __future__ import annotations

import os
import random

import requests
from locust import HttpUser, LoadTestShape, between, events, task
from locust.exception import StopUser

# ---------------------------------------------------------------------------
# Configuración
# ---------------------------------------------------------------------------
DEFAULT_HOST = os.getenv("QUETXAL_HOST", "http://34.123.30.232")

# Términos usados para estresar la búsqueda. Mezclamos términos específicos del
# catálogo guatemalteco con letras sueltas para forzar resultados amplios.
TERMINOS_BUSQUEDA = [
    "quetzal", "tikal", "codigo", "maya", "noche", "accion",
    "a", "e", "el", "la", "o", "i",
]

# IDs de contenido reales descubiertos en tiempo de ejecución (auto-sembrado).
# Evita hardcodear: se descargan de la cartelera en vivo al iniciar la prueba.
CONTENIDO_IDS: list[str] = []

# Fallback por si la cartelera no está disponible al sembrar (la prueba no debe
# quedarse sin IDs que consultar).
FALLBACK_IDS = [
    "5fad0f00-4db0-451f-aa97-0962a4409a52",
    "b2d18e1b-d69c-41f0-af11-8e2a21f1b122",
]


# ---------------------------------------------------------------------------
# Auto-sembrado de IDs de contenido antes de arrancar la prueba
# ---------------------------------------------------------------------------
@events.test_start.add_listener
def sembrar_ids_de_contenido(environment, **_kwargs):
    """Descarga la cartelera real una sola vez para alimentar las tareas que
    consultan contenido por ID (ficha técnica y calificaciones)."""
    host = (environment.host or DEFAULT_HOST).rstrip("/")
    try:
        resp = requests.get(f"{host}/api/catalog", timeout=15)
        if resp.ok:
            data = resp.json()
            ids = [
                item["id"]
                for item in data
                if isinstance(item, dict) and item.get("id")
            ]
            CONTENIDO_IDS.extend(ids)
            print(f"[seed] {len(ids)} IDs de contenido cargados desde {host}/api/catalog")
    except Exception as exc:  # noqa: BLE001 - la prueba debe seguir aunque falle el seed
        print(f"[seed] no se pudo sembrar desde la cartelera ({exc}); se usan fallbacks")

    if not CONTENIDO_IDS:
        CONTENIDO_IDS.extend(FALLBACK_IDS)
        print(f"[seed] usando {len(FALLBACK_IDS)} IDs de respaldo")


def _id_aleatorio() -> str:
    """Devuelve un ID de contenido aleatorio del conjunto sembrado."""
    if CONTENIDO_IDS:
        return random.choice(CONTENIDO_IDS)
    return "00000000-0000-0000-0000-000000000000"


# ---------------------------------------------------------------------------
# Usuario anónimo — la mayor parte del tráfico público (navegación de catálogo)
# ---------------------------------------------------------------------------
class VisitanteAnonimo(HttpUser):
    """Visitante sin sesión que navega el catálogo, busca, abre fichas y consulta
    el % de recomendación. Representa el grueso del tráfico de un servicio de
    streaming, por eso tiene el mayor peso."""

    weight = 4
    # Pausa realista entre acciones de un mismo usuario (think time).
    wait_time = between(1, 3)

    def on_start(self):
        # Carga inicial del sitio, como cuando un usuario abre la página.
        self.client.get("/", name="GET / (landing)")

    @task(10)
    def explorar_cartelera(self):
        """Ruta crítica #1: la cartelera principal (lo primero que se carga)."""
        self.client.get("/api/catalog", name="GET /api/catalog (cartelera)")

    @task(6)
    def buscar_contenido(self):
        """Ruta crítica #2: búsqueda con filtros de título."""
        termino = random.choice(TERMINOS_BUSQUEDA)
        self.client.get(
            "/api/catalog",
            params={"q": termino},
            name="GET /api/catalog?q= (búsqueda)",
        )

    @task(5)
    def ver_ficha_tecnica(self):
        """Ruta crítica #3: ficha técnica de un contenido por ID.

        200 = encontrado y 404 = no sembrado en el entorno significan ambos que la
        ruta respondió correctamente recorriendo todo el stack (BFF -> gateway ->
        catalog-service -> BD). Solo marcamos como FALLA los 5xx y los timeouts,
        que son los que reflejan una verdadera degradación bajo carga.
        """
        cid = _id_aleatorio()
        with self.client.get(
            f"/api/catalog/{cid}",
            name="GET /api/catalog/[id] (ficha)",
            catch_response=True,
        ) as resp:
            if resp.status_code < 500:
                resp.success()
            else:
                resp.failure(f"status {resp.status_code}")

    @task(4)
    def ver_recomendacion(self):
        """Ruta crítica #4: % de recomendación público de un contenido."""
        cid = _id_aleatorio()
        self.client.get(
            f"/api/ratings/{cid}",
            name="GET /api/ratings/[id] (recomendación)",
        )

    @task(2)
    def cargar_pagina_login(self):
        """Página de login (SSR pública)."""
        self.client.get("/login", name="GET /login (página)")

    @task(1)
    def healthcheck(self):
        """Healthcheck del gateway, expuesto a través del frontend."""
        self.client.get("/health", name="GET /health")


# ---------------------------------------------------------------------------
# Usuario autenticado — OPCIONAL (solo si hay credenciales reales)
# ---------------------------------------------------------------------------
class UsuarioAutenticado(HttpUser):
    """Usuario con sesión iniciada que consume rutas protegidas.

    Solo aporta carga si se definen QUETXAL_USER y QUETXAL_PASS con credenciales
    reales. Sin ellas, cada instancia se detiene de inmediato en on_start (sin
    emitir peticiones), de modo que NO contamina el reporte con 401. Para incluir
    este escenario, ejecute la prueba con las variables de entorno y agregue la
    clase en la línea de comandos (ver README)."""

    weight = 1
    wait_time = between(2, 5)

    def on_start(self):
        email = os.getenv("QUETXAL_USER", "").strip()
        password = os.getenv("QUETXAL_PASS", "").strip()
        if not email or not password:
            # Sin credenciales no tiene sentido este usuario: se retira en silencio.
            raise StopUser()

        # El login deja la cookie de sesión (HttpOnly) en el cliente; las tareas
        # siguientes la reutilizan automáticamente (la sesión de Locust persiste
        # las cookies entre peticiones).
        with self.client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
            name="POST /api/auth/login",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                resp.success()
            else:
                resp.failure(f"login falló: HTTP {resp.status_code}")
                raise StopUser()

    @task(5)
    def explorar_cartelera(self):
        self.client.get("/api/catalog", name="GET /api/catalog (cartelera)")

    @task(3)
    def perfil_actual(self):
        self.client.get("/api/auth/me", name="GET /api/auth/me")

    @task(2)
    def listar_perfiles(self):
        self.client.get("/api/profiles", name="GET /api/profiles")

    @task(2)
    def consultar_planes(self):
        self.client.get("/api/billing/plans", name="GET /api/billing/plans")


# ---------------------------------------------------------------------------
# Forma de carga de estrés (rampa escalonada) — OPCIONAL
# Se activa solo con QUETXAL_SHAPE=stress. Ignora --users/--spawn-rate y aplica
# escalones crecientes para inyectar "tráfico masivo" de forma progresiva, lo que
# produce una curva clara en el reporte HTML.
# ---------------------------------------------------------------------------
if os.getenv("QUETXAL_SHAPE", "").lower() == "stress":

    class StressShape(LoadTestShape):
        """Rampa de estrés por escalones (duración total ~5 min).

        (segundo límite, usuarios objetivo, tasa de aparición)
        """

        stages = [
            {"duration": 60, "users": 50, "spawn_rate": 10},
            {"duration": 120, "users": 100, "spawn_rate": 15},
            {"duration": 180, "users": 200, "spawn_rate": 25},
            {"duration": 240, "users": 350, "spawn_rate": 35},
            {"duration": 300, "users": 500, "spawn_rate": 50},
        ]

        def tick(self):
            run_time = self.get_run_time()
            for stage in self.stages:
                if run_time < stage["duration"]:
                    return (stage["users"], stage["spawn_rate"])
            return None  # finaliza la prueba al superar el último escalón
