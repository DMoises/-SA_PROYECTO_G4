###############################################################################
# Publicación de las IPs provisionadas a GitHub Actions Secrets
#
# Los workflows de deploy a las VMs (deploy-gateway/services/database, backup)
# entran por SSH usando secrets.GATEWAY_VM_IP / SERVICES_VM_IP / DATABASE_VM_IP.
# La IP PÚBLICA del gateway es EFÍMERA: tras un destroy/recreate cambia y esos
# Secrets quedan obsoletos. Este recurso los republica con `gh secret set` en
# cada apply, de modo que el CI sigue funcionando sin tocar nada a mano.
#
# Opt-in (publish_ips_to_github = true) porque requiere `gh` autenticado con
# permiso de admin en el repo, en la máquina donde corre `terraform apply`.
# En CI o sin gh, déjalo en false (default) y este recurso no se crea.
#
# La IP pública del Ingress de GKE NO se publica aquí: Kubernetes la asigna al
# desplegar (Terraform no la conoce) y el smoke test la descubre en vivo del cluster.
###############################################################################

resource "null_resource" "publish_vm_ips_to_github" {
  count = var.enable_dev_vms && var.publish_ips_to_github ? 1 : 0

  # Re-publica cuando cambie cualquiera de las IPs (o el repo destino).
  triggers = {
    gateway_ip  = google_compute_instance.dev_gateway[0].network_interface[0].access_config[0].nat_ip
    services_ip = google_compute_address.dev_services_internal[0].address
    database_ip = google_compute_address.db_internal.address
    repo        = var.github_repo
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = <<-EOT
      set -euo pipefail
      echo "Publicando IPs de las VMs a GitHub Secrets (${self.triggers.repo})..."
      gh secret set GATEWAY_VM_IP  --repo "${self.triggers.repo}" --body "${self.triggers.gateway_ip}"
      gh secret set SERVICES_VM_IP --repo "${self.triggers.repo}" --body "${self.triggers.services_ip}"
      gh secret set DATABASE_VM_IP --repo "${self.triggers.repo}" --body "${self.triggers.database_ip}"
      echo "✅ Publicado: GATEWAY_VM_IP=${self.triggers.gateway_ip} | SERVICES_VM_IP=${self.triggers.services_ip} | DATABASE_VM_IP=${self.triggers.database_ip}"
    EOT
  }
}
