# Local Deployment Guide: MyZubster Tor Onion Access PoC

**Project**: Isolated Tor Onion v3 Access PoC (Issue #1584)  
**Document**: `DEPLOYMENT.md`  
**Classification**: Operational Runbook & Local Deployment Instructions  

---

## 1. Overview

This document provides step-by-step instructions for deploying, verifying, and managing the isolated Tor Onion v3 proof-of-concept (PoC) stack on a local Linux development workstation.

The stack comprises three containerized services running on a private Docker bridge network (`myz_onion_net`):
1. **`myz_tor`**: Tor daemon hosting a v3 hidden service (`.onion`) with persistent keys.
2. **`myz_haproxy`**: Anonymizing reverse proxy with dynamic internal DNS resolution and header stripping.
3. **`myz_upstream`**: Mock HTTP application backend exposing `/`, `/healthz`, and `/dump-headers`.

---

## 2. Prerequisites

Ensure the following tools are available on your host system:

- **Linux Operating System**: Fedora, Ubuntu, Debian, or equivalent (Kernel >= 5.x).
- **Container Engine**:
  - Docker Engine >= 20.10 OR Podman >= 4.0.
  - Docker Compose CLI plugin (`docker compose`) >= 2.20.
  - *Note for Podman users*: If using rootless Podman, ensure the user socket is active:
    ```bash
    export DOCKER_HOST="unix:///run/user/$(id -u)/podman/podman.sock"
    ```
- **Outbound Internet Access**: Tor requires outbound network connectivity to bootstrap (contact directory authorities, guard relays, and rendezvous nodes).

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Navigate to the Project Root
```bash
cd ~/teamwork_projects/myzubster_tor_pilot
```

### Step 2: Build and Launch the Stack
Start all services in detached mode with forced image builds:
```bash
docker compose -f docker-compose.onion.yml up -d --build
```
*(If using Podman compose: `podman compose -f docker-compose.onion.yml up -d --build`)*

### Step 3: Monitor Container Startup and Health Status
All three services define granular healthchecks. Wait for all containers to reach `healthy` state:
```bash
docker compose -f docker-compose.onion.yml ps
```

To watch healthcheck progression in real time:
```bash
for svc in upstream haproxy tor; do
  echo -n "Waiting for $svc... "
  until [ "$(docker inspect --format='{{.State.Health.Status}}' "myz_${svc}" 2>/dev/null)" = "healthy" ]; do
    sleep 2
  done
  echo "healthy!"
done
```

### Step 4: Extract the Generated Onion Hostname
Once Tor reaches 100% bootstrap, the v3 `.onion` hostname is written to the mounted volume:
```bash
ONION_HOSTNAME=$(docker compose -f docker-compose.onion.yml exec -T tor cat /var/lib/tor/hidden_service/hostname)
echo "Onion address: ${ONION_HOSTNAME}"
```
The output will be a 56-character string ending in `.onion` (e.g., `examp1e...onion`).

---

## 4. Verifying End-to-End Connectivity via Tor SOCKS5

Because the stack exposes **zero host ports** (`0.0.0.0:*`), all requests must route through Tor within the Docker network. You can run an ephemeral test client connected to `myz_onion_net`:

### Test 1: Query Application Health via SOCKS5 Proxy
```bash
docker run --rm --network myz_onion_net curlimages/curl:latest \
    --silent --show-error \
    --socks5-hostname tor:9050 \
    "http://${ONION_HOSTNAME}/healthz"
```
**Expected Response**:
```json
{
  "status": "ok",
  "service": "myzubster-upstream",
  "timestamp": "2026-10-12T...Z"
}
```

### Test 2: Verify Header Sanitization & Deanonymization Protections
Send an HTTP request with poisoned proxy headers to the `/dump-headers` endpoint:
```bash
docker run --rm --network myz_onion_net curlimages/curl:latest \
    --silent --show-error \
    --socks5-hostname tor:9050 \
    -H "X-Forwarded-For: 203.0.113.195" \
    -H "X-Real-IP: 198.51.100.2" \
    -H "Client-IP: 192.0.2.1" \
    "http://${ONION_HOSTNAME}/dump-headers"
```
**Expected Output**:
The JSON dictionary returned contains standard HTTP headers (`Host`, `User-Agent`, `Accept`), but **zero** `X-Forwarded-For`, `X-Real-IP`, or client IP values.

### Test 3: Verify Dynamic DNS Resolution on Container Recreation
Force container recreation of the upstream service to assign a new internal IP:
```bash
# Capture HAProxy container start time
HAPROXY_START=$(docker inspect --format='{{.State.StartedAt}}' myz_haproxy)

# Recreate upstream container
docker compose -f docker-compose.onion.yml up -d --force-recreate upstream

# Allow 2 seconds for HAProxy resolver cache invalidation (hold valid 1s)
sleep 2

# Query again through Tor
docker run --rm --network myz_onion_net curlimages/curl:latest \
    --silent --show-error \
    --socks5-hostname tor:9050 \
    "http://${ONION_HOSTNAME}/healthz"

# Verify HAProxy was NEVER restarted
NEW_HAPROXY_START=$(docker inspect --format='{{.State.StartedAt}}' myz_haproxy)
[ "$HAPROXY_START" = "$NEW_HAPROXY_START" ] && echo "HAProxy dynamic resolution verified! Zero restarts."
```

---

## 5. Container Lifecycle & Operations

### View Container Logs
```bash
# Tor logs (view bootstrapping progress)
docker compose -f docker-compose.onion.yml logs -f tor

# HAProxy logs
docker compose -f docker-compose.onion.yml logs -f haproxy

# Upstream mock server logs
docker compose -f docker-compose.onion.yml logs -f upstream
```

### Stop the Stack (Preserve Keys)
To temporarily stop the containers while preserving the hidden service keys:
```bash
docker compose -f docker-compose.onion.yml stop
```

### Restart the Stack (Retains Existing .onion Address)
```bash
docker compose -f docker-compose.onion.yml start
```

---

## 6. Troubleshooting

1. **Tor Fails to Bootstrap (Timeout)**:
   - Verify outbound internet connectivity on your host.
   - Run `docker compose -f docker-compose.onion.yml logs tor` and check for network errors connecting to Tor directory authorities.
2. **HAProxy Configuration Errors**:
   - Validate configuration syntax inside the container:
     ```bash
     docker compose -f docker-compose.onion.yml exec haproxy haproxy -c -f /usr/local/etc/haproxy/haproxy.cfg
     ```
3. **Upstream 503 Service Unavailable**:
   - Verify upstream is healthy: `docker compose -f docker-compose.onion.yml exec upstream python3 -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8080/healthz').getcode())"`
   - Ensure HAProxy resolver is targeting `127.0.0.11:53`.
