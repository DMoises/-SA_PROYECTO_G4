output "gateway_public_ip" {
  description = "Public IP of Gateway VM"
  value       = google_compute_instance.gateway.network_interface[0].access_config[0].nat_ip
}

output "gateway_internal_ip" {
  description = "Internal IP of Gateway VM"
  value       = google_compute_instance.gateway.network_interface[0].network_ip
}

output "services_internal_ip" {
  description = "Internal IP of Services VM"
  value       = google_compute_instance.services.network_interface[0].network_ip
}

output "database_internal_ip" {
  description = "Internal IP of Database VM"
  value       = google_compute_instance.database.network_interface[0].network_ip
}

output "ssh_gateway" {
  description = "Command to SSH to Gateway VM"
  value       = "gcloud compute ssh ${google_compute_instance.gateway.name} --zone=${var.gcp_zone}"
}

output "ssh_services" {
  description = "Command to SSH to Services VM"
  value       = "gcloud compute ssh ${google_compute_instance.services.name} --zone=${var.gcp_zone}"
}

output "ssh_database" {
  description = "Command to SSH to Database VM"
  value       = "gcloud compute ssh ${google_compute_instance.database.name} --zone=${var.gcp_zone}"
}

output "deployment_info" {
  description = "Deployment configuration info"
  value = {
    vpc_network     = google_compute_network.vpc.name
    subnet          = google_compute_subnetwork.subnet.name
    gateway_url     = "http://${google_compute_instance.gateway.network_interface[0].access_config[0].nat_ip}"
    services_host   = google_compute_instance.services.network_interface[0].network_ip
    database_host   = google_compute_instance.database.network_interface[0].network_ip
    region          = var.gcp_region
    zone            = var.gcp_zone
  }
}

output "next_steps" {
  description = "Next steps after infrastructure creation"
  value = <<-EOT
    1. Wait 2-3 minutes for VMs to initialize and install Docker

    2. SSH to Database VM and start containers:
       ${local.ssh_database}
       cd /home/ubuntu/quetxal && docker-compose -f docker-compose.database.yml up -d

    3. SSH to Services VM and start microservices:
       ${local.ssh_services}
       cd /home/ubuntu/quetxal && docker-compose -f docker-compose.services.yml up -d

    4. SSH to Gateway VM and start API Gateway:
       ${local.ssh_gateway}
       cd /home/ubuntu/quetxal && docker-compose -f docker-compose.gateway.yml up -d

    5. Test connectivity:
       curl http://${google_compute_instance.gateway.network_interface[0].access_config[0].nat_ip}

    6. View logs:
       docker-compose logs -f <service-name>
  EOT
}

locals {
  ssh_gateway  = "gcloud compute ssh ${google_compute_instance.gateway.name} --zone=${var.gcp_zone}"
  ssh_services = "gcloud compute ssh ${google_compute_instance.services.name} --zone=${var.gcp_zone}"
  ssh_database = "gcloud compute ssh ${google_compute_instance.database.name} --zone=${var.gcp_zone}"
}
