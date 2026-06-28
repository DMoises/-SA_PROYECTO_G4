# Pruebas de Carga Ligera con Locust — Quetxal TV

> **Fase 3 · Tarea 15 — Testing, Calidad y CI/CD**
> Scripts de simulación de usuarios concurrentes que inyectan tráfico masivo
> sobre las rutas críticas de la plataforma y generan un **reporte HTML** con los
> resultados.

---

## 1. ¿Qué es y cómo funciona Locust?

[Locust](https://locust.io) es una herramienta de pruebas de carga distribuida
escrita en Python. En lugar de configurar escenarios con interfaces gráficas, el
comportamiento de cada usuario virtual se describe **como código** (clases que
heredan de `HttpUser` con métodos decorados con `@task`). Locust levanta miles de
usuarios concurrentes usando *greenlets* (corutinas livianas de `gevent`), por lo
que un solo proceso puede simular mucha concurrencia.

Cada usuario virtual:

1. Ejecuta `on_start` al nacer (aquí simulamos la carga inicial del sitio).
2. Elige tareas al azar según su **peso** (`@task(n)`), esperando un *think time*
   (`wait_time`) entre cada una, imitando a una persona real.
3. Reporta tiempos de respuesta, RPS y fallas, que Locust agrega en estadísticas
   y vuelca en un **reporte HTML** autocontenido al finalizar.

---

## 2. Arquitectura de la prueba (¿por qué estas rutas?)

En Quetxal TV el **único componente público** es el frontend Next.js. Este sigue
el patrón **BFF**: el navegador habla con el frontend y el frontend reenvía
internamente al **API Gateway** (`ClusterIP`, no expuesto a internet). Por eso las
pruebas se ejecutan contra la **IP pública del frontend** y golpean exactamente
las rutas que consume un navegador real:

| Ruta pública (frontend)      | Reenvía a (gateway)            | Criticidad |
| ---------------------------- | ----------------------------- | ---------- |
| `GET /`                      | — (SSR landing)               | Alta       |
| `GET /api/catalog`           | `/catalog/cartelera`          | **Crítica** |
| `GET /api/catalog?q=`        | `/catalog/buscar`             | **Crítica** |
| `GET /api/catalog/{id}`      | `/catalog/contenido/{id}`     | **Crítica** |
| `GET /api/ratings/{id}`      | `/ratings/{id}`               | Alta       |
| `GET /login`                 | — (SSR)                       | Media      |
| `GET /health`                | `/health`                     | Baja       |
| `POST /api/auth/login` *(opc.)* | `/auth/login`              | **Crítica** |
| `GET /api/auth/me` *(opc.)*  | `/auth/me`                    | Media      |
| `GET /api/profiles` *(opc.)* | `/auth/profiles`              | Media      |
| `GET /api/billing/plans` *(opc.)* | `/billing/plans`         | Media      |

> El golpe a estas rutas recorre **todo el stack**: frontend → gateway → microservicio
> gRPC → base de datos, por lo que la prueba mide la capacidad real de la plataforma.

### Usuarios simulados

- **`VisitanteAnonimo`** (peso 4): navega catálogo, busca, abre fichas y consulta
  el % de recomendación. Es el grueso del tráfico (lectura pública).
- **`UsuarioAutenticado`** (peso 1, **opcional**): inicia sesión y consume rutas
  protegidas. Solo se activa si se proveen credenciales reales (ver §6).

### Auto-sembrado de IDs

Antes de arrancar, la prueba descarga la cartelera real (`/api/catalog`) y extrae
los IDs de contenido vigentes. Así las consultas de ficha y calificación usan
**IDs reales** sin hardcodear nada.

---

## 3. Entornos desplegados

| Entorno   | URL                       |
| --------- | ------------------------- |
| `develop` | http://34.123.30.232/     |
| `release` | http://35.254.220.20/     |

---

## 4. Instalación

Requiere **Python 3.10+** (probado con 3.11–3.14). Se recomienda un entorno
virtual para no contaminar el Python del sistema.

### Windows (PowerShell)

```powershell
cd load-testing
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Linux / macOS

```bash
cd load-testing
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Verifica la instalación:

```bash
locust --version
```

---

## 5. Ejecución rápida (genera el reporte HTML)

La forma más sencilla es usar los scripts incluidos, que resuelven el host del
entorno, crean `reports/` y dejan el HTML con marca de tiempo.

### Windows (PowerShell)

```powershell
# develop, 200 usuarios, 20/seg de rampa, durante 3 minutos
./run-load-test.ps1 -Environment develop -Users 200 -SpawnRate 20 -RunTime 3m

# release
./run-load-test.ps1 -Environment release -Users 200 -SpawnRate 20 -RunTime 3m
```

### Linux / macOS

```bash
chmod +x run-load-test.sh        # solo la primera vez
./run-load-test.sh develop 200 20 3m
./run-load-test.sh release 200 20 3m
```

Al terminar verás algo como:

```
reports/quetxal-develop-20260627-184500.html   <- ábrelo en el navegador
reports/quetxal-develop-20260627-184500_stats.csv
```

### Comando Locust directo (sin script)

Si prefieres invocar Locust a mano (equivalente a lo que hacen los scripts):

```bash
locust -f locustfile.py --host http://34.123.30.232 \
       --users 200 --spawn-rate 20 --run-time 3m --headless \
       --html reports/quetxal-develop.html \
       --csv reports/quetxal-develop \
       VisitanteAnonimo
```

### Modo interactivo (interfaz web)

Para explorar en vivo con gráficas en el navegador:

```bash
locust -f locustfile.py --host http://34.123.30.232
# abre http://localhost:8089 , define usuarios/rampa y presiona "Start"
# al detener, usa "Download Data > Download Report" para el HTML
```

---

## 6. Escenarios

### a) Normal (default) — solo visitantes anónimos

```powershell
./run-load-test.ps1 -Environment develop
```

### b) Estrés — rampa escalonada de "tráfico masivo"

Activa `StressShape`: ignora `-Users/-SpawnRate` y sube la carga por escalones
(50 → 100 → 200 → 350 → 500 usuarios, ~5 min). Ideal para evidenciar el
comportamiento bajo estrés creciente en la gráfica del reporte.

```powershell
./run-load-test.ps1 -Environment develop -Scenario stress
```
```bash
./run-load-test.sh develop "" "" "" stress
```

### c) Autenticado — incluye rutas protegidas (requiere credenciales reales)

```powershell
./run-load-test.ps1 -Environment develop -Scenario auth -User "demo@quetxal.tv" -Pass "TU_PASSWORD"
```
```bash
QUETXAL_USER="demo@quetxal.tv" QUETXAL_PASS="TU_PASSWORD" \
  ./run-load-test.sh develop 150 15 3m auth
```

> Sin credenciales, el usuario autenticado se retira en silencio y **no** ensucia
> el reporte con respuestas 401.

---

## 7. Cómo leer el reporte HTML

El archivo `reports/*.html` es autocontenido (ábrelo con doble clic). Contiene:

- **Request Statistics**: por ruta — nº de peticiones, fallas, percentiles de
  latencia (p50/p95/p99), tamaño medio y **RPS**.
- **Charts**: RPS total, tiempos de respuesta y nº de usuarios a lo largo del tiempo.
- **Failures**: detalle de errores (si los hubo).

Métricas clave a reportar:

| Métrica            | Qué indica                                        |
| ------------------ | ------------------------------------------------- |
| **RPS**            | Peticiones por segundo que soportó la plataforma. |
| **p95 / p99 (ms)** | Latencia del 95 %/99 % de las peticiones.         |
| **Failures %**     | Porcentaje de fallas (idealmente 0 %).            |

> **Nota sobre la ficha técnica:** `GET /api/catalog/{id}` puede responder `404`
> si el contenido no está completamente sembrado en el entorno. La prueba trata
> `404` como respuesta válida (la ruta funcionó de extremo a extremo) y solo
> contabiliza como **falla** los `5xx` y *timeouts*, que son los que reflejan una
> degradación real bajo carga.

---

## 8. Consideraciones de seguridad / producción

- La suite por defecto ejecuta **solo lecturas** sobre rutas públicas: no crea
  usuarios, no escribe datos ni dispara CI/CD. Es segura para los entornos
  desplegados.
- El escenario `auth` solo lee rutas protegidas (no muta datos) y requiere
  credenciales existentes; **no** registra usuarios nuevos.
- Ajusta `--users` / `--run-time` con criterio: el objetivo es una prueba de carga
  **ligera**, no tumbar el servicio.

---

## 9. Estructura de archivos

```
load-testing/
├── locustfile.py        # Definición de usuarios y tareas (rutas críticas)
├── requirements.txt     # Dependencias (locust)
├── run-load-test.ps1    # Runner para Windows (PowerShell)
├── run-load-test.sh     # Runner para Linux/macOS
├── README.md            # Esta guía
└── reports/             # Reportes HTML/CSV generados (evidencia)
```
