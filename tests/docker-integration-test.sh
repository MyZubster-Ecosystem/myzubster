#!/bin/bash
# ============================================================
# MyZubster Docker Integration Test Suite
# Validates entire ecosystem starts and passes health checks
# Usage: bash tests/docker-integration-test.sh
# ============================================================

set -euo pipefail

DOCKER_COMPOSE="docker compose"
PASS=0
FAIL=0
TOTAL=0
ERRORS=()

# ── Colors ────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[INFO]${NC} $*"; }
pass() { echo -e "${GREEN}[PASS]${NC} $*"; PASS=$((PASS+1)); TOTAL=$((TOTAL+1)); }
fail() { echo -e "${RED}[FAIL]${NC} $*"; FAIL=$((FAIL+1)); TOTAL=$((TOTAL+1)); ERRORS+=("$1"); }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }

# ── Phase 1: File Validation ──────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Phase 1: Required Files Existence"
echo "═══════════════════════════════════════════════════════"

REQUIRED_FILES=(
  "docker-compose.yml"
  "backend/Dockerfile"
  "frontend/Dockerfile"
  "Dockerfile.gateway"
  "Dockerfile.marketplace"
  "services/ai-automation/Dockerfile"
  ".env.docker"
  "docker-entrypoint.sh"
)

for f in "${REQUIRED_FILES[@]}"; do
  if [ -f "$f" ]; then
    pass "File exists: $f"
  else
    fail "Missing file: $f"
  fi
done

# ── Phase 2: Docker Compose Validation ────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Phase 2: Docker Compose Config Validation"
echo "═══════════════════════════════════════════════════════"

# Validate compose config
if $DOCKER_COMPOSE config --quiet 2>/dev/null; then
  pass "docker-compose.yml parses without errors"
else
  fail "docker-compose.yml has syntax errors"
fi

# Check all 6 services are defined
SERVICES=$($DOCKER_COMPOSE config --services 2>/dev/null)
EXPECTED_SERVICES=("mongodb" "backend" "frontend" "gateway" "marketplace" "ai-automation")
for svc in "${EXPECTED_SERVICES[@]}"; do
  if echo "$SERVICES" | grep -q "^${svc}$"; then
    pass "Service defined: $svc"
  else
    fail "Service missing: $svc"
  fi
done

# Check health checks exist for all services
for svc in "${EXPECTED_SERVICES[@]}"; do
  if $DOCKER_COMPOSE config 2>/dev/null | grep -A 20 "  ${svc}:" | grep -q "healthcheck:"; then
    pass "Health check configured: $svc"
  else
    fail "Health check missing: $svc"
  fi
done

# ── Phase 3: Environment Variables ────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Phase 3: Environment Variables"
echo "═══════════════════════════════════════════════════════"

# Check .env.docker has all required vars
ENV_FILE=".env.docker"
REQUIRED_VARS=(
  "MONGO_INITDB_ROOT_USERNAME"
  "MONGO_INITDB_ROOT_PASSWORD"
  "BACKEND_PORT"
  "FRONTEND_PORT"
  "GATEWAY_PORT"
  "MARKETPLACE_PORT"
  "AI_AUTOMATION_PORT"
)

if [ -f "$ENV_FILE" ]; then
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" "$ENV_FILE"; then
      pass "Env var defined: $var"
    else
      fail "Env var missing: $var"
    fi
  done
else
  fail ".env.docker file not found"
fi

# ── Phase 4: Docker Build Test ────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Phase 4: Docker Build (Dry Run)"
echo "═══════════════════════════════════════════════════════"

log "Building backend image..."
if $DOCKER_COMPOSE build backend 2>&1 | tail -5; then
  pass "Backend image builds successfully"
else
  fail "Backend image build failed"
fi

log "Building frontend image..."
if $DOCKER_COMPOSE build frontend 2>&1 | tail -5; then
  pass "Frontend image builds successfully"
else
  fail "Frontend image build failed"
fi

# ── Phase 5: Full Stack Startup ───────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Phase 5: Full Stack Startup & Health Checks"
echo "═══════════════════════════════════════════════════════"

log "Starting all services..."
$DOCKER_COMPOSE up -d --build 2>&1

log "Waiting for services to stabilize (90s)..."
sleep 90

# Check container status
log "Checking container status..."
CONTAINERS=("myzubster-mongodb" "myzubster-backend" "myzubster-frontend" "myzubster-gateway" "myzubster-marketplace" "myzubster-ai-automation")
for c in "${CONTAINERS[@]}"; do
  STATUS=$(docker inspect --format='{{.State.Status}}' "$c" 2>/dev/null || echo "not_found")
  if [ "$STATUS" = "running" ]; then
    pass "Container running: $c"
  else
    fail "Container not running: $c (status: $STATUS)"
  fi
done

# Health endpoint checks
log "Checking health endpoints..."
HEALTH_CHECKS=(
  "backend|http://localhost:3009/api/health|200"
  "frontend|http://localhost:3000|200"
  "gateway|http://localhost:3001/|200"
  "marketplace|http://localhost:4000/api/health|200"
)

for check in "${HEALTH_CHECKS[@]}"; do
  IFS='|' read -r name url expected <<< "$check"
  ACTUAL=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  if [ "$ACTUAL" = "$expected" ]; then
    pass "Health check: $name → HTTP $ACTUAL"
  else
    fail "Health check: $name → HTTP $ACTUAL (expected $expected)"
  fi
done

# ── Phase 6: Data Persistence ─────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Phase 6: Data Persistence"
echo "═══════════════════════════════════════════════════════"

log "Testing MongoDB data persistence..."
# Create a test document
docker exec myzubster-mongodb mongosh -u myzubster -p changeme_in_production --authenticationDatabase admin --quiet --eval '
  use myzubster;
  db.test_persistence.insertOne({test: true, timestamp: new Date()});
' 2>/dev/null

if [ $? -eq 0 ]; then
  pass "MongoDB: test document created"
else
  fail "MongoDB: could not create test document"
fi

# Verify document exists
DOC_COUNT=$(docker exec myzubster-mongodb mongosh -u myzubster -p changeme_in_production --authenticationDatabase admin --quiet --eval '
  use myzubster;
  db.test_persistence.countDocuments({test: true});
' 2>/dev/null | tail -1 | tr -d '[:space:]')

if [ "$DOC_COUNT" = "1" ]; then
  pass "MongoDB: test document persisted"
else
  fail "MongoDB: test document not found (count: $DOC_COUNT)"
fi

# ── Phase 7: Log Collection ───────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Phase 7: Log Collection"
echo "═══════════════════════════════════════════════════════"

LOG_DIR="tests/docker-logs-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$LOG_DIR"

for c in "${CONTAINERS[@]}"; do
  docker logs "$c" > "$LOG_DIR/${c}.log" 2>&1 || true
  if [ -f "$LOG_DIR/${c}.log" ]; then
    SIZE=$(wc -c < "$LOG_DIR/${c}.log")
    pass "Logs collected: $c (${SIZE} bytes)"
  else
    fail "Could not collect logs: $c"
  fi
done

# ── Cleanup ───────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Cleanup"
echo "═══════════════════════════════════════════════════════"

log "Stopping all services..."
$DOCKER_COMPOSE down -v 2>&1
pass "All services stopped and volumes removed"

# ── Summary ───────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo " Test Summary"
echo "═══════════════════════════════════════════════════════"
echo -e " Total:  ${TOTAL}"
echo -e " Passed: ${GREEN}${PASS}${NC}"
echo -e " Failed: ${RED}${FAIL}${NC}"
echo ""

if [ ${#ERRORS[@]} -gt 0 ]; then
  echo -e "${RED}Failed tests:${NC}"
  for err in "${ERRORS[@]}"; do
    echo -e "  - ${err}"
  done
  echo ""
  exit 1
else
  echo -e "${GREEN}All tests passed! ✅${NC}"
  echo ""
  exit 0
fi
