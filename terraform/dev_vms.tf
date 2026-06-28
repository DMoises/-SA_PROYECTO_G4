###############################################################################
# VMs de desarrollo (flujo develop -> Google Compute Engine)
#
# Gated por var.enable_dev_vms. Reproducen el entorno de la Fase 2: una VM
# gateway en la DMZ (con IP pública) y una VM de servicios privada (egreso por
# Cloud NAT). Las aprovisiona Ansible (tarea 8).
###############################################################################

resource "google_compute_address" "dev_gateway_internal" {
  count        = var.enable_dev_vms ? 1 : 0
  name         = "quetxal-dev-gateway-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = google_compute_subnetwork.subnet.id
  address      = var.dev_gateway_internal_ip
  region       = var.gcp_region
}

resource "google_compute_address" "dev_services_internal" {
  count        = var.enable_dev_vms ? 1 : 0
  name         = "quetxal-dev-services-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = google_compute_subnetwork.subnet.id
  address      = var.dev_services_internal_ip
  region       = var.gcp_region
}

# VM Gateway (DMZ) — con IP pública.
resource "google_compute_instance" "dev_gateway" {
  count        = var.enable_dev_vms ? 1 : 0
  name         = "quetxal-dev-gateway-vm"
  machine_type = var.dev_vm_machine_type
  zone         = var.gcp_zone
  tags         = concat(var.common_tags, ["quetxal-gateway"])

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = 30
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = google_compute_address.dev_gateway_internal[0].address
    access_config {} # IP pública efímera
  }

  metadata = local.ssh_metadata

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true
}

# VM de Servicios — privada (egreso por NAT). SSH de Ansible vía gateway/IAP.
resource "google_compute_instance" "dev_services" {
  count        = var.enable_dev_vms ? 1 : 0
  name         = "quetxal-dev-services-vm"
  machine_type = var.dev_vm_machine_type
  zone         = var.gcp_zone
  tags         = var.common_tags

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = 30
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = google_compute_address.dev_services_internal[0].address
  }

  metadata = local.ssh_metadata

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true
}
