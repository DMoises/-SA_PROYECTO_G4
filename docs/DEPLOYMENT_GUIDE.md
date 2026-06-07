# Guía de Despliegue GCP - Quetxal TV

Documento completo sobre cómo desplegar Quetxal TV en Google Cloud Platform con CI/CD automático.

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Prerequisitos](#prerequisitos)
3. [Configuración Inicial](#configuración-inicial)
4. [Despliegue Manual (Dev)](#despliegue-manual-dev)
5. [Despliegue Automático (CI/CD)](#despliegue-automático-cicd)
6. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│    Internet / Clientes              │
└──────────────────┬──────────────────┘
                   │ HTTP/HTTPS :80/443
           ┌───────▼─────────┐
           │   VM1: Gateway  │◄─── Public IP
           │   (DMZ)         │
           │ quetxal-gateway │
           └─────────┬───────┘
                     │ gRPC Internal
        ┌────────────▼────────────┐
        │                         │
 ┌──────▼──────┐         ┌───────▼──────┐
 │ VM2:Services│         │ VM3: Database│
 │ 7 µServices │         │ 6 DBs + Redis│
 │(Privada)    │         │ (Privada)    │
 └─────────────┘         └──────────────┘
        All connected via VPC (10.128.0.0/28)
```

### Componentes

| VM | Rol | IP Interna | IP Pública | Servicios |
|----|-----|-----------|-----------|-----------|
| VM1 | API Gateway | 10.128.0.2 | Sí | API Gateway (TypeScript) |
| VM2 | Microservicios | 10.128.0.3 | No | 7 µServices (Go, Python, TS) |
| VM3 | Data Layer | 10.128.0.4 | No | 6 PostgreSQL + 1 Redis |

---

## ✅ Prerequisitos

### Local (Laptop/Workstation)

- **gcloud CLI**: https://cloud.google.com/sdk/docs/install
- **Terraform**: https://www.terraform.io/downloads
- **Docker**: (opcional, solo para testing local)
- **Git**: Para clonar y push al repositorio

### GCP

- Cuenta de Google Cloud Platform
- Proyecto GCP creado
- Billing habilitado (para VMs e2-small, ~$30-50/mes)
- Service Account creado con permisos necesarios

### GitHub

- Repositorio privado en GitHub
- Acceso a Settings para configurar Secrets
- Permisos para crear Workflows

---

## 🚀 Configuración Inicial

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/YOUR-ORG/SA_PROYECTO_G4.git
cd SA_PROYECTO_G4
```

### Paso 2: Configurar GCP

#### 2.1 Crear Proyecto GCP

```bash
gcloud projects create quetxal-tv --name="Quetxal TV"
gcloud config set project quetxal-tv
```

#### 2.2 Habilitar APIs

```bash
gcloud services enable compute.googleapis.com
gcloud services enable storage-api.googleapis.com
gcloud services enable container.googleapis.com
```

#### 2.3 Crear Service Account

```bash
# Crear service account
gcloud iam service-accounts create quetxal-ci-cd \
  --display-name "Quetxal TV CI/CD"

# Asignar roles
gcloud projects add-iam-policy-binding quetxal-tv \
  --member serviceAccount:quetxal-ci-cd@quetxal-tv.iam.gserviceaccount.com \
  --role roles/compute.admin

gcloud projects add-iam-policy-binding quetxal-tv \
  --member serviceAccount:quetxal-ci-cd@quetxal-tv.iam.gserviceaccount.com \
  --role roles/storage.admin

# Crear key JSON
gcloud iam service-accounts keys create ~/quetxal-key.json \
  --iam-account quetxal-ci-cd@quetxal-tv.iam.gserviceaccount.com
```

#### 2.4 Generar SSH Keys

```bash
# Generar SSH key para VMs
ssh-keygen -t rsa -b 4096 -f ~/.ssh/quetxal-gcp -N ""

# Agregar a ssh-agent
ssh-add ~/.ssh/quetxal-gcp
```

### Paso 3: Configurar Terraform

```bash
cd terraform

# Copiar template
cp terraform.tfvars.example terraform.tfvars

# Editar con tus valores
nano terraform.tfvars

# Ejemplo terraform.tfvars:
"""
gcp_project_id   = "quetxal-tv"
gcp_region       = "us-central1"
gcp_zone         = "us-central1-a"
credentials_path = "/home/user/quetxal-key.json"
vm_machine_type  = "e2-small"
enable_nat       = true
"""
```

### Paso 4: Configurar GitHub Secrets

1. Ve a: GitHub Repo → Settings → Secrets and variables → Actions
2. Agrega los siguientes secrets:

```bash
# GCP
GCP_PROJECT_ID=quetxal-tv
GCP_SERVICE_ACCOUNT_KEY=$(cat ~/quetxal-key.json | jq -c .)

# SSH
SSH_KEY=$(cat ~/.ssh/quetxal-gcp)
SSH_USER=ubuntu

# Database Passwords (generar con: openssl rand -base64 32)
AUTH_DB_PASSWORD=<generated>
SUBSCRIPTION_DB_PASSWORD=<generated>
CATALOG_DB_PASSWORD=<generated>
RATING_DB_PASSWORD=<generated>
FX_DB_PASSWORD=<generated>
HISTORY_DB_PASSWORD=<generated>
NOTIFICATION_DB_PASSWORD=<generated>
REDIS_PASSWORD=<generated>
```

Ver `.github/SECRETS.md` para más detalles.

---

## 🌩️ Despliegue Manual (Dev)

Para desarrolladores que quieren testear localmente antes de hacer push.

### Script de Despliegue

```bash
# Hacer el script ejecutable
chmod +x scripts/deploy.sh

# Ejecutar
./scripts/deploy.sh
```

El script hace lo siguiente:

1. ✓ Valida que tengas gcloud y Terraform instalados
2. ✓ Inicializa Terraform
3. ✓ Muestra el plan (terraform plan)
4. ✓ Pide confirmación del usuario
5. ✓ Aplica la infraestructura (terraform apply)
6. ✓ Extrae las IPs de salida
7. ✓ Configura SSH known_hosts

### Ejemplo de Ejecución

```bash
$ ./scripts/deploy.sh

[INFO] Starting Quetxal TV GCP Deployment
[INFO] Checking prerequisites...
[SUCCESS] All prerequisites met
[INFO] Setting up Terraform variables...
[SUCCESS] terraform.tfvars configured
[INFO] Initializing Terraform...
[SUCCESS] Terraform initialized
[INFO] Planning Terraform deployment...
[SUCCESS] Plan saved to tfplan

terraform plan output...

Do you want to continue with the deployment? (yes/no): yes

[INFO] Applying Terraform deployment...
[SUCCESS] Infrastructure deployed to GCP
[INFO] Retrieving infrastructure information...
[SUCCESS] Infrastructure outputs:
  Gateway Public IP:     34.123.45.67
  Gateway Internal IP:   10.128.0.2
  Services Internal IP:  10.128.0.3
  Database Internal IP:  10.128.0.4

[SUCCESS] Next steps:
1. SSH to Database VM and initialize containers...
```

### Configuración Manual Inicial (Prima Vez)

Después de que Terraform cree las VMs, debes inicializar los contenedores:

#### 1. Database VM

```bash
# SSH a la VM de base de datos
gcloud compute ssh quetxal-database-vm --zone=us-central1-a

# En la VM:
cd /home/ubuntu/quetxal
export $(cat .env.cloud | xargs)
docker-compose -f docker-compose.database.yml up -d

# Verificar
docker-compose -f docker-compose.database.yml ps
docker-compose -f docker-compose.database.yml logs
```

#### 2. Services VM

```bash
gcloud compute ssh quetxal-services-vm --zone=us-central1-a

# En la VM:
cd /home/ubuntu/quetxal
export $(cat .env.cloud | xargs)
docker-compose -f docker-compose.services.yml up -d

# Verificar
docker-compose -f docker-compose.services.yml ps
```

#### 3. Gateway VM

```bash
gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a

# En la VM:
cd /home/ubuntu/quetxal
export $(cat .env.cloud | xargs)
docker-compose -f docker-compose.gateway.yml up -d

# Verificar
docker-compose -f docker-compose.gateway.yml ps
curl http://localhost
```

---

## 🤖 Despliegue Automático (CI/CD)

Una vez configurado el setup inicial, los cambios se despliegan automáticamente via GitHub Actions.

### Workflows Automáticos

#### Build and Push (`build-and-push.yml`)

**Trigger**: Push a `develop` o `main` con cambios en `/backend/` o docker-compose files

Acciones:
1. Build todas las imágenes Docker
2. Push a Google Container Registry (GCR)
3. Tag con `latest` y commit SHA

#### Deploy Gateway (`deploy-gateway.yml`)

**Trigger**: Después de que `build-and-push` se completa

Acciones:
1. SSH a VM1 (Gateway)
2. Pull docker-compose.gateway.yml del repo
3. Pull la imagen más reciente de GCR
4. `docker-compose down && docker-compose up -d`
5. Health check

#### Deploy Services (`deploy-services.yml`)

**Trigger**: Después de que `build-and-push` se completa

Acciones:
1. SSH a VM2 (Services)
2. Generar `.env.cloud` con IPs internas
3. Pull imágenes de microservicios de GCR
4. `docker-compose down && docker-compose up -d`

#### Deploy Database (`deploy-database.yml`)

**Trigger**: Push de cambios a `/database/` o `docker-compose.database.yml`

Acciones:
1. SSH a VM3 (Database)
2. Inyectar credenciales de bases de datos
3. `docker-compose build` (si hay cambios de schema)
4. `docker-compose up -d`
5. Crear backup automático

### Flujo Automático Completo

```
1. git push origin develop
                ↓
2. GitHub Actions: build-and-push.yml (Build & Push to GCR)
                ↓
3. GitHub Actions: deploy-gateway.yml, deploy-services.yml en paralelo
                ↓
4. GitHub Actions: deploy-database.yml (si hay cambios)
                ↓
5. Deployment completo, servicios actualizados
```

### Visualizar Workflows

1. Push a tu rama develop/main
2. Ve a: GitHub Repo → Actions
3. Click en el workflow que se ejecutó
4. Ver logs en tiempo real

---

## 🔍 Monitoreo y Mantenimiento

### Script de Monitoreo

```bash
chmod +x scripts/monitor.sh
./scripts/monitor.sh
```

Opciones:
- Monitorear cada VM individualmente
- Ver logs en tiempo real
- CPU y memoria usage
- Health checks de bases de datos

### Ejemplo

```bash
$ ./scripts/monitor.sh

[INFO] Infrastructure information retrieved
[SUCCESS] Infrastructure information retrieved

=== Quetxal TV Monitoring ===
1. Monitor Gateway VM
2. Monitor Services VM
3. Monitor Database VM
4. Show System Health
5. Tail Gateway Logs (live)
6. Tail Services Logs (live)
7. Tail Database Logs (live)
8. Exit

Select option: 3
```

###  SSH Manual a VMs

```bash
# Gateway
gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a

# Services
gcloud compute ssh quetxal-services-vm --zone=us-central1-a

# Database
gcloud compute ssh quetxal-database-vm --zone=us-central1-a
```

### Verificar Estado de Contenedores

```bash
gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a -- \
  docker-compose -f /home/ubuntu/quetxal/docker-compose.gateway.yml ps
```

### Ver Logs

```bash
gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a -- \
  docker-compose -f /home/ubuntu/quetxal/docker-compose.gateway.yml logs -f
```

### Backup de Bases de Datos

```bash
# En Database VM
gcloud compute ssh quetxal-database-vm --zone=us-central1-a -- \
  bash /home/ubuntu/quetxal/scripts/backup-databases.sh
```

---

## 🐛 Troubleshooting

### Problema: "Terraform init fails"

**Síntoma**: Error durante `terraform init`

**Solución**:
```bash
cd terraform
rm -rf .terraform
terraform init
```

### Problema: "SSH permission denied"

**Síntoma**: `Permission denied (publickey)`

**Solución**:
```bash
# Verificar que SSH key está en ssh-agent
ssh-add ~/.ssh/quetxal-gcp
ssh-add -l

# Verificar que el IP es correcto
terraform output gateway_public_ip
```

### Problema: "Containers no arrancan"

**Síntoma**: `docker-compose up -d` falla

**Solución**:
```bash
# SSH a VM
gcloud compute ssh quetxal-database-vm --zone=us-central1-a

# Ver logs
docker-compose -f docker-compose.database.yml logs

# Verificar espacio
df -h

# Verificar memoria
free -h

# Rebuildar imágenes
docker-compose -f docker-compose.database.yml build --no-cache
docker-compose -f docker-compose.database.yml up -d
```

### Problema: "Database no responde"

**Síntoma**: Servicios no pueden conectar a Database

**Holución**:
```bash
# SSH a Services VM
gcloud compute ssh quetxal-services-vm --zone=us-central1-a

# Probar conectividad a Database VM
nc -zv 10.128.0.4 5432

# Si no funciona, verificar firewall rules
# SSH a Database VM y ver logs
docker-compose -f docker-compose.database.yml logs postgres
```

### Problema: "GitHub Actions falla"

**Síntoma**: Workflow falla en GitHub Actions

**Pasos**:
1. Ve a GitHub Actions → Workflow → Click en "failed"
2. Ver logs de cada step
3. Errores comunes:
   - `GCP_SERVICE_ACCOUNT_KEY` inválido
   - `SSH_KEY` incompleto
   - VM IPs desactualizadas

**Solución**:
```bash
# Actualizar IPs en GitHub Secrets
terraform output gateway_public_ip # Actualizar GATEWAY_VM_IP
terraform output services_internal_ip # Actualizar SERVICES_VM_IP
terraform output database_internal_ip # Actualizar DATABASE_VM_IP

# Re-run workflow en GitHub
```

### Problema: "Out of Memory"

**Síntoma**: Servicios se matan, e2-small se queda sin RAM

**Solución**:
1. Upsize de VM (cambiar `e2-small` a `e2-medium` en terraform)
2. Reducir réplicas de servicios
3. Optimizar queries de base de datos

---

## 📊 Costos Estimados

| Componente | Precio (USD/mes) |
|---|---|
| VM1: e2-small | $17.28 |
| VM2: e2-small | $17.28 |
| VM3: e2-small | $17.28 |
| Cloud NAT | $32.85 |
| IPs estáticas | $0.00 (incluido en NAT) |
| Ancho de banda | ~$10-20 |
| **Total** | **~$95-115/mes** |

*Precios de 2024 en us-central1. Pueden variar.*

---

## 📚 Recursos Adicionales

- [Terraform Google Provider Docs](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [GCP Compute Engine Documentation](https://cloud.google.com/compute/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 👥 Soporte y Contacto

Para problemas o preguntas:

1. Revisar GitHub Actions logs
2. Revisar logs de VMs via `monitor.sh`
3. Abrir issue en GitHub con detalles del problema
