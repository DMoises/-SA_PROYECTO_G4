###############################################################################
# Identidades de servicio (IAM)
###############################################################################

# ---------------------------------------------------------------------------
# SA para las VMs (gateway, services, db). Mínimo privilegio + telemetría
# (logging/monitoring) para que ELK/Prometheus puedan recolectar después.
# ---------------------------------------------------------------------------
resource "google_service_account" "vm_sa" {
  account_id   = "quetxal-vm-sa"
  display_name = "Quetxal TV — Service Account de VMs"
}

resource "google_project_iam_member" "vm_log_writer" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.vm_sa.email}"
}

resource "google_project_iam_member" "vm_metric_writer" {
  project = var.gcp_project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.vm_sa.email}"
}

# GCS para el catalog-service cuando corre en las VMs (usa vm_sa vía ADC):
# firmar URLs v4 (signBlob sobre sí mismo) y leer el bucket de media. En GKE esto
# lo cubre quetxal-catalog-gcs vía Workload Identity; en las VMs lo necesita vm_sa.
resource "google_service_account_iam_member" "vm_sa_sign_blob" {
  service_account_id = google_service_account.vm_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.vm_sa.email}"
}

resource "google_storage_bucket_iam_member" "vm_sa_media_reader" {
  bucket = var.gcs_bucket_name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.vm_sa.email}"
}

# ---------------------------------------------------------------------------
# SA para los nodos de GKE (mínimo privilegio recomendado por Google)
# ---------------------------------------------------------------------------
resource "google_service_account" "gke_node_sa" {
  account_id   = "quetxal-gke-node-sa"
  display_name = "Quetxal TV — Service Account de nodos GKE"
}

locals {
  gke_node_roles = [
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/monitoring.viewer",
    "roles/stackdriver.resourceMetadata.writer",
    "roles/artifactregistry.reader",
    "roles/storage.objectViewer",
  ]
}

resource "google_project_iam_member" "gke_node_roles" {
  for_each = toset(local.gke_node_roles)
  project  = var.gcp_project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.gke_node_sa.email}"
}

# ---------------------------------------------------------------------------
# Workload Identity para GCS (catalog-service firma Signed URLs v4).
# Gestionado sólo si manage_gcs_workload_identity = true (el SA ya existe de
# Fase 2; impórtalo antes con `terraform import` para no recrearlo).
# ---------------------------------------------------------------------------
resource "google_service_account" "gcs_sa" {
  count        = var.manage_gcs_workload_identity ? 1 : 0
  account_id   = var.gcs_service_account_id
  display_name = "Quetxal TV — Catalog GCS (Signed URLs)"
}

resource "google_project_iam_member" "gcs_object_viewer" {
  count   = var.manage_gcs_workload_identity ? 1 : 0
  project = var.gcp_project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.gcs_sa[0].email}"
}

# Necesario para firmar URLs v4 vía la API IAM signBlob (sin llave privada local).
resource "google_service_account_iam_member" "gcs_sign_blob" {
  count              = var.manage_gcs_workload_identity ? 1 : 0
  service_account_id = google_service_account.gcs_sa[0].name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.gcs_sa[0].email}"
}

# Enlace Workload Identity: el KSA catalog-gcs-sa actúa como el GSA de GCS.
resource "google_service_account_iam_member" "gcs_workload_identity" {
  count              = var.manage_gcs_workload_identity ? 1 : 0
  service_account_id = google_service_account.gcs_sa[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.gcp_project_id}.svc.id.goog[${var.k8s_namespace}/${var.catalog_ksa_name}]"
}
