#!/usr/bin/env bash
###############################################################################
# run-load-test.sh — Pruebas de carga ligera con Locust (Fase 3, Tarea 15)
#
# Lanza Locust en modo headless contra el entorno indicado y genera un reporte
# HTML + CSV en ./reports/.
#
# Uso:
#   ./run-load-test.sh [entorno] [usuarios] [spawn_rate] [run_time] [escenario]
#
#   entorno    develop (default) | release | http://host  (URL completa)
#   usuarios   máx. usuarios concurrentes (default 200)
#   spawn_rate usuarios nuevos por segundo (default 20)
#   run_time   duración (default 3m): 30s, 2m, 5m...
#   escenario  normal (default) | stress | auth
#
# Escenario "auth" requiere exportar credenciales reales:
#   export QUETXAL_USER="demo@quetxal.tv"; export QUETXAL_PASS="secreto"
#
# Ejemplos:
#   ./run-load-test.sh develop 200 20 3m
#   ./run-load-test.sh release "" "" "" stress
#   QUETXAL_USER=demo@quetxal.tv QUETXAL_PASS=secreto ./run-load-test.sh develop 150 15 3m auth
###############################################################################
set -euo pipefail
cd "$(dirname "$0")"

ENVIRONMENT="${1:-develop}"
USERS="${2:-200}"
SPAWN_RATE="${3:-20}"
RUN_TIME="${4:-3m}"
SCENARIO="${5:-normal}"

# --- Resolver host del entorno -----------------------------------------------
case "${ENVIRONMENT,,}" in
  develop) HOST="http://34.123.30.232" ;;
  release) HOST="http://35.254.220.20" ;;
  *)       HOST="$ENVIRONMENT" ;;  # se asume URL completa
esac

# --- Preparar salida ----------------------------------------------------------
mkdir -p reports
STAMP="$(date +%Y%m%d-%H%M%S)"
ENV_LABEL="$(echo "${ENVIRONMENT,,}" | tr -cs 'a-z0-9' '-' | sed 's/-$//')"
BASE="reports/quetxal-${ENV_LABEL}-${STAMP}"
HTML="${BASE}.html"

export QUETXAL_HOST="$HOST"
USER_CLASSES=(VisitanteAnonimo)

if [[ "$SCENARIO" == "stress" ]]; then
  export QUETXAL_SHAPE="stress"
  echo ">> Escenario STRESS: rampa escalonada (se ignoran usuarios/spawn_rate)."
else
  unset QUETXAL_SHAPE 2>/dev/null || true
fi

if [[ "$SCENARIO" == "auth" ]]; then
  if [[ -z "${QUETXAL_USER:-}" || -z "${QUETXAL_PASS:-}" ]]; then
    echo "ERROR: el escenario 'auth' requiere QUETXAL_USER y QUETXAL_PASS exportados." >&2
    exit 1
  fi
  USER_CLASSES+=(UsuarioAutenticado)
fi

# --- Construir argumentos -----------------------------------------------------
ARGS=(-f locustfile.py --host "$HOST" --headless --run-time "$RUN_TIME"
      --html "$HTML" --csv "$BASE")
if [[ "$SCENARIO" != "stress" ]]; then
  ARGS+=(--users "$USERS" --spawn-rate "$SPAWN_RATE")
fi
ARGS+=("${USER_CLASSES[@]}")

echo "==> Locust contra $HOST  (escenario: $SCENARIO)"
echo "    Reporte HTML: $HTML"
echo ""

locust "${ARGS[@]}"

if [[ -f "$HTML" ]]; then
  echo ""
  echo "OK. Reporte generado: $HTML"
else
  echo "AVISO: Locust terminó pero no se encontró el reporte HTML esperado." >&2
fi
