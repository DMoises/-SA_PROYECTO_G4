###############################################################################
# Outputs + generación del inventario de Ansible
###############################################################################

# ---------------------------------------------------------------------------
# Red
# ---------------------------------------------------------------------------
output "vpc_name" {
  description = "Nombre de la VPC"
  value       = google_compute_network.vpc.name
}

output "subnet_name" {
  description = "Nombre de la subred"
  value       = google_compute_subnetwork.subnet.name
}

# ---------------------------------------------------------------------------
# GKE
# ---------------------------------------------------------------------------
output "gke_cluster_name" {
  description = "Nombre del cluster de GKE"
  value       = google_container_cluster.primary.name
}

output "gke_endpoint" {
  description = "Endpoint del plano de control de GKE"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "gke_get_credentials" {
  description = "Comando para configurar kubectl"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --zone ${var.gcp_zone} --project ${var.gcp_project_id}"
}

# ---------------------------------------------------------------------------
# VM de Base de Datos
# ---------------------------------------------------------------------------
output "db_internal_ip" {
  description = "IP interna de la VM de BD (usar en el ConfigMap de K8s como *_DB_HOST)"
  value       = google_compute_instance.database.network_interface[0].network_ip
}

output "db_public_ip" {
  description = "IP pública de la VM de BD (SSH/Ansible)"
  value       = try(google_compute_instance.database.network_interface[0].access_config[0].nat_ip, "(sin IP pública)")
}

output "ssh_database" {
  description = "Comando SSH a la VM de BD"
  value       = "gcloud compute ssh quetxal-database-vm --zone=${var.gcp_zone} --project=${var.gcp_project_id}"
}

# ---------------------------------------------------------------------------
# VMs de desarrollo
# ---------------------------------------------------------------------------
output "dev_gateway_public_ip" {
  description = "IP pública de la VM gateway de desarrollo"
  value       = var.enable_dev_vms ? try(google_compute_instance.dev_gateway[0].network_interface[0].access_config[0].nat_ip, "") : "(dev vms deshabilitadas)"
}

output "dev_services_internal_ip" {
  description = "IP interna de la VM de servicios de desarrollo"
  value       = var.enable_dev_vms ? google_compute_instance.dev_services[0].network_interface[0].network_ip : "(dev vms deshabilitadas)"
}

# ---------------------------------------------------------------------------
# Inventario de Ansible (se escribe en ansible/inventory/hosts.gen.ini)
# ---------------------------------------------------------------------------
resource "local_file" "ansible_inventory" {
  filename = "${path.module}/../ansible/inventory/hosts.gen.ini"
  content = templatefile("${path.module}/templates/inventory.ini.tpl", {
    ssh_user       = var.ssh_user
    db_internal_ip = google_compute_instance.database.network_interface[0].network_ip
    db_host        = try(google_compute_instance.database.network_interface[0].access_config[0].nat_ip, google_compute_instance.database.network_interface[0].network_ip)
    enable_dev     = var.enable_dev_vms
    gateway_host   = var.enable_dev_vms ? try(google_compute_instance.dev_gateway[0].network_interface[0].access_config[0].nat_ip, "") : ""
    services_host  = var.enable_dev_vms ? google_compute_instance.dev_services[0].network_interface[0].network_ip : ""
  })
}
