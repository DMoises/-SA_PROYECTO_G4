terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  # credentials = file(var.credentials_path)
  project     = var.gcp_project_id
  region      = var.gcp_region
}

# ============================================
# NETWORK CONFIGURATION
# ============================================

resource "google_compute_network" "vpc" {
  name                    = var.network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = var.subnet_name
  ip_cidr_range = var.subnet_cidr
  region        = var.gcp_region
  network       = google_compute_network.vpc.id
}

# ============================================
# FIREWALL RULES
# ============================================

# Allow internal communication within VPC
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

  source_ranges = [var.subnet_cidr]
}

# Allow SSH from anywhere (restrict this to your IP in production)
resource "google_compute_firewall" "allow_ssh" {
  name    = "quetxal-allow-ssh"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]  # Restrict to your IP: ["YOUR_IP/32"]
}

# Allow HTTP/HTTPS only on Gateway VM (VM1)
resource "google_compute_firewall" "allow_http_https" {
  name    = "quetxal-allow-http-https"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["quetxal-gateway"]
}

# ============================================
# CLOUD NAT (for private VMs to reach internet)
# ============================================

resource "google_compute_router" "nat_router" {
  count   = var.enable_nat ? 1 : 0
  name    = "quetxal-nat-router"
  region  = var.gcp_region
  network = google_compute_network.vpc.id

  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "nat" {
  count                  = var.enable_nat ? 1 : 0
  name                   = "quetxal-nat"
  router                 = google_compute_router.nat_router[0].name
  region                 = google_compute_router.nat_router[0].region
  nat_ip_allocate_option = "AUTO_ONLY"

  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORK_IP_RANGES"
}

# ============================================
# STATIC INTERNAL IPS (for consistent networking)
# ============================================

resource "google_compute_address" "gateway_ip" {
  name         = "quetxal-gateway-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = google_compute_subnetwork.subnet.id
  address      = "10.128.0.2"  # Gateway VM
}

resource "google_compute_address" "services_ip" {
  name         = "quetxal-services-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = google_compute_subnetwork.subnet.id
  address      = "10.128.0.3"  # Services VM
}

resource "google_compute_address" "database_ip" {
  name         = "quetxal-database-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = google_compute_subnetwork.subnet.id
  address      = "10.128.0.4"  # Database VM
}

# ============================================
# VM INSTANCES
# ============================================

# VM1: API Gateway (DMZ) - with Public IP
resource "google_compute_instance" "gateway" {
  name         = "quetxal-gateway-vm"
  machine_type = var.vm_machine_type
  zone         = var.gcp_zone
  tags         = concat(var.tags, ["quetxal-gateway"])

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = 30
    }
  }

  network_interface {
    subnetwork    = google_compute_subnetwork.subnet.id
    network_ip    = "10.128.0.2"
    access_config {
      # Ephemeral public IP
    }
  }

  metadata_startup_script = file("${path.module}/startup-scripts/vm1-gateway-startup.sh")

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }
}

# VM2: Microservices (Private)
resource "google_compute_instance" "services" {
  name         = "quetxal-services-vm"
  machine_type = var.vm_machine_type
  zone         = var.gcp_zone
  tags         = var.tags

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = 30
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = "10.128.0.3"
  }

  metadata_startup_script = file("${path.module}/startup-scripts/vm2-services-startup.sh")

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }
}

# VM3: Database (Private)
resource "google_compute_instance" "database" {
  name         = "quetxal-database-vm"
  machine_type = var.vm_machine_type
  zone         = var.gcp_zone
  tags         = var.tags

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = 50  # More space for databases
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = "10.128.0.4"
  }

  metadata_startup_script = file("${path.module}/startup-scripts/vm3-database-startup.sh")

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }
}

# ============================================
# SERVICE ACCOUNT FOR VMs
# ============================================

resource "google_service_account" "vm_sa" {
  account_id   = "quetxal-vm-sa"
  display_name = "Quetxal TV VM Service Account"
}

# Grant roles for accessing GCR (Container Registry)
resource "google_project_iam_member" "vm_storage_admin" {
  project = var.gcp_project_id
  role    = "roles/storage.admin"
  member  = "serviceAccount:${google_service_account.vm_sa.email}"
}

# ============================================
# DATA SOURCES
# ============================================

data "google_compute_image" "ubuntu" {
  family  = var.image_family
  project = var.image_project
}
