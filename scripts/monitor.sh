#!/bin/bash

##############################################################################
# Quetxal TV - Monitoring Script
# Conecta a las VMs y muestra información de los servicios
##############################################################################

set -e

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")
TERRAFORM_DIR="${PROJECT_ROOT}/terraform"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Get infrastructure info
get_infrastructure_info() {
    cd "${TERRAFORM_DIR}"

    GW_IP=$(terraform output -raw gateway_public_ip 2>/dev/null || echo "")
    GW_INTERNAL=$(terraform output -raw gateway_internal_ip 2>/dev/null || echo "")
    SVC_INTERNAL=$(terraform output -raw services_internal_ip 2>/dev/null || echo "")
    DB_INTERNAL=$(terraform output -raw database_internal_ip 2>/dev/null || echo "")

    if [ -z "$GW_IP" ]; then
        echo -e "${RED}error: Could not retrieve infrastructure information${NC}"
        exit 1
    fi

    log_success "Infrastructure information retrieved"
}

# Monitor Gateway
monitor_gateway() {
    log_info "Monitoring Gateway VM (${GW_IP})..."
    echo ""

    echo "=== Gateway Container Status ==="
    gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a --command="docker-compose -f /home/ubuntu/quetxal/docker-compose.gateway.yml ps" || true
    echo ""

    echo "=== Gateway Logs (last 30 lines) ==="
    gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a --command="docker-compose -f /home/ubuntu/quetxal/docker-compose.gateway.yml logs --tail=30" || true
    echo ""

    echo "=== Gateway Resource Usage ==="
    gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a --command="docker ps --format='table {{.Names}}\t{{.CPUPerc}}\t{{.MemUsage}}'" || true
}

# Monitor Services
monitor_services() {
    log_info "Monitoring Services VM (${SVC_INTERNAL})..."
    echo ""

    echo "=== Services Container Status ==="
    gcloud compute ssh quetxal-services-vm --zone=us-central1-a --command="docker-compose -f /home/ubuntu/quetxal/docker-compose.services.yml ps" || true
    echo ""

    echo "=== Services Logs (last 30 lines) ==="
    gcloud compute ssh quetxal-services-vm --zone=us-central1-a --command="docker-compose -f /home/ubuntu/quetxal/docker-compose.services.yml logs --tail=30" || true
    echo ""

    echo "=== Services Resource Usage ==="
    gcloud compute ssh quetxal-services-vm --zone=us-central1-a --command="docker stats --no-stream --format='table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}'" || true
}

# Monitor Database
monitor_database() {
    log_info "Monitoring Database VM (${DB_INTERNAL})..."
    echo ""

    echo "=== Database Container Status ==="
    gcloud compute ssh quetxal-database-vm --zone=us-central1-a --command="docker-compose -f /home/ubuntu/quetxal/docker-compose.database.yml ps" || true
    echo ""

    echo "=== Database Health Check ==="
    gcloud compute ssh quetxal-database-vm --zone=us-central1-a --command="bash /home/ubuntu/quetxal/scripts/health-check.sh" || true
    echo ""

    echo "=== Database Resource Usage ==="
    gcloud compute ssh quetxal-database-vm --zone=us-central1-a --command="docker stats --no-stream --format='table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}'" || true
}

# System Health
show_system_health() {
    log_info "System Health Summary"
    echo ""

    echo "=== Gateway VM Health ==="
    gcloud compute ssh quetxal-gateway-vm --zone=us-central1-a --command="free -h && echo '---' && df -h" || true

    echo ""
    echo "=== Services VM Health ==="
    gcloud compute ssh quetxal-services-vm --zone=us-central1-a --command="free -h && echo '---' && df -h" || true

    echo ""
    echo "=== Database VM Health ==="
    gcloud compute ssh quetxal-database-vm --zone=us-central1-a --command="free -h && echo '---' && df -h" || true
}

# Main menu
show_menu() {
    echo ""
    echo "=== Quetxal TV Monitoring ==="
    echo "1. Monitor Gateway VM"
    echo "2. Monitor Services VM"
    echo "3. Monitor Database VM"
    echo "4. Show System Health"
    echo "5. Tail Gateway Logs (live)"
    echo "6. Tail Services Logs (live)"
    echo "7. Tail Database Logs (live)"
    echo "8. Exit"
    echo ""
    read -p "Select option: " -r choice
}

# Tail logs
tail_logs() {
    local vm=$1
    local compose_file=$2
    local description=$3

    log_info "Tailing logs from ${description}..."
    gcloud compute ssh "${vm}" --zone=us-central1-a --command="docker-compose -f /home/ubuntu/quetxal/${compose_file} logs -f --tail=20"
}

# Main
main() {
    get_infrastructure_info

    while true; do
        show_menu

        case $choice in
            1)
                monitor_gateway
                ;;
            2)
                monitor_services
                ;;
            3)
                monitor_database
                ;;
            4)
                show_system_health
                ;;
            5)
                tail_logs "quetxal-gateway-vm" "docker-compose.gateway.yml" "Gateway"
                ;;
            6)
                tail_logs "quetxal-services-vm" "docker-compose.services.yml" "Services"
                ;;
            7)
                tail_logs "quetxal-database-vm" "docker-compose.database.yml" "Database"
                ;;
            8)
                log_success "Exiting monitoring"
                exit 0
                ;;
            *)
                echo "Invalid option"
                ;;
        esac
    done
}

main "$@"
