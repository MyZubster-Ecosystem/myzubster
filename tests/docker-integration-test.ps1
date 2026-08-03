# ============================================================
# MyZubster Docker Integration Test Script (PowerShell)
# Validates Docker setup and runs comprehensive health checks
# ============================================================

param(
    [int]$Timeout = 120
)

$ErrorActionPreference = "Stop"

# Configuration
$ComposeFile = "docker-compose.yml"
$EnvFile = ".env"

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is running
function Test-Docker {
    Write-Info "Checking Docker..."
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop."
        return $false
    }
}

# Check if docker compose is available
function Test-Compose {
    Write-Info "Checking docker compose..."
    try {
        docker compose version | Out-Null
        Write-Success "docker compose is available"
        return $true
    }
    catch {
        Write-Error "docker compose is not available."
        return $false
    }
}

# Validate compose file
function Test-ComposeFile {
    Write-Info "Validating docker-compose.yml..."
    try {
        $result = docker compose -f $ComposeFile config 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "docker-compose.yml is valid"
            return $true
        }
        else {
            Write-Error "docker-compose.yml is invalid: $result"
            return $false
        }
    }
    catch {
        Write-Error "Failed to validate docker-compose.yml"
        return $false
    }
}

# Check .env file
function Test-EnvFile {
    Write-Info "Checking .env file..."
    if (-not (Test-Path $EnvFile)) {
        if (Test-Path ".env.docker") {
            Write-Warning ".env file not found, copying from .env.docker"
            Copy-Item ".env.docker" $EnvFile
        }
        else {
            Write-Error ".env file not found and .env.docker is missing"
            return $false
        }
    }
    Write-Success ".env file exists"
    return $true
}

# Start services
function Start-Services {
    Write-Info "Starting services..."
    docker compose -f $ComposeFile up -d --build
    Write-Info "Waiting for services to start (timeout: ${Timeout}s)..."
    
    $startTime = Get-Date
    while ($true) {
        $elapsed = ((Get-Date) - $startTime).TotalSeconds
        if ($elapsed -ge $Timeout) {
            Write-Error "Timeout waiting for services to start"
            docker compose -f $ComposeFile ps
            docker compose -f $ComposeFile logs
            return $false
        }
        
        # Check if all services are healthy
        $allHealthy = $true
        $services = @("mongodb", "backend", "frontend", "gateway", "marketplace", "ai-automation")
        foreach ($service in $services) {
            $containerName = "myzubster-$service"
            try {
                $health = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null
                if ($health -ne "healthy") {
                    $allHealthy = $false
                    break
                }
            }
            catch {
                $allHealthy = $false
                break
            }
        }
        
        if ($allHealthy) {
            Write-Success "All services are healthy"
            return $true
        }
        
        Start-Sleep -Seconds 5
    }
}

# Test health endpoints
function Test-HealthEndpoints {
    Write-Info "Testing health endpoints..."
    
    $failed = 0
    
    # Backend
    Write-Info "Testing backend health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3009/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend health check passed"
        }
        else {
            Write-Error "Backend health check failed with status code: $($response.StatusCode)"
            $failed++
        }
    }
    catch {
        Write-Error "Backend health check failed: $_"
        $failed++
    }
    
    # Frontend
    Write-Info "Testing frontend health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend health check passed"
        }
        else {
            Write-Error "Frontend health check failed with status code: $($response.StatusCode)"
            $failed++
        }
    }
    catch {
        Write-Error "Frontend health check failed: $_"
        $failed++
    }
    
    # Gateway
    Write-Info "Testing gateway health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Gateway health check passed"
        }
        else {
            Write-Error "Gateway health check failed with status code: $($response.StatusCode)"
            $failed++
        }
    }
    catch {
        Write-Error "Gateway health check failed: $_"
        $failed++
    }
    
    # Marketplace
    Write-Info "Testing marketplace health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Marketplace health check passed"
        }
        else {
            Write-Error "Marketplace health check failed with status code: $($response.StatusCode)"
            $failed++
        }
    }
    catch {
        Write-Error "Marketplace health check failed: $_"
        $failed++
    }
    
    # AI Automation
    Write-Info "Testing AI automation health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "AI automation health check passed"
        }
        else {
            Write-Error "AI automation health check failed with status code: $($response.StatusCode)"
            $failed++
        }
    }
    catch {
        Write-Error "AI automation health check failed: $_"
        $failed++
    }
    
    # MongoDB
    Write-Info "Testing MongoDB health..."
    try {
        $result = docker exec myzubster-mongodb mongosh --eval "db.runCommand('ping')" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "MongoDB health check passed"
        }
        else {
            Write-Error "MongoDB health check failed"
            $failed++
        }
    }
    catch {
        Write-Error "MongoDB health check failed: $_"
        $failed++
    }
    
    return $failed
}

# Test data persistence
function Test-DataPersistence {
    Write-Info "Testing data persistence..."
    
    # Create a test document in MongoDB
    Write-Info "Creating test document in MongoDB..."
    docker exec myzubster-mongodb mongosh -u myzubster -p changeme_in_production --authenticationDatabase admin --eval "
        use myzubster;
        db.testcollection.insertOne({test: 'persistence', timestamp: new Date()});
    " 2>$null
    
    # Restart MongoDB container
    Write-Info "Restarting MongoDB container..."
    docker compose -f $ComposeFile restart mongodb
    Start-Sleep -Seconds 10
    
    # Verify document persists
    Write-Info "Verifying document persistence..."
    try {
        $result = docker exec myzubster-mongodb mongosh -u myzubster -p changeme_in_production --authenticationDatabase admin --eval "
            use myzubster;
            var result = db.testcollection.findOne({test: 'persistence'});
            if (result) { print('Document found'); } else { print('Document not found'); }
        " 2>$null
        
        if ($result -match "Document found") {
            Write-Success "Data persistence test passed"
            return $true
        }
        else {
            Write-Error "Data persistence test failed"
            return $false
        }
    }
    catch {
        Write-Error "Data persistence test failed: $_"
        return $false
    }
}

# Collect logs
function Get-Logs {
    Write-Info "Collecting logs..."
    New-Item -ItemType Directory -Force -Path "docker-logs" | Out-Null
    
    $services = @("mongodb", "backend", "frontend", "gateway", "marketplace", "ai-automation")
    foreach ($service in $services) {
        docker compose -f $ComposeFile logs $service | Out-File "docker-logs\$service.log"
    }
    
    docker compose -f $ComposeFile ps | Out-File "docker-logs\services-status.txt"
    
    Write-Success "Logs collected in docker-logs/ directory"
}

# Cleanup
function Stop-Services {
    Write-Info "Cleaning up..."
    docker compose -f $ComposeFile down -v --remove-orphans
    Write-Success "Cleanup complete"
}

# Main execution
function Main {
    Write-Info "Starting MyZubster Docker Integration Tests"
    Write-Host "=============================================="
    
    if (-not (Test-Docker)) { exit 1 }
    if (-not (Test-Compose)) { exit 1 }
    if (-not (Test-ComposeFile)) { exit 1 }
    if (-not (Test-EnvFile)) { exit 1 }
    
    if (-not (Start-Services)) { exit 1 }
    
    $healthResult = Test-HealthEndpoints
    
    Test-DataPersistence | Out-Null
    
    Get-Logs
    
    Stop-Services
    
    Write-Host "=============================================="
    if ($healthResult -eq 0) {
        Write-Success "All integration tests passed!"
        exit 0
    }
    else {
        Write-Error "Some integration tests failed"
        exit 1
    }
}

# Run main function
Main
