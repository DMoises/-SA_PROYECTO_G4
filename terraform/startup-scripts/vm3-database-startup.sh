#!/bin/bash
set -e

echo "=== DATABASE VM STARTUP SCRIPT ==="
echo "Timestamp: $(date)"

# Update system
apt-get update
apt-get upgrade -y

# Install Docker
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
apt-get install -y docker-compose

# Start Docker daemon
systemctl start docker
systemctl enable docker

# Create persistent storage directories for databases
mkdir -p /var/lib/docker/volumes/quetxal
chmod 755 /var/lib/docker/volumes/quetxal

# Create working directory
mkdir -p /home/ubuntu/quetxal
cd /home/ubuntu/quetxal

git clone -b feature/despliegue https://github.com/DMoises/-SA_PROYECTO_G4.git .

# Grant docker access to ubuntu user
usermod -aG docker ubuntu

# Create systemd service for docker-compose (Databases)
cat > /etc/systemd/system/quetxal-database.service <<EOF
[Unit]
Description=Quetxal TV Databases and Cache
Requires=docker.service
After=docker.service

[Service]
Type=simple
Restart=always
RestartSec=60
WorkingDirectory=/home/ubuntu/quetxal
EnvironmentFile=/home/ubuntu/quetxal/.env.cloud
ExecStart=/usr/bin/docker-compose -f docker-compose.database.yml up
ExecStop=/usr/bin/docker-compose -f docker-compose.database.yml down
User=ubuntu
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable quetxal-database.service

# Setup log rotation for Docker
cat > /etc/logrotate.d/docker-compose <<EOF
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  delaycompress
  copytruncate
}
EOF

# Create monitoring scripts directory
mkdir -p /home/ubuntu/quetxal/scripts

# Create database health check script
cat > /home/ubuntu/quetxal/scripts/health-check.sh <<'SCRIPT'
#!/bin/bash
# Simple health check for databases

echo "Checking PostgreSQL databases..."
for port in 5432; do
  if docker exec quetxal-auth-db pg_isready -d quetxal_auth -U auth_user > /dev/null 2>&1; then
    echo "✓ PostgreSQL ready"
  else
    echo "✗ PostgreSQL NOT ready"
    exit 1
  fi
done

echo "Checking Redis..."
if docker exec quetxal-redis redis-cli -a "${REDIS_PASSWORD}" ping > /dev/null 2>&1; then
  echo "✓ Redis ready"
else
  echo "✗ Redis NOT ready"
  exit 1
fi

echo "All checks passed!"
SCRIPT

chmod +x /home/ubuntu/quetxal/scripts/health-check.sh

# Create backup script
cat > /home/ubuntu/quetxal/scripts/backup-databases.sh <<'SCRIPT'
#!/bin/bash
# Backup all PostgreSQL databases

BACKUP_DIR="/home/ubuntu/backups/databases"
mkdir -p ${BACKUP_DIR}

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "Backing up databases at ${TIMESTAMP}..."

for db_name in quetxal_auth quetxal_subscription quetxal_catalog quetxal_rating quetxal_fx quetxal_history quetxal_notification; do
  echo "Backing up ${db_name}..."
  docker exec quetxal-auth-db pg_dump -U auth_user ${db_name} | gzip > ${BACKUP_DIR}/${db_name}_${TIMESTAMP}.sql.gz
done

echo "Backup completed at ${BACKUP_DIR}"
SCRIPT

chmod +x /home/ubuntu/quetxal/scripts/backup-databases.sh

# Create placeholder .env.cloud (will be populated by CI/CD)
cat > /home/ubuntu/quetxal/.env.cloud <<EOF
# Database credentials
AUTH_DB_NAME=quetxal_auth
AUTH_DB_USER=auth_user
AUTH_DB_PASSWORD=CHANGE_ME_IN_SECRETS

SUBSCRIPTION_DB_NAME=quetxal_subscription
SUBSCRIPTION_DB_USER=subscription_user
SUBSCRIPTION_DB_PASSWORD=CHANGE_ME_IN_SECRETS

CATALOG_DB_NAME=quetxal_catalog
CATALOG_DB_USER=catalog_user
CATALOG_DB_PASSWORD=CHANGE_ME_IN_SECRETS

RATING_DB_NAME=quetxal_rating
RATING_DB_USER=rating_user
RATING_DB_PASSWORD=CHANGE_ME_IN_SECRETS

FX_DB_NAME=quetxal_fx
FX_DB_USER=fx_user
FX_DB_PASSWORD=CHANGE_ME_IN_SECRETS

HISTORY_DB_NAME=quetxal_history
HISTORY_DB_USER=history_user
HISTORY_DB_PASSWORD=CHANGE_ME_IN_SECRETS

NOTIFICATION_DB_NAME=quetxal_notification
NOTIFICATION_DB_USER=notification_user
NOTIFICATION_DB_PASSWORD=CHANGE_ME_IN_SECRETS

# Redis
REDIS_PASSWORD=CHANGE_ME_IN_SECRETS
EOF

chown ubuntu:ubuntu /home/ubuntu/quetxal/.env.cloud
chmod 600 /home/ubuntu/quetxal/.env.cloud

echo "=== Database VM setup completed ==="
echo "Next: Pull docker-compose.database.yml and run 'docker-compose up -d'"
echo "Available scripts in /home/ubuntu/quetxal/scripts/"
