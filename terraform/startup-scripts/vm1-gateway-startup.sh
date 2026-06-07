#!/bin/bash
set -e

echo "=== GATEWAY VM STARTUP SCRIPT ==="
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

# Install Docker Compose v2
apt-get install -y docker-compose

# Start Docker daemon
systemctl start docker
systemctl enable docker

# Install gcloud CLI for image pulling
apt-get install -y google-cloud-sdk

# Create working directory
mkdir -p /home/ubuntu/quetxal
cd /home/ubuntu/quetxal

# Clone or pull repository (adjust URL for your repo)
# For CI/CD, this will be done by GitHub Actions
# git clone https://github.com/YOUR-ORG/SA_PROYECTO_G4.git /home/ubuntu/quetxal

# Grant docker access to ubuntu user
usermod -aG docker ubuntu

# Create systemd service for docker-compose (Gateway)
cat > /etc/systemd/system/quetxal-gateway.service <<EOF
[Unit]
Description=Quetxal TV API Gateway
Requires=docker.service
After=docker.service

[Service]
Type=simple
Restart=always
RestartSec=60
WorkingDirectory=/home/ubuntu/quetxal
ExecStart=/usr/bin/docker-compose -f docker-compose.gateway.yml up
ExecStop=/usr/bin/docker-compose -f docker-compose.gateway.yml down
User=ubuntu
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable quetxal-gateway.service

# Setup log rotation
cat > /etc/logrotate.d/docker-compose <<EOF
/var/lib/docker/containers/*/*.log {
  rotate 5
  daily
  compress
  delaycompress
  copytruncate
}
EOF

echo "=== Gateway VM setup completed ==="
echo "Next: Pull docker-compose.gateway.yml and run 'docker-compose up -d'"
