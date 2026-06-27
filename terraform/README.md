# Infraestructura como Código — Terraform (Quetxal TV · Fase 3)

> Tarea 7 del reparto. Provisiona de forma **declarativa** toda la infraestructura en GCP:
> VPC, subred con rangos secundarios, firewall, Cloud NAT, cluster **GKE**, la **VM de base de datos
> aislada** y las **VMs de desarrollo**. La creación, modificación y destrucción se hacen 100% con Terraform.

## 1. ¿Qué es y cómo funciona?

Terraform es una herramienta de *aprovisionamiento declarativo*: describes el **estado deseado** de la
infraestructura en archivos `.tf` (HCL) y Terraform calcula y aplica el plan de cambios para llegar a él.
Mantiene un **archivo de estado** (`terraform.tfstate`) que mapea los recursos del código con los recursos
reales en la nube; ese estado es la fuente de verdad para detectar diferencias (`plan`) y para destruir
(`destroy`) exactamente lo que creó.

Flujo: `init` (descarga proveedores) → `plan` (previsualiza) → `apply` (crea/modifica) → `destroy` (elimina).

## 2. Arquitectura provisionada

```
                          Internet
                              │
              ┌───────────────┴───────────────┐
              │                                │
     [LB Ingress GKE]                  [VM dev-gateway] (DMZ, IP pública)
       (única IP ext.)                         │
              │                          [VM dev-services] (privada, NAT)
   ┌──────────┴───────────┐                    │
   │  GKE (VPC-native)     │                    │
   │  nodos PRIVADOS       │      VPC quetxal-vpc · subnet 10.10.0.0/20
   │  pods 10.16/14        │      pods 10.16.0.0/14 · services 10.20.0.0/20
   │  services 10.20/20    │
   │  microservicios +     │────────► [VM quetxal-database-vm] 10.10.0.10
   │  api-gateway + front  │  5432-5439   Docker: 7×Postgres + Redis
   └───────────────────────┘  6379        disco persistente quetxal-db-data
```

- **GKE** zonal (`us-central1-a`), VPC-native, Workload Identity, nodos privados con egreso por **Cloud NAT**.
  La única IP externa del cluster es la del **Ingress** (tarea 9).
- **VM de BD** dedicada y externa al cluster (cumple *Persistencia Aislada de Kubernetes*). Corre las 7 bases
  Postgres + Redis en Docker (las aprovisiona **Ansible**, tarea 8). Datos en disco persistente separado del SO.
- **VMs de desarrollo** (`enable_dev_vms`): replican el entorno `develop → Compute Engine` de la Fase 2.

## 3. Archivos

| Archivo | Contenido |
|---|---|
| `providers.tf` | Versiones y proveedor `google` (auth por ADC) |
| `variables.tf` | Todas las variables de entrada |
| `network.tf` | VPC, subred + rangos secundarios, firewall, router + NAT |
| `iam.tf` | Service accounts (VMs, nodos GKE) y Workload Identity de GCS |
| `gke.tf` | Cluster GKE + node pool |
| `db_vm.tf` | VM de BD + disco persistente + IP interna estática |
| `dev_vms.tf` | VMs gateway/services de desarrollo (gated) |
| `data.tf` | Imagen Ubuntu + metadata SSH |
| `outputs.tf` | Salidas + generación del inventario de Ansible |
| `templates/inventory.ini.tpl` | Plantilla del inventario de Ansible |

## 4. Requisitos previos

```bash
gcloud auth application-default login          # credenciales ADC (sin llaves JSON)
gcloud config set project quetxal-tv-498705
# Habilitar APIs (una sola vez):
gcloud services enable compute.googleapis.com container.googleapis.com \
  iam.googleapis.com iamcredentials.googleapis.com
# Llave SSH para Ansible (si no existe):
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
```

## 5. Uso paso a paso

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # ajusta valores
terraform init                                  # descarga proveedores
terraform fmt -recursive && terraform validate  # formato + validación
terraform plan -out tf.plan                     # previsualiza  📸 captura aquí
terraform apply tf.plan                         # crea infraestructura  📸 captura aquí

# Conectar kubectl al cluster recién creado:
$(terraform output -raw gke_get_credentials)

# Ver IP interna de la BD (va al ConfigMap de K8s, tarea 9):
terraform output db_internal_ip
```

El `apply` genera automáticamente `../ansible/inventory/hosts.gen.ini` con las IPs reales para la tarea 8.

## 6. Destrucción (declarativa, sólo DESPUÉS de la calificación)

```bash
terraform destroy
```

## 7. Notas

- **Cuota de IPs externas**: con `gke_private_nodes = true` GKE sólo gasta 1 IP (el LB del Ingress).
  Si te quedas corto de cuota, pon `enable_dev_vms = false` y/o `db_vm_public_ip = false` (entra por IAP).
- **Estado**: por defecto el estado es local. Para equipo, descomenta el backend GCS en `providers.tf`.
- **GCS Workload Identity**: el SA `quetxal-catalog-gcs` ya existe (Fase 2). Para que Terraform lo gestione,
  impórtalo y pon `manage_gcs_workload_identity = true` (ver `terraform.tfvars.example`).
- 📸 **Capturas obligatorias** para el documento: salida de `plan`/`apply`, recursos en la consola de GCP
  (VPC, GKE, instancias) y `terraform output`.
