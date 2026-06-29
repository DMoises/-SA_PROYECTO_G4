###############################################################################
# Variables de entrada
###############################################################################

# ---------------------------------------------------------------------------
# Proyecto / ubicación
# ---------------------------------------------------------------------------
variable "gcp_project_id" {
  description = "ID del proyecto de Google Cloud"
  type        = string
  default     = "quetxal-tv-498705"
}

variable "gcp_region" {
  description = "Región de GCP"
  type        = string
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "Zona de GCP (cluster GKE zonal y VMs)"
  type        = string
  default     = "us-central1-a"
}

# ---------------------------------------------------------------------------
# Red (VPC + subred con rangos secundarios para GKE VPC-native)
# ---------------------------------------------------------------------------
variable "network_name" {
  description = "Nombre de la VPC"
  type        = string
  default     = "quetxal-vpc"
}

variable "subnet_name" {
  description = "Nombre de la subred principal"
  type        = string
  default     = "quetxal-subnet"
}

variable "subnet_cidr" {
  description = "Rango primario de la subred (nodos GKE + VMs)"
  type        = string
  default     = "10.10.0.0/20"
}

variable "pods_cidr" {
  description = "Rango secundario para Pods de GKE"
  type        = string
  default     = "10.16.0.0/14"
}

variable "services_cidr" {
  description = "Rango secundario para Services de GKE"
  type        = string
  default     = "10.20.0.0/20"
}

variable "master_ipv4_cidr_block" {
  description = "Rango /28 del plano de control privado de GKE"
  type        = string
  default     = "172.16.0.0/28"
}

variable "ssh_source_ranges" {
  description = "Rangos autorizados para SSH (Ansible). Restríngelo a tu IP/32 en producción."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_nat" {
  description = "Habilita Cloud NAT para que nodos/VMs privados salgan a internet"
  type        = bool
  default     = true
}

# ---------------------------------------------------------------------------
# Imagen base de las VMs
# ---------------------------------------------------------------------------
variable "image_family" {
  description = "Familia de imagen para las VMs (Ubuntu LTS)"
  type        = string
  default     = "ubuntu-2204-lts"
}

variable "image_project" {
  description = "Proyecto donde vive la imagen"
  type        = string
  default     = "ubuntu-os-cloud"
}

variable "ssh_user" {
  description = "Usuario SSH para las VMs (Ansible se conecta con este usuario)"
  type        = string
  default     = "ubuntu"
}

variable "ssh_public_key_path" {
  description = "Ruta a la llave pública SSH inyectada en las VMs para Ansible (ej. ~/.ssh/id_rsa.pub)"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# ---------------------------------------------------------------------------
# GKE
# ---------------------------------------------------------------------------
variable "gke_cluster_name" {
  description = "Nombre del cluster de GKE (debe coincidir con el workflow deploy-k8s.yml)"
  type        = string
  default     = "quetxal-cluster"
}

variable "gke_machine_type" {
  description = "Tipo de máquina de los nodos de GKE"
  type        = string
  default     = "e2-medium"
}

variable "gke_node_count" {
  description = "Número de nodos del node pool (sin autoscaling)"
  type        = number
  default     = 2
}

variable "gke_disk_size_gb" {
  description = "Tamaño de disco por nodo de GKE"
  type        = number
  default     = 30
}

variable "gke_private_nodes" {
  description = "Nodos sin IP pública (salen por Cloud NAT). Ahorra cuota de IPs; el LB del Ingress es la única IP externa de GKE."
  type        = bool
  default     = true
}

# ---------------------------------------------------------------------------
# VM de Base de Datos (persistencia AISLADA, fuera de los Pods de K8s)
# ---------------------------------------------------------------------------
variable "db_machine_type" {
  description = "Tipo de máquina de la VM de BD (corre 7 Postgres + Redis en Docker)"
  type        = string
  default     = "e2-medium"
}

variable "db_boot_disk_gb" {
  description = "Disco de arranque de la VM de BD"
  type        = number
  default     = 30
}

variable "db_data_disk_gb" {
  description = "Disco persistente de datos para los volúmenes de las BD (separado del SO)"
  type        = number
  default     = 50
}

variable "db_internal_ip" {
  description = "IP interna estática de la VM de BD (la consumen los microservicios de GKE)"
  type        = string
  default     = "10.10.0.10"
}

variable "db_vm_public_ip" {
  description = "Asigna IP pública efímera a la VM de BD para que Ansible entre por SSH. Ponlo en false y usa IAP/bastión para minimizar superficie."
  type        = bool
  default     = true
}

# ---------------------------------------------------------------------------
# VMs de desarrollo (flujo develop -> Compute Engine). Gated por cuota.
# ---------------------------------------------------------------------------
variable "enable_dev_vms" {
  description = "Crea las VMs de desarrollo (gateway + services). Desactívalo para ahorrar cuota de IPs/CPU."
  type        = bool
  default     = true
}

variable "dev_vm_machine_type" {
  description = "Tipo de máquina de las VMs de desarrollo"
  type        = string
  default     = "e2-small"
}

variable "dev_gateway_internal_ip" {
  description = "IP interna estática de la VM gateway de desarrollo"
  type        = string
  default     = "10.10.0.2"
}

variable "dev_services_internal_ip" {
  description = "IP interna estática de la VM de servicios de desarrollo"
  type        = string
  default     = "10.10.0.3"
}

# ---------------------------------------------------------------------------
# Workload Identity para GCS (catalog-service firma Signed URLs)
# ---------------------------------------------------------------------------
variable "manage_gcs_workload_identity" {
  description = "Si Terraform debe crear/gestionar el SA de GCS y el binding de Workload Identity. El SA ya existe (creado en Fase 2); déjalo en false salvo que lo importes."
  type        = bool
  default     = false
}

variable "gcs_service_account_id" {
  description = "account_id del SA de GCS usado por catalog-service"
  type        = string
  default     = "quetxal-catalog-gcs"
}

variable "k8s_namespace" {
  description = "Namespace de Kubernetes de la aplicación"
  type        = string
  default     = "quetxal-tv-prod"
}

variable "catalog_ksa_name" {
  description = "Nombre del ServiceAccount de Kubernetes de catalog-service"
  type        = string
  default     = "catalog-gcs-sa"
}

variable "gcs_bucket_name" {
  description = "Bucket de GCS con la multimedia (portadas/video). El catalog-service en las VMs lo lee y firma URLs."
  type        = string
  default     = "quetxal-tv-media-bucket"
}

# ---------------------------------------------------------------------------
# Publicación de IPs a GitHub Actions (para que el CI sobreviva un destroy)
# ---------------------------------------------------------------------------
variable "publish_ips_to_github" {
  description = "Si Terraform debe publicar las IPs de las VMs a los GitHub Secrets (GATEWAY_VM_IP, etc.) vía `gh secret set` tras cada apply. Requiere `gh` autenticado con permiso de admin en el repo, en la máquina donde corras terraform. Déjalo en false en CI."
  type        = bool
  default     = false
}

variable "github_repo" {
  description = "Repositorio GitHub (owner/name) donde publicar los Secrets de IPs cuando publish_ips_to_github = true."
  type        = string
  default     = "DMoises/-SA_PROYECTO_G4"
}

# ---------------------------------------------------------------------------
# Etiquetas
# ---------------------------------------------------------------------------
variable "common_tags" {
  description = "Network tags base para las VMs"
  type        = list(string)
  default     = ["quetxal", "docker"]
}
