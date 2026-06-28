###############################################################################
# Habilitación automática de APIs de GCP.
# Evita que el dueño del proyecto tenga que activarlas a mano en la consola.
# (cloudresourcemanager y serviceusage suelen venir activas por defecto.)
###############################################################################

locals {
  gcp_apis = [
    "compute.googleapis.com",            # VPC, VMs, firewall, NAT, discos
    "container.googleapis.com",          # GKE
    "iam.googleapis.com",                # Service accounts
    "iamcredentials.googleapis.com",     # Firmar Signed URLs (GCS)
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "storage.googleapis.com",            # GCS / tfstate
  ]
}

resource "google_project_service" "enabled" {
  for_each = toset(local.gcp_apis)
  project  = var.gcp_project_id
  service  = each.value

  disable_on_destroy         = false # no apagar APIs al destruir (evita romper otros recursos)
  disable_dependent_services = false
}
