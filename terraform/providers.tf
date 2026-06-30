###############################################################################
# Quetxal TV — Fase 3 · Infraestructura como Código (Terraform)
# Proveedores y versiones.
#
# Autenticación: por Application Default Credentials (ADC). Antes de `terraform
# apply` ejecuta:  gcloud auth application-default login
# No se usan llaves JSON estáticas (cumple la política de no hardcodear credenciales).
###############################################################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }

  # Backend remoto en GCS: estado compartido y versionado (bucket con Object
  # Versioning ON). Permite que GitHub Actions corra terraform sin depender del
  # tfstate local de una sola máquina. El nombre del bucket no admite variables
  # (restricción de Terraform), por eso va literal.
  backend "gcs" {
    bucket = "quetxal-tv-498705-tfstate"
    prefix = "fase3/infra"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone    = var.gcp_zone
}
