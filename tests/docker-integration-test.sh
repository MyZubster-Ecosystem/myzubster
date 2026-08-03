#!/bin/bash
# ============================================================
# MyZubster Docker Integration Test Script
# Validates Docker setup and runs comprehensive health checks
# ============================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
TIMEOUT=120  # seconds to wait for services

# Helper functions
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

# Check if Docker is running
check_docker() {
    log_info "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    log_success "Docker is running"
}

# Check if docker compose is available
check_compose() {
    log_info "Checking docker compose..."
    if ! docker compose version > /dev/null 2>&1; then
        log_error "docker compose is not available."
        exit 1
    fi
    log_success "docker compose is available"
}

# Validate compose file
validate_compose() {
    log_info "Validating docker-compose.yml..."
    if docker compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
        log_success "docker-compose.yml is valid"
    else
        log_error "docker-compose.yml is invalid"
        docker compose -f "$COMPOSE_FILE" config
        exit 1
    fi
}

# Check .env file
check_env() {
    log_info "Checking .env file..."
    if [ ! -f "$ENV_FILE" ]; then
        if [ -f ".env.docker" ]; then
            log_warning ".env file not found, copying from .env.docker"
            cp .env.docker .env
        else
            log_error ".env file not found and .env.docker is missing"
            exit 1
        fi
    fi
    log_success ".env file exists"
}

# Start services
start_services() {
    log_info "Starting services..."
    docker compose -f "$COMPOSE_FILE" up -d --build
    log_info "Waiting for services to start (timeout: ${TIMEOUT}s)..."
    
    # Wait for health checks
    local start_time=$(date +%s)
    while true; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -ge $TIMEOUT ]; then
            log_error "Timeout waiting for services to start"
            docker compose -f "$COMPOSE_FILE" ps
            docker compose -f "$COMPOSE_FILE" logs
            exit 1
        fi
        
        # Check if all services are healthy
        local all_healthy=true
        for service in mongodb backend frontend gateway marketplace ai-automation; do
            local health=$(docker inspect --format='{{.State.Health.Status}}' "myzubster-${service}" 2>/dev/null || echo "not_found")
            if [ "$health" != "healthy" ]; then
                all_healthy=false
                break
            fi
        done
        
        if [ "$all_healthy" = true ]; then
            log_success "All services are healthy"
            break
        fi
        
        sleep 5
    done
}

# Test health endpoints
test_health_endpoints() {
    log_info "Testing health endpoints..."
    
    local failed=0
    
    # Backend
    log_info "Testing backend health..."
    if curl -sf http://localhost:3009/api/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        failed=$((failed + 1))
    fi
    
    # Frontend
    log_info "Testing frontend health..."
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        failed=$((failed + 1))
    fi
    
    # Gateway
    log_info "Testing gateway health..."
    if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
        log_success "Gateway health check passed"
    else
        log_error "Gateway health check failed"
        failed=$((failed + 1))
    fi
    
    # Marketplace
    log_info "Testing marketplace health..."
    if curl -sf http://localhost:4000/api/health > /dev/null 2>&1; then
        log_success "Marketplace health check passed"
    else
        log_error "Marketplace health check failed"
        failed=$((failed + 1))
    fi
    
    # AI Automation
    log_info "Testing AI automation health..."
    if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
        log_success "AI automation health check passed"
    else
        log_error "AI automation health check failed"
        failed=$((failed + 1))
    fi
    
    # MongoDB
    log_info "Testing MongoDB health..."
    if docker exec myzubster-mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
        log_success "MongoDB health check passed"
    else
        log_error "MongoDB health check failed"
        failed=$((failed + 1))
    fi
    
    return $failed
}

# Test data persistence
test_data_persistence() {
    log_info "Testing data persistence..."
    
    # Create a test document in MongoDB
    log_info "Creating test document in MongoDB..."
    docker exec myzubster-mongodb mongosh -u myzubster -p changeme_in_production --authenticationDatabase admin --eval "
        use myzubster;
        db.testcollection.insertOne({test: 'persistence', timestamp: new Date()});
    " > /dev/null 2>&1
    
    # Restart MongoDB container
    log_info "Restarting MongoDB container..."
    docker compose -f "$COMPOSE_FILE" restart mongodb
    sleep 10
    
    # Verify document persists
    log_info "Verifying document persistence..."
    if docker exec myzubster-mongodb mongosh -u myzubster -p changeme_in_production --authenticationDatabase admin --eval "
        use myzubster;
        var result = db.testcollection.findOne({test: 'persistence'});
        if (result) { print('Document found'); } else { print('Document not found'); }
    " | grep -q "Document found"; then
        log_success "Data persistence test passed"
        return 0
    else
        log_error "Data persistence test failed"
        return 1
    fi
}

# Collect logs
collect_logs() {
    log_info "Collecting logs..."
    mkdir -p docker-logs
    
    for service in mongodb backend frontend gateway marketplace ai-automation; do
        docker compose -f "$COMPOSE_FILE" logs "$service" > "docker-logs/${service}.log" 2>&1
    done
    
    docker compose -f "$COMPOSE_FILE" ps > docker-logs/services-status.txt
    
    log_success "Logs collected in docker-logs/ directory"
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."
    docker compose -f "$COMPOSE_FILE" down -v --remove-orphans
    log_success "Cleanup complete"
}

# Main execution
main() {
    log_info "Starting MyZubster Docker Integration Tests"
    echo "=============================================="
    
    check_docker
    check_compose
    validate_compose
    check_env
    
    start_services
    
    local health_result=0
    test_health_endpoints || health_result=$?
    
    test_data_persistence || true
    
    collect_logs
    
    cleanup
    
    echo "=============================================="
    if [ $health_result -eq 0 ]; then
        log_success "All integration tests passed!"
        exit 0
    else
        log_error "Some integration tests failed"
        exit 1
    fi
}

# Run main function
main
