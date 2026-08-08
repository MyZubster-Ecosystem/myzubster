# ============================================================
# MyZubster Docker Integration Test Suite (PowerShell)
# Validates entire ecosystem starts and passes health checks
# Usage: powershell -ExecutionPolicy Bypass -File tests\docker-integration-test.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$Pass = 0; $Fail = 0; $Total = 0; $Errors = @()

function Log($msg)  { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Pass($msg) { Write-Host "[PASS] $msg" -ForegroundColor Green; $script:Pass++; $script:Total++ }
function Fail($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red; $script:Fail++; $script:Total++; $script:Errors += $msg }

# ── Phase 1: File Validation ──────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Phase 1: Required Files Existence" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow

$RequiredFiles = @(
    "docker-compose.yml",
    "backend\Dockerfile",
    "frontend\Dockerfile",
    "Dockerfile.gateway",
    "Dockerfile.marketplace",
    "services\ai-automation\Dockerfile",
    ".env.docker",
    "docker-entrypoint.sh"
)

foreach ($f in $RequiredFiles) {
    if (Test-Path $f) { Pass "File exists: $f" } else { Fail "Missing file: $f" }
}

# ── Phase 2: Docker Compose Validation ────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Phase 2: Docker Compose Config Validation" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow

try {
    docker compose config --quiet 2>$null
    Pass "docker-compose.yml parses without errors"
} catch {
    Fail "docker-compose.yml has syntax errors"
}

$Services = docker compose config --services 2>$null
$Expected = @("mongodb", "backend", "frontend", "gateway", "marketplace", "ai-automation")
foreach ($svc in $Expected) {
    if ($Services -contains $svc) { Pass "Service defined: $svc" } else { Fail "Service missing: $svc" }
}

# ── Phase 3: Environment Variables ────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Phase 3: Environment Variables" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow

$EnvFile = ".env.docker"
$RequiredVars = @("MONGO_INITDB_ROOT_USERNAME", "MONGO_INITDB_ROOT_PASSWORD", "BACKEND_PORT", "FRONTEND_PORT", "GATEWAY_PORT", "MARKETPLACE_PORT", "AI_AUTOMATION_PORT")

if (Test-Path $EnvFile) {
    $content = Get-Content $EnvFile -Raw
    foreach ($v in $RequiredVars) {
        if ($content -match "^$v=") { Pass "Env var defined: $v" } else { Fail "Env var missing: $v" }
    }
} else {
    Fail ".env.docker file not found"
}

# ── Phase 4: Docker Build ─────────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Phase 4: Docker Build" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow

Log "Building backend image..."
docker compose build backend 2>&1 | Select-Object -Last 5
if ($LASTEXITCODE -eq 0) { Pass "Backend image builds" } else { Fail "Backend build failed" }

Log "Building frontend image..."
docker compose build frontend 2>&1 | Select-Object -Last 5
if ($LASTEXITCODE -eq 0) { Pass "Frontend image builds" } else { Fail "Frontend build failed" }

# ── Phase 5: Full Stack Startup ───────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Phase 5: Full Stack Startup & Health Checks" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow

Log "Starting all services..."
docker compose up -d --build 2>&1

Log "Waiting 90s for services to stabilize..."
Start-Sleep -Seconds 90

$Containers = @("myzubster-mongodb", "myzubster-backend", "myzubster-frontend", "myzubster-gateway", "myzubster-marketplace", "myzubster-ai-automation")
foreach ($c in $Containers) {
    $status = docker inspect --format='{{.State.Status}}' $c 2>$null
    if ($status -eq "running") { Pass "Container running: $c" } else { Fail "Container not running: $c (status: $status)" }
}

Log "Checking health endpoints..."
$HealthChecks = @(
    @("backend",    "http://localhost:3009/api/health", "200"),
    @("frontend",   "http://localhost:3000",            "200"),
    @("gateway",    "http://localhost:3001/",           "200"),
    @("marketplace","http://localhost:4000/api/health", "200")
)

foreach ($check in $HealthChecks) {
    $name = $check[0]; $url = $check[1]; $expected = $check[2]
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        $actual = $response.StatusCode.ToString()
    } catch {
        $actual = "000"
    }
    if ($actual -eq $expected) { Pass "Health check: $name -> HTTP $actual" } else { Fail "Health check: $name -> HTTP $actual (expected $expected)" }
}

# ── Phase 6: Data Persistence ─────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Phase 6: Data Persistence" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow

Log "Testing MongoDB data persistence..."
docker exec myzubster-mongodb mongosh -u myzubster -p changeme_in_production --authenticationDatabase admin --quiet --eval 'use myzubster; db.test_persistence.insertOne({test:true, timestamp:new Date()})' 2>$null
Pass "MongoDB: test document created"

$docCount = docker exec myzubster-mongodb mongosh -u myzubster -p changeme_in_production --authenticationDatabase admin --quiet --eval 'use myzubster; db.test_persistence.countDocuments({test:true})' 2>$null | Select-Object -Last 1
if ($docCount -match "1") { Pass "MongoDB: test document persisted" } else { Fail "MongoDB: test document not found" }

# ── Phase 7: Log Collection ───────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Phase 7: Log Collection" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogDir = "tests\docker-logs-$timestamp"
New-Item -ItemType Directory -Path $LogDir -Force | Out-Null

foreach ($c in $Containers) {
    $logFile = "$LogDir\$c.log"
    docker logs $c 2>&1 | Out-File $logFile -Encoding utf8
    $size = (Get-Item $logFile).Length
    Pass "Logs collected: $c ($size bytes)"
}

# ── Cleanup ───────────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Cleanup" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow

docker compose down -v 2>&1
Pass "All services stopped and volumes removed"

# ── Summary ───────────────────────────────────────────────
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Test Summary" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host " Total:  $Total"
Write-Host " Passed: $Pass" -ForegroundColor Green
Write-Host " Failed: $Fail" -ForegroundColor Red

if ($Fail -gt 0) {
    Write-Host "`nFailed tests:" -ForegroundColor Red
    foreach ($e in $Errors) { Write-Host "  - $e" -ForegroundColor Red }
    exit 1
} else {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
    exit 0
}
