# GitHub Secrets Configuration

Este archivo documenta todos los **GitHub Secrets** necesarios para que los workflows de CI/CD funcionen correctamente.

## Configuración de Secrets en GitHub

Para agregar estos secrets a tu repositorio:

1. Ir a: **Settings** → **Secrets and variables** → **Actions**
2. Click en **New repository secret**
3. Agregar cada secret con el nombre exacto y valor

---

## Secrets Requeridos

### GCP Credentials

#### `GCP_PROJECT_ID`
- **Valor**: Tu Google Cloud Project ID
- **Ejemplo**: `my-quetxal-project`
- **Obtener**: `gcloud config get-value project`

#### `GCP_SERVICE_ACCOUNT_KEY`
- **Valor**: Contenido JSON del Service Account credentials file
- **Tipo**: JSON (serializado como string)
- **Cómo obtener**:
  ```bash
  # En GCP Console:
  # 1. Ir a: Service Accounts
  # 2. Crear o seleccionar service account
  # 3. Click en "Keys"
  # 4. "Create new key" → JSON
  # 5. Copiar el contenido del JSON descargado

  # Validar que el JSON sea válido:
  cat service-account-key.json | jq .
  ```

### SSH Keys & VM IPs

#### `SSH_KEY`
- **Valor**: Private SSH key para acceder a las VMs
- **Tipo**: PEM format
- **Cómo obtener**:
  ```bash
  # Opción 1: Generar nueva SSH key
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/quetxal-gcp-key -N ""

  # Opción 2: Usar key existente
  cat ~/.ssh/id_rsa

  # En GitHub Secret: Pegar el contenido completo incluyendo
  # las líneas "-----BEGIN RSA PRIVATE KEY-----" y "-----END RSA PRIVATE KEY-----"
  ```

#### `SSH_USER`
- **Valor**: Usuario SSH en las VMs
- **Default**: `ubuntu` (para Ubuntu 22.04 LTS)

#### `GATEWAY_VM_IP`
- **Valor**: Public IP del Gateway VM
- **Ejemplo**: `34.123.45.67`
- **Obtener después de Terraform**: `terraform output gateway_public_ip`

#### `SERVICES_VM_IP`
- **Valor**: Internal IP del Services VM
- **Ejemplo**: `10.128.0.3`
- **Obtener después de Terraform**: `terraform output services_internal_ip`

#### `DATABASE_VM_IP`
- **Valor**: Internal IP del Database VM
- **Ejemplo**: `10.128.0.4`
- **Obtener después de Terraform**: `terraform output database_internal_ip`

### Database Credentials

Estas son las contraseñas para acceder a cada base de datos. **Reemplazar "your-secure-password" con contraseñas reales y fuertes**:

#### `AUTH_DB_PASSWORD`
- **Valor**: Contraseña para Auth Database
- **Recomendación**: Mínimo 32 caracteres, alfanumérico + símbolos

#### `SUBSCRIPTION_DB_PASSWORD`
- **Valor**: Contraseña para Subscription Database

#### `CATALOG_DB_PASSWORD`
- **Valor**: Contraseña para Catalog Database

#### `RATING_DB_PASSWORD`
- **Valor**: Contraseña para Rating Database

#### `FX_DB_PASSWORD`
- **Valor**: Contraseña para FX Database

#### `HISTORY_DB_PASSWORD`
- **Valor**: Contraseña para History Database

#### `NOTIFICATION_DB_PASSWORD`
- **Valor**: Contraseña para Notification Database

#### `REDIS_PASSWORD`
- **Valor**: Contraseña para Redis Cache
- **Recomendación**: Mínimo 32 caracteres, alfanumérico + símbolos

---

## Generar Contraseñas Seguras

```bash
# Generar contraseña aleatoria de 32 caracteres
openssl rand -base64 32

# O usar Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Flujo de Configuración

### 1. Crear Proyecto GCP y Service Account

```bash
# Login en GCP
gcloud auth login
gcloud config set project your-project-id

# Crear service account
gcloud iam service-accounts create quetxal-ci-cd \
  --display-name "Quetxal TV CI/CD"

# Asignar roles necesarios
gcloud projects add-iam-policy-binding your-project-id \
  --member serviceAccount:quetxal-ci-cd@your-project-id.iam.gserviceaccount.com \
  --role roles/compute.admin

gcloud projects add-iam-policy-binding your-project-id \
  --member serviceAccount:quetxal-ci-cd@your-project-id.iam.gserviceaccount.com \
  --role roles/storage.admin

# Crear key JSON
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account quetxal-ci-cd@your-project-id.iam.gserviceaccount.com

# Copiar el contenido de service-account-key.json para GitHub Secret
```

### 2. Crear SSH Key

```bash
# Generar SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/quetxal-gcp -N ""

# Copiar private key para GitHub Secret
cat ~/.ssh/quetxal-gcp

# La public key se usará en Terraform (metadata de VMs)
```

### 3. Desplegar Infraestructura en GCP

```bash
cd terraform

# Copiar template de variables
cp terraform.tfvars.example terraform.tfvars

# Editar terraform.tfvars con tus valores
nano terraform.tfvars

# Desplegar
terraform init
terraform plan
terraform apply

# Obtener IPs de output
terraform output
```

### 4. Configurar GitHub Secrets

Una vez tengas:
- GCP Project ID
- Service Account Key (JSON)
- SSH Key
- VM IPs

Ve a GitHub Repository → Settings → Secrets and variables → Actions y agrega todos los secrets.

### 5. Verificar Funcionamiento

```bash
# Hacer push a develop o main
git push origin develop

# Ir a GitHub Actions tab y ver que los workflows se ejecutan
# Ver logs de cada workflow
```

---

## Tabla Resumen de Secrets

| Secret Name | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| GCP_PROJECT_ID | String | ✓ | Google Cloud Project ID |
| GCP_SERVICE_ACCOUNT_KEY | JSON | ✓ | Service Account credentials |
| SSH_KEY | PEM | ✓ | Private SSH key para VMs |
| SSH_USER | String | ✓ | Usuario SSH (default: ubuntu) |
| GATEWAY_VM_IP | IP | ✓ | Public IP del Gateway |
| SERVICES_VM_IP | IP | ✓ | Internal IP de Services |
| DATABASE_VM_IP | IP | ✓ | Internal IP de Database |
| AUTH_DB_PASSWORD | String | ✓ | Password Auth DB |
| SUBSCRIPTION_DB_PASSWORD | String | ✓ | Password Subscription DB |
| CATALOG_DB_PASSWORD | String | ✓ | Password Catalog DB |
| RATING_DB_PASSWORD | String | ✓ | Password Rating DB |
| FX_DB_PASSWORD | String | ✓ | Password FX DB |
| HISTORY_DB_PASSWORD | String | ✓ | Password History DB |
| NOTIFICATION_DB_PASSWORD | String | ✓ | Password Notification DB |
| REDIS_PASSWORD | String | ✓ | Password Redis |

---

## Testing

Para verificar que los secrets están correctamente configurados:

```bash
# Hacer un commit dummy en una rama
git checkout -b test/secrets
git commit --allow-empty -m "test: verify secrets"
git push origin test/secrets

# En GitHub Actions, verificar que el workflow se ejecuta
# sin errores de authentication

# Después eliminar la rama
git checkout main
git branch -D test/secrets
git push origin --delete test/secrets
```

---

## Troubleshooting

### Error: "Credentials not found" en GitHub Actions

- Verificar que `GCP_SERVICE_ACCOUNT_KEY` está completo y es JSON válido
- Verificar formato: debe ser string, no object parseado

### Error: "SSH permission denied"

- Verificar que `SSH_KEY` incluye las líneas begin/end
- Verificar que `SSH_USER` es correcto (probablemente `ubuntu`)
- Verificar que `GATEWAY_VM_IP` es la IP pública correcta

### Error: "Database authentication failed"

- Verificar que las contraseñas están en el secret
- Asegurar que se usó la misma contraseña en `.env.cloud`
- Verificar que el caracteres especiales en la contraseña no rompan bash

---

## Security Best Practices

1. **Rotar contraseñas regularmente**: Cada 90 días
2. **Usar contraseñas fuertes**: Mínimo 32 caracteres
3. **No compartir secrets**: Nunca copiar a archivos .env committeados
4. **SSH Keys**: Proteger con passphrase `ssh-keygen -p`
5. **Limits GCP**: Usa un service account específico con roles limitados
6. **Auditar cambios**: GitHub registra cuándo se modifican secrets

---

## Después del Primer Deploy

- Cambiar contraseñas de bases de datos
- Rotar SSH keys
- Revisar logs de GCP para accesos inusuales
- Configurar Cloud Monitoring para alertas
