#!/bin/bash
set -e

echo "=== SERVICES VM STARTUP SCRIPT ==="
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

# Install gcloud CLI for container registry auth
apt-get install -y google-cloud-sdk

# Create working directory
mkdir -p /home/ubuntu/quetxal
cd /home/ubuntu/quetxal

# Configure Docker to use gcloud credentials for GCR
# This will be configured by CI/CD via secret
# gcloud auth configure-docker

# Grant docker access to ubuntu user
usermod -aG docker ubuntu

# Create systemd service for docker-compose (Microservices)
cat > /etc/systemd/system/quetxal-services.service <<EOF
[Unit]
Description=Quetxal TV Microservices
Requires=docker.service
After=docker.service

[Service]
Type=simple
Restart=always
RestartSec=60
WorkingDirectory=/home/ubuntu/quetxal
EnvironmentFile=/home/ubuntu/quetxal/.env.cloud
ExecStart=/usr/bin/docker-compose -f docker-compose.services.yml up
ExecStop=/usr/bin/docker-compose -f docker-compose.services.yml down
User=ubuntu
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable quetxal-services.service

# Setup log rotation for Docker
cat > /etc/logrotate.d/docker-compose <<EOF
/var/lib/docker/containers/*/*.log {
  rotate 5
  daily
  compress
  delaycompress
  copytruncate
}
EOF

# Create placeholder .env.cloud (will be populated by CI/CD)
cat > /home/ubuntu/quetxal/.env.cloud <<EOF
# Database configuration (VM3 internal IP)
DB_HOST=10.128.0.4
DB_PORT=5432

# Redis configuration (VM3 internal IP)
REDIS_HOST=10.128.0.4
REDIS_PORT=6379

# Service ports
GRPC_PORT=3000
EOF

chown ubuntu:ubuntu /home/ubuntu/quetxal/.env.cloud

echo "=== Services VM setup completed ==="
echo "Next: Pull docker-compose.services.yml and run 'docker-compose up -d'"
