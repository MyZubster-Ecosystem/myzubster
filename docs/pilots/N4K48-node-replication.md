# Pilot N4K48: Independent Node Replication & Interoperability

## 1. Minimal Node Deployment Guide
This document provides the steps to deploy a MyZubster pilot node in an isolated environment.

### Prerequisites
- OS: Ubuntu 22.04 LTS (Recommended)
- Docker & Docker Compose v2.x
- Minimum Hardware: 2 vCPU, 4GB RAM, 20GB SSD

### Environment Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/MyZubster-Ecosystem/myzubster.git
   cd myzubster
   ```

2. **Secret Handling:**
   Do NOT use production credentials. Create a `.env.pilot` file:
   ```bash
   NODE_ID=pilot_node_01
   API_SECRET=$(openssl rand -hex 32)
   DB_PASSWORD=$(openssl rand -hex 16)
   LOG_LEVEL=debug
   ```

3. **Deployment:**
   ```bash
   docker-compose -f docker-compose.pilot.yml up -d
   ```

## 2. Operational Checklist
### Start/Stop/Health
- **Start:** `docker-compose -f docker-compose.pilot.yml up -d`
- **Stop:** `docker-compose -f docker-compose.pilot.yml stop`
- **Health Check:**
  ```bash
  curl -f http://localhost:8080/health || exit 1
  ```

### Recovery Steps
1. Check logs: `docker-compose -f docker-compose.pilot.yml logs --tail=100`
2. Restart service: `docker-compose -f docker-compose.pilot.yml restart api`
3. Verify DB connectivity: `docker exec -it myzubster-db psql -U user -c "SELECT 1;"`

## 3. Interoperability Test Protocol (Read-Only)
To ensure nodes can communicate without compromising privacy, we implement a consent-based read-only handshake.

### Scenario: Node Discovery & Version Sync
**Expected Behavior:** Node A requests version info from Node B. Node B responds with metadata only.

**Test Command:**
```bash
curl -X GET http://<NODE_B_IP>:8080/interop/version \
     -H "X-Interop-Token: <AGREED_PILOT_TOKEN>"
```

**Expected Response:**
```json
{
  "status": "success",
  "node_id": "pilot_node_01",
  "version": "1.2.0-pilot",
  "capabilities": ["read_only", "sync_metadata"]
}
```

**Failure Cases:**
- `403 Forbidden`: Token mismatch or unauthorized node.
- `404 Not Found`: Interop endpoint not enabled.
- `500 Error`: Node internal failure during handshake.

## 4. Privacy & Data Isolation
- **What is NOT synchronized:** User PII (Personally Identifiable Information), Private Keys, Transaction Signatures.
- **What IS synchronized:** Protocol version, Node health status, Public metadata schemas.

## 5. Single Points of Failure (SPOF) & Roadmap
- [ ] **Current SPOF:** Centralized Registry for Node Discovery.
- [ ] **Mitigation:** Implement a Distributed Hash Table (DHT) for peer discovery.
- [ ] **Next Step:** Transition from manual `.env` to a decentralized Secret Management System.
