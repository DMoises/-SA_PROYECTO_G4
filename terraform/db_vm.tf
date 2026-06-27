###############################################################################
# VM de Base de Datos — Persistencia AISLADA fuera de los Pods de K8s
#
# Instancia GCE dedicada que corre, vía Docker Compose, las 7 bases Postgres y
# Redis (las aprovisiona Ansible, tarea 8). Los datos viven en un disco
# persistente separado del disco de SO, garantizando integridad fuera del
# ciclo de vida efímero de los contenedores de aplicación del cluster.
###############################################################################

# IP interna estática: la consumen los microservicios de GKE vía ConfigMap.
resource "google_compute_address" "db_internal" {
  name         = "quetxal-db-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = google_compute_subnetwork.subnet.id
  address      = var.db_internal_ip
  region       = var.gcp_region
}

# Disco persistente dedicado para los volúmenes de las bases de datos.
resource "google_compute_disk" "db_data" {
  name = "quetxal-db-data"
  type = "pd-balanced"
  zone = var.gcp_zone
  size = var.db_data_disk_gb
}

resource "google_compute_instance" "database" {
  name         = "quetxal-database-vm"
  machine_type = var.db_machine_type
  zone         = var.gcp_zone
  tags         = concat(var.common_tags, ["quetxal-db"])

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = var.db_boot_disk_gb
    }
  }

  # Disco de datos persistente (independiente del SO).
  attached_disk {
    source      = google_compute_disk.db_data.id
    device_name = "db-data"
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = google_compute_address.db_internal.address

    # IP pública efímera SÓLO para que Ansible entre por SSH.
    dynamic "access_config" {
      for_each = var.db_vm_public_ip ? [1] : []
      content {}
    }
  }

  metadata = local.ssh_metadata

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  # El aprovisionamiento (Docker + compose de BD) lo hace Ansible, no un
  # startup-script: así la configuración es declarativa, idempotente y auditable.
  allow_stopping_for_update = true
}
