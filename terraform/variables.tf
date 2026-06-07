variable "gcp_project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "gcp_region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

variable "gcp_zone" {
  description = "Google Cloud Zone"
  type        = string
  default     = "us-central1-a"
}

variable "credentials_path" {
  description = "Path to GCP Service Account JSON credentials file"
  type        = string
  sensitive   = true
}

variable "vm_machine_type" {
  description = "Machine type for VMs"
  type        = string
  default     = "e2-small"
}

variable "image_family" {
  description = "Image family for VMs (Ubuntu LTS)"
  type        = string
  default     = "ubuntu-2204-lts"
}

variable "image_project" {
  description = "Project where image is located"
  type        = string
  default     = "ubuntu-os-cloud"
}

variable "network_name" {
  description = "VPC Network name"
  type        = string
  default     = "quetxal-vpc"
}

variable "subnet_name" {
  description = "Subnet name"
  type        = string
  default     = "quetxal-subnet"
}

variable "subnet_cidr" {
  description = "Subnet CIDR range"
  type        = string
  default     = "10.128.0.0/28"
}

variable "enable_nat" {
  description = "Enable Cloud NAT for private VMs"
  type        = bool
  default     = true
}

variable "ssh_user" {
  description = "SSH user for Ubuntu images"
  type        = string
  default     = "ubuntu"
}

variable "tags" {
  description = "Tags for resources"
  type        = list(string)
  default     = ["quetxal", "docker"]
}
