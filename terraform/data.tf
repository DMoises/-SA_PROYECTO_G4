###############################################################################
# Data sources y locales compartidos
###############################################################################

data "google_compute_image" "ubuntu" {
  family  = var.image_family
  project = var.image_project
}

locals {
  # Llave pública SSH inyectada en las VMs para que Ansible se conecte.
  # Si la ruta no existe, queda vacío (podrás usar OS Login / IAP en su lugar).
  ssh_public_key = try(file(pathexpand(var.ssh_public_key_path)), "")
  ssh_metadata   = local.ssh_public_key != "" ? { "ssh-keys" = "${var.ssh_user}:${local.ssh_public_key}" } : {}
}
