#!/usr/bin/env bash
# =====================================================================
# Script para aplicar los esquemas de auditoría en contenedores de base
# de datos existentes cuyos volúmenes ya han sido creados/inicializados.
# =====================================================================

set -eo pipefail

echo "===  Aplicando tablas de auditoría en las bases de datos ==="

databases=(
    "quetxal-auth-db:/docker-entrypoint-initdb.d/05_audit.sql"
    "quetxal-subscription-db:/docker-entrypoint-initdb.d/03_audit.sql"
    "quetxal-catalog-db:/docker-entrypoint-initdb.d/06_audit.sql"
    "quetxal-rating-db:/docker-entrypoint-initdb.d/05_audit.sql"
    "quetxal-fx-db:/docker-entrypoint-initdb.d/05_audit.sql"
    "quetxal-history-db:/docker-entrypoint-initdb.d/06_audit.sql"
    "quetxal-notification-db:/docker-entrypoint-initdb.d/05_audit.sql"
)

for item in "${databases[@]}"; do
    IFS=":" read -r container script_path <<< "$item"
    
    echo "Processing container: $container with script: $script_path..."
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        docker exec -i "$container" bash -c "psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -f \"$script_path\""
        echo " Auditoría aplicada exitosamente en $container."
    else
        echo " Advertencia: El contenedor $container no se encuentra en ejecución."
    fi
done

echo "===  Proceso de aplicación de auditoría finalizado ==="
