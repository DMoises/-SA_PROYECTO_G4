#!/bin/bash

##############################################################################
# Quetxal TV - GCP Deployment Script
# Este script maneja el despliegue completo en GCP usando Terraform
##############################################################################

set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
TERRAFORM_DIR="${PROJECT_ROOT}/terraform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi

    if ! command -v terraform &> /dev/null; then
        log_error "Terraform not found. Install from: https://www.terraform.io/downloads"
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        log_error "Git not found"
        exit 1
    fi

    log_success "All prerequisites met"
}

# Setup Terraform variables
setup_terraform_vars() {
    log_info "Setting up Terraform variables..."

    if [ ! -f "${TERRAFORM_DIR}/terraform.tfvars" ]; then
        if [ ! -f "${TERRAFORM_DIR}/terraform.tfvars.example" ]; then
            log_error "terraform.tfvars.example not found"
            exit 1
        fi

        log_warning "terraform.tfvars not found. Using template..."
        cp "${TERRAFORM_DIR}/terraform.tfvars.example" "${TERRAFORM_DIR}/terraform.tfvars"
        log_warning "Please edit terraform.tfvars with your GCP project details"
        exit 1
    fi

    log_success "terraform.tfvars configured"
}

# Initialize Terraform
init_terraform() {
    log_info "Initializing Terraform..."
    cd "${TERRAFORM_DIR}"
    terraform init
    log_success "Terraform initialized"
}

# Plan Terraform deployment
plan_terraform() {
    log_info "Planning Terraform deployment..."
    cd "${TERRAFORM_DIR}"
    terraform plan -out=tfplan
    log_success "Plan saved to tfplan"
}

# Apply Terraform deployment
apply_terraform() {
    log_info "Applying Terraform deployment..."
    cd "${TERRAFORM_DIR}"
    terraform apply tfplan
    log_success "Infrastructure deployed to GCP"
}

# Get outputs
get_outputs() {
    log_info "Retrieving infrastructure information..."
    cd "${TERRAFORM_DIR}"

    GATEWAY_IP=$(terraform output -raw gateway_public_ip 2>/dev/null || echo "")
    GATEWAY_INTERNAL=$(terraform output -raw gateway_internal_ip 2>/dev/null || echo "")
    SERVICES_INTERNAL=$(terraform output -raw services_internal_ip 2>/dev/null || echo "")
    DATABASE_INTERNAL=$(terraform output -raw database_internal_ip 2>/dev/null || echo "")

    log_success "Infrastructure outputs:"
    echo "  Gateway Public IP:     ${GATEWAY_IP}"
    echo "  Gateway Internal IP:   ${GATEWAY_INTERNAL}"
    echo "  Services Internal IP:  ${SERVICES_INTERNAL}"
    echo "  Database Internal IP:  ${DATABASE_INTERNAL}"

    # Save to .env if needed
    cat > "${PROJECT_ROOT}/.env.deployment" <<EOF
GATEWAY_IP=${GATEWAY_IP}
GATEWAY_INTERNAL=${GATEWAY_INTERNAL}
SERVICES_INTERNAL=${SERVICES_INTERNAL}
DATABASE_INTERNAL=${DATABASE_INTERNAL}
EOF

    log_success "Infrastructure info saved to .env.deployment"
}

# Setup initial SSH keys
setup_ssh() {
    log_info "Setting up SSH configuration..."

    if [ ! -d ~/.ssh ]; then
        mkdir -p ~/.ssh
        chmod 700 ~/.ssh
    fi

    cd "${TERRAFORM_DIR}"
    GATEWAY_IP=$(terraform output -raw gateway_public_ip 2>/dev/null || echo "")

    if [ -z "$GATEWAY_IP" ]; then
        log_warning "Could not retrieve Gateway IP"
        return
    fi

    log_info "Testing SSH connection to Gateway VM..."
    # This will add the host key to known_hosts
    ssh-keyscan -H "${GATEWAY_IP}" >> ~/.ssh/known_hosts 2>/dev/null || true

    log_success "SSH configuration ready"
}

# Display next steps
show_next_steps() {
    log_info "Deployment complete! Next steps:"
    echo ""
    echo "${YELLOW}1. SSH to Database VM and initialize containers:${NC}"
    echo "   gcloud compute ssh quetxal-database-vm --zone=us-central1-a"
    echo "   cd /home/ubuntu/quetxal && docker-compose -f docker-compose.database.yml up -d"
    echo ""
    echo "${YELLOW}2. SSH to Services VM:${NC}"
    echo "   gcloud compute ssh quetxal-services-vm --zone=us-central1-a"
    echo "   cd /home/ubuntu/quetxal && docker-compose -f docker-compose.services.yml up -d"
    echo ""
    echo "${YELLOW}3. SSH to Gateway VM:${NC}"
    echo "   gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a"
    echo "   cd /home/ubuntu/quetxal && docker-compose -f docker-compose.gateway.yml up -d"
    echo ""
    echo "${YELLOW}4. Test the deployment:${NC}"
    echo "   curl http://\$(terraform output -raw gateway_public_ip)"
    echo ""
}

# Main flow
main() {
    log_info "Starting Quetxal TV GCP Deployment"
    echo ""

    check_prerequisites
    setup_terraform_vars
    init_terraform

    # Ask user for confirmation
    log_info "Review the infrastructure plan before applying..."
    read -p "Do you want to continue with the deployment? (yes/no): " -r
    echo

    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        log_warning "Deployment cancelled"
        exit 0
    fi

    plan_terraform
    apply_terraform
    get_outputs
    setup_ssh
    show_next_steps

    log_success "Deployment initialized! Infrastructure is ready."
}

main "$@"
