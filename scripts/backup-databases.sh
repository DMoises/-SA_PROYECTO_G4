#!/usr/bin/env bash
# ==============================================================================
# Script: backup-databases.sh
# Purpose: Performs a full backup of all operational PostgreSQL databases
#          running in Docker Compose (excluding Redis cache).
#          Applies a retention policy keeping only the last 7 backups.
# ==============================================================================

set -euo pipefail

# 1. Setup paths and directories
USER_HOME="/home/$(whoami)"
WORKDIR="${USER_HOME}/quetxal"          # el workflow sube el script y descarga los backups de aquí
BACKUP_DIR="${WORKDIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_BACKUP_DIR="${BACKUP_DIR}/temp_${TIMESTAMP}"

# Las BD (compose + .env con AUTH_DB_NAME=quetxal_auth, etc.) las gestiona Ansible en
# /opt/quetxal (Fase 3). El env legacy de Fase 2 era ~/quetxal/.env.cloud. Probamos
# ambos para no depender de la topología.
ENV_CANDIDATES=("/opt/quetxal/.env" "${WORKDIR}/.env.cloud" "${WORKDIR}/.env")

echo "=== Starting Database Backup Process [${TIMESTAMP}] ==="
echo "Working directory: ${WORKDIR}"
echo "Backup directory: ${BACKUP_DIR}"

# Ensure directories exist
mkdir -p "${BACKUP_DIR}"
mkdir -p "${TEMP_BACKUP_DIR}"

# 2. Load environment variables for DB credentials (nombres REALES de las BD)
ENV_FILE=""
for candidate in "${ENV_CANDIDATES[@]}"; do
  if [ -f "${candidate}" ]; then ENV_FILE="${candidate}"; break; fi
done

if [ -n "${ENV_FILE}" ]; then
  echo "Loading environment variables from ${ENV_FILE}..."
  # Source environment file (ignoring comments)
  set -a
  source "${ENV_FILE}"
  set +a
else
  # Sin el env, los nombres caerían a 'auth_db' (inexistente) en vez de 'quetxal_auth'.
  # Fallar es preferible a generar un backup vacío/incorrecto en silencio.
  echo "ERROR: no se encontró el archivo de entorno de las BD en: ${ENV_CANDIDATES[*]}"
  rm -rf "${TEMP_BACKUP_DIR}"
  exit 1
fi

# List of database suffixes/modules
DATABASES=("auth" "subscription" "catalog" "rating" "fx" "history" "notification")

# 3. Perform pg_dump for each database
for db in "${DATABASES[@]}"; do
  # Convert db name to uppercase for env var matching (e.g. auth -> AUTH)
  DB_UPPER=$(echo "${db}" | tr '[:lower:]' '[:upper:]')
  
  # Fetch DB variables dynamically with fallbacks
  eval DB_NAME=\${${DB_UPPER}_DB_NAME:-${db}_db}
  eval DB_USER=\${${DB_UPPER}_DB_USER:-${db}_user}
  eval DB_PASS=\${${DB_UPPER}_DB_PASSWORD:-""}
  
  CONTAINER="quetxal-${db}-db"
  BACKUP_FILE="${TEMP_BACKUP_DIR}/${db}_${TIMESTAMP}.sql"
  
  echo "--------------------------------------------------"
  echo "Backing up database: ${DB_NAME} (User: ${DB_USER})"
  echo "Target container: ${CONTAINER}"
  
  # Check if container is running
  if ! docker ps --format '{{.Names}}' | grep -Eq "^${CONTAINER}$"; then
    echo " Error: Container ${CONTAINER} is not running!"
    exit 1
  fi
  
  # Execute pg_dump inside container and redirect output to host
  # Using docker exec -i (no -t to avoid TTY output corruption)
  if [ -n "${DB_PASS}" ]; then
    if ! docker exec -i -e PGPASSWORD="${DB_PASS}" "${CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_FILE}"; then
      echo " Error dumping database ${DB_NAME}!"
      rm -rf "${TEMP_BACKUP_DIR}"
      exit 1
    fi
  else
    if ! docker exec -i "${CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_FILE}"; then
      echo " Error dumping database ${DB_NAME}!"
      rm -rf "${TEMP_BACKUP_DIR}"
      exit 1
    fi
  fi
  
  # Validate that the backup file is not empty
  if [ ! -s "${BACKUP_FILE}" ]; then
    echo " Error: Generated backup file ${BACKUP_FILE} is empty or missing!"
    rm -rf "${TEMP_BACKUP_DIR}"
    exit 1
  fi
  
  echo "✓ Backup for ${db} created successfully."
done

echo "--------------------------------------------------"
# 4. Compress the backups
BACKUP_TARBALL="${BACKUP_DIR}/quetxal_backup_${TIMESTAMP}.tar.gz"
echo "Compressing backups into ${BACKUP_TARBALL}..."

# Create tarball of the temp folder contents (moving in to avoid absolute path references in tar)
if ! tar -czf "${BACKUP_TARBALL}" -C "${BACKUP_DIR}" "temp_${TIMESTAMP}"; then
  echo " Error: Compression failed!"
  rm -rf "${TEMP_BACKUP_DIR}"
  exit 1
fi

# Clean up temp folder
rm -rf "${TEMP_BACKUP_DIR}"
echo "✓ Temporary SQL dumps removed."

# 5. Apply retention policy (keep last 7 backups)
echo "--------------------------------------------------"
echo "Applying backup retention policy (keeping last 7 backups)..."
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/quetxal_backup_*.tar.gz 2>/dev/null | wc -l)
echo "Current backup count: ${BACKUP_COUNT}"

if [ "${BACKUP_COUNT}" -gt 7 ]; then
  # List files sorted by creation time (newest first), skip first 7, and delete the rest
  ls -1t "${BACKUP_DIR}"/quetxal_backup_*.tar.gz 2>/dev/null | tail -n +8 | while read -r old_backup; do
    echo "Deleting old backup: ${old_backup}"
    rm -f "${old_backup}"
  done
  echo "✓ Old backups pruned successfully."
else
  echo "✓ No pruning needed (<= 7 backups)."
fi

echo "=================================================="
echo "✓ Backup Process Completed Successfully!"
echo "Backup File: ${BACKUP_TARBALL}"
echo "=================================================="
