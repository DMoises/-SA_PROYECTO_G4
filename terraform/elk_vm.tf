###############################################################################
# VM de ELK — Observabilidad de LOGS (Elasticsearch + Logstash + Kibana)
#
# Instancia GCE dedicada (Elasticsearch es muy pesado para los nodos de GKE).
# PRIVADA (sin IP pública): Ansible y Kibana entran vía ProxyJump por el gateway,
# igual que la VM de servicios. La aprovisiona Ansible (docker-compose.elk.yml).
# Recibe logs de los Filebeat del cluster y de las VMs en Logstash:5044.
# El firewall interno de la VPC (allow_internal) ya permite ese tráfico.
###############################################################################

# IP interna estática: la usan los Beats (cluster + VMs) para enviar logs a Logstash.
resource "google_compute_address" "elk_internal" {
  count        = var.enable_elk_vm ? 1 : 0
  name         = "quetxal-elk-internal-ip"
  address_type = "INTERNAL"
  subnetwork   = google_compute_subnetwork.subnet.id
  address      = var.elk_internal_ip
  region       = var.gcp_region
}

# Disco persistente dedicado para los índices de Elasticsearch.
resource "google_compute_disk" "elk_data" {
  count = var.enable_elk_vm ? 1 : 0
  name  = "quetxal-elk-data"
  type  = "pd-balanced"
  zone  = var.gcp_zone
  size  = var.elk_data_disk_gb
}

resource "google_compute_instance" "elk" {
  count        = var.enable_elk_vm ? 1 : 0
  name         = "quetxal-elk-vm"
  machine_type = var.elk_machine_type
  zone         = var.gcp_zone
  tags         = concat(var.common_tags, ["quetxal-elk"])

  boot_disk {
    initialize_params {
      image = data.google_compute_image.ubuntu.self_link
      size  = 30
    }
  }

  # Disco de datos persistente para Elasticsearch (independiente del SO).
  attached_disk {
    source      = google_compute_disk.elk_data[0].id
    device_name = "elk-data"
  }

  # PRIVADA: sin access_config => sin IP pública (egreso por Cloud NAT, SSH por gateway).
  network_interface {
    subnetwork = google_compute_subnetwork.subnet.id
    network_ip = google_compute_address.elk_internal[0].address
  }

  metadata = local.ssh_metadata

  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["cloud-platform"]
  }

  allow_stopping_for_update = true
}
