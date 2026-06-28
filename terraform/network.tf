###############################################################################
# Red: VPC + subred (con rangos secundarios para GKE VPC-native), firewall y NAT
###############################################################################

resource "google_compute_network" "vpc" {
  name                    = var.network_name
  auto_create_subnetworks = false
  description             = "VPC de Quetxal TV — Fase 3"
}

resource "google_compute_subnetwork" "subnet" {
  name          = var.subnet_name
  ip_cidr_range = var.subnet_cidr
  region        = var.gcp_region
  network       = google_compute_network.vpc.id

  # Necesario para que GKE registre el acceso a la red interna.
  private_ip_google_access = true

  # Rangos secundarios consumidos por el cluster VPC-native (Alias IPs).
  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.services_cidr
  }
}

# ---------------------------------------------------------------------------
# Firewall
# ---------------------------------------------------------------------------

# Tráfico interno libre dentro de la VPC (nodos, pods, VMs).
resource "google_compute_firewall" "allow_internal" {
  name    = "quetxal-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }
  allow {
    protocol = "icmp"
  }

  source_ranges = [var.subnet_cidr, var.pods_cidr, var.services_cidr]
}

# SSH para Ansible (agentless). Restringe ssh_source_ranges a tu IP en producción.
resource "google_compute_firewall" "allow_ssh" {
  name    = "quetxal-allow-ssh"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.ssh_source_ranges
}

# HTTP/HTTPS sólo hacia la VM gateway (DMZ) del flujo develop.
resource "google_compute_firewall" "allow_http_https" {
  name    = "quetxal-allow-http-https"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443", "8080"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["quetxal-gateway"]
}

# Persistencia AISLADA: los microservicios en GKE (nodos + pods) alcanzan la
# VM de BD externa. Puertos: 5432-5439 (7 Postgres) y 6379 (Redis).
resource "google_compute_firewall" "allow_gke_to_db" {
  name    = "quetxal-allow-gke-to-db"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["5432-5439", "6379"]
  }

  source_ranges = [var.subnet_cidr, var.pods_cidr]
  target_tags   = ["quetxal-db"]
}

# Rangos de los health checks de los Load Balancers de GCP (Ingress GKE).
resource "google_compute_firewall" "allow_health_checks" {
  name    = "quetxal-allow-health-checks"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
}

# ---------------------------------------------------------------------------
# Cloud Router + NAT (egreso a internet para nodos/VMs sin IP pública)
# ---------------------------------------------------------------------------
resource "google_compute_router" "router" {
  count   = var.enable_nat ? 1 : 0
  name    = "quetxal-nat-router"
  region  = var.gcp_region
  network = google_compute_network.vpc.id
}

resource "google_compute_router_nat" "nat" {
  count                              = var.enable_nat ? 1 : 0
  name                               = "quetxal-nat"
  router                             = google_compute_router.router[0].name
  region                             = var.gcp_region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}
