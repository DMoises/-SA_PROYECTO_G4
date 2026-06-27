###############################################################################
# Cluster de GKE (VPC-native) + node pool propio + Workload Identity
###############################################################################

resource "google_container_cluster" "primary" {
  name     = var.gke_cluster_name
  location = var.gcp_zone # cluster ZONAL (1 zona) para ahorrar cuota/costo

  # Se crea con el node pool por defecto y se elimina enseguida para usar uno
  # gestionado por separado (patrón recomendado por Google).
  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.id
  subnetwork = google_compute_subnetwork.subnet.id

  networking_mode = "VPC_NATIVE"
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  # Workload Identity (catalog-service -> GCS sin llaves estáticas).
  workload_identity_config {
    workload_pool = "${var.gcp_project_id}.svc.id.goog"
  }

  # Nodos privados (sin IP pública) + endpoint público para que el pipeline de
  # CI/CD (GitHub Actions) pueda hacer kubectl. La única IP externa de GKE es
  # la del Load Balancer del Ingress.
  private_cluster_config {
    enable_private_nodes    = var.gke_private_nodes
    enable_private_endpoint = false
    master_ipv4_cidr_block  = var.master_ipv4_cidr_block
  }

  # Permite que GitHub Actions (IPs dinámicas) alcance el plano de control.
  # Restríngelo a rangos conocidos si tienes runners con IP fija.
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "all (ci-cd github actions)"
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  # Permite `terraform destroy` (requisito: destrucción declarativa).
  deletion_protection = false

  lifecycle {
    ignore_changes = [initial_node_count]
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name     = "quetxal-node-pool"
  cluster  = google_container_cluster.primary.id
  location = var.gcp_zone

  node_count = var.gke_node_count

  node_config {
    machine_type = var.gke_machine_type
    disk_size_gb = var.gke_disk_size_gb
    disk_type    = "pd-standard"

    service_account = google_service_account.gke_node_sa.email
    oauth_scopes    = ["https://www.googleapis.com/auth/cloud-platform"]

    # Habilita Workload Identity a nivel de nodo.
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    labels = {
      app = "quetxal-tv"
    }
    tags = ["quetxal", "quetxal-gke-node"]

    metadata = {
      disable-legacy-endpoints = "true"
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}
