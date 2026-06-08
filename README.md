# 🎬 Quetxal TV - Streaming Platform

Platform de streaming distribuida con microservicios, desplegada en Google Cloud Platform con CI/CD automático.

## 📋 Quick Links

- **[📖 Guía de Despliegue Completa](./docs/DEPLOYMENT_GUIDE.md)** - Instrucciones paso a paso
- **[🔐 Configuración de GitHub Secrets](./docs/.github/SECRETS.md)** - Variables necesarias para CI/CD
- **[🏗️ Arquitectura](#arquitectura)** - Visión general de la infraestructura

---

## 🏗️ Arquitectura

### Estructura de Microservicios (3 VMs en GCP)

```
                    Internet
                       ▲
                       │ HTTP/HTTPS
                       │
    ┌──────────────────▼──────────────────┐
    │  VM1: API Gateway (DMZ)             │
    │  - TypeScript                       │
    │  - Public IP (0.0.0.0/0)            │
    └──────────────────┬──────────────────┘
                       │ gRPC (Internal)
         ┌─────────────▼─────────────┐
         │                           │
    ┌────▼────────┐        ┌────────▼──┐
    │ VM2: Services│        │ VM3: Data │
    │ 7 µServices  │        │ 6 DBs+    │
    │ (Privada)    │        │ Redis     │
    │ 10.128.0.3   │        │ (Privada) │
    │              │        │ 10.128.0.4│
    └──────────────┘        └───────────┘
         (Go, Python, TS)    (PostgreSQL, Redis)

            ← All connected via VPC (10.128.0.0/28) →
```

### Servicios

| Nombre | Lenguaje | Puerto gRPC | Base de Datos | Descripción |
|--------|----------|-----------|--------------|-------------|
| **Identity** | Go (Gin) | 50051 | Auth DB | Autenticación y gestión de usuarios |
| **History** | Go (Gin) | 50052 | History DB | Historial de visualización |
| **Catalog** | Python | 50053 | Catalog DB | Catálogo de contenidos |
| **Rating** | Python | 50054 | Rating DB | Calificaciones y reseñas |
| **FX** | Python | 50055 | FX DB + Redis | Servicio de cambio de moneda |
| **Billing** | TypeScript | 50056 | Subscription DB | Gestión de suscripciones |
| **Notification** | TypeScript | 50057 | Notification DB | Sistema de notificaciones |

---

## 🚀 Inicio Rápido

### Prerequisites

- Google Cloud Platform (credenciales + proyecto)
- Terraform instalado
- gcloud CLI configurado
- GitHub con acceso al repositorio

### Deploy en 3 Pasos

```bash
# 1. Clonar proyecto
git clone <repo-url>
cd quetxal-tv

# 2. Configurar Terraform
cd terraform
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars  # Editar con tus valores

# 3. Desplegar infraestructura
../scripts/deploy.sh
```

Ver **[Guía de Despliegue Completa](./docs/DEPLOYMENT_GUIDE.md)** para instrucciones detalladas.

---

## 📁 Estructura del Proyecto

```
quetxal-tv/
├── 📂 backend/
│   └── services/              # Microservicios (se agregan aquí)
│   └── Dockerfile.gateway     # API Gateway
├── 📂 database/
│   ├── auth/                  # Auth DB (PostgreSQL + Schema)
│   ├── subscription/          # Subscription DB
│   ├── catalog/               # Catalog DB
│   ├── rating/                # Rating DB
│   ├── fx/                    # FX DB
│   ├── history/               # History DB
│   └── notification/          # Notification DB
├── 📂 frontend/
│   ├── app/                   # Next.js app router
│   ├── components/            # React components
│   └── public/                # Static assets
├── 📂 terraform/              # Infrastructure as Code
│   ├── main.tf                # VMs, VPC, Firewall
│   ├── variables.tf
│   ├── outputs.tf
│   ├── startup-scripts/       # Init scripts para VMs
│   └── terraform.tfvars.example
├── 📂 scripts/
│   ├── deploy.sh              # Deploy script
│   └── monitor.sh             # Monitoring script
├── 📂 .github/
│   ├── workflows/
│   │   ├── build-and-push.yml     # Build images → GCR
│   │   ├── deploy-gateway.yml     # Deploy Gateway
│   │   ├── deploy-services.yml    # Deploy Services
│   │   └── deploy-database.yml    # Deploy Database
│   └── SECRETS.md             # Documentación de secrets
├── docker-compose.gateway.yml
├── docker-compose.services.yml
├── docker-compose.database.yml
├── .env.cloud                 # Environment variables para cloud
└── README.md (← aquí)
```

---

## 🔄 Flujo de CI/CD

```
1. git push origin develop/main
                    ↓
2. build-and-push.yml
   ├─ Build Docker images
   ├─ Push a GCR
   └─ Done
                    ↓
3. deploy-gateway.yml + deploy-services.yml (paralelo)
   ├─ SSH a VMs
   ├─ Pull docker-compose files
   ├─ docker-compose pull & up
   └─ Done
                    ↓
4. deploy-database.yml (si hay cambios)
   ├─ SSH a Database VM
   ├─ Build schemas
   ├─ docker-compose up
   └─ Done
                    ↓
5. ✅ Deployment completo
```

---

## 🛠️ Desarrollo

### Local Development

Para trabajar localmente en microservicios:

```bash
# Devs: Usar docker-compose.local.yml
docker-compose -f docker-compose.local.yml up -d

# Microservicios: Agregar Dockerfiles en backend/services/
# gateway: Agregar Dockerfile.gateway en backend/
```

### Agregar un Nuevo Microservicio

1. Crear carpeta: `backend/services/my-service/`
2. Agregar `Dockerfile.my-service`
3. Agregar entrada en `docker-compose.services.yml`
4. En `terraform/startup-scripts/vm2-services-startup.sh` agregar servicio
5. Push a develop → CI/CD se ejecuta automáticamente

---

## 📖 Documentación

| Documento | Descripción |
|-----------|-------------|
| [**DEPLOYMENT_GUIDE.md**](./docs/DEPLOYMENT_GUIDE.md) | Guía completa de despliegue en GCP |
| [**SECRETS.md**](./.github/SECRETS.md) | Configuración de GitHub Secrets |
| [**terraform/README.md**](./terraform/README.md) | Documentación de Terraform (si existe) |
| [**API Documentation**](./docs/API.md) | Endpoints de la API (si existe) |

---

## 🔐 Seguridad

- ✅ VM1 (Gateway) es la única con IP pública
- ✅ VM2 y VM3 son privadas (solo acceso interno)
- ✅ Firewall rules permiten solo tráfico necesario
- ✅ Cloud NAT para outbound traffic de VMs privadas
- ✅ SSH keys en Terraform (no committeadas)
- ✅ Database passwords en GitHub Secrets (no en código)

### Recomendaciones

1. **Rotar credenciales** cada 90 días
2. **Limitar acceso SSH** a IPs específicas
3. **Habilitar Cloud Logging** en GCP
4. **Backup regular** de bases de datos
5. **Monitorear costos** en GCP Console

---

## 💰 Costos Estimados

| Componente | Mes |
|-----------|-----|
| 3x e2-small VMs | ~$50 |
| Cloud NAT | ~$33 |
| Ancho de banda | ~$10-20 |
| **Total** | ~**$100/mes** |

*Precios de 2024 en us-central1*

---

## 📞 Soporte

Problemas comunes:

1. **SSH connection refused** → Verificar IPs en GitHub Secrets
2. **Container no arrancan** → Ver logs: `docker-compose logs`
3. **Database connection error** → Verificar `DB_HOST` es correcto (10.128.0.4)
4. **GitHub Actions falla** → Revisar secrets en `.github/SECRETS.md`

Para más detalles ver [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) sección **Troubleshooting**.

---

## 👥 Team

- **DevOps/SRE**: Setup de infraestructura en GCP
- **Backend**: Desarrollo de microservicios
- **Frontend**: Desarrollo de aplicación Next.js
- **QA**: Testing de deployment

---

## 📜 License

Proyecto académico - SA Grupo 4

---

**Last Updated**: Junio 2026 | **Version**: 1.0.0

