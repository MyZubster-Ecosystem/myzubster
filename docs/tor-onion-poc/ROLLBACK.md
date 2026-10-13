# Rollback & Teardown Procedure: MyZubster Tor Onion Access PoC

**Project**: Isolated Tor Onion v3 Access PoC (Issue #1584)  
**Document**: `ROLLBACK.md`  
**Classification**: Operational Teardown Runbook & Rollback Procedure  

---

## 1. Overview & Rollback Guarantees

The MyZubster Tor Onion Access PoC architecture is fully self-contained. All resources (containers, custom bridge networks, and named storage volumes) are scoped strictly to the compose definition in `docker-compose.onion.yml`.

A complete rollback guarantees:
1. **Zero Lingering Containers**: `myz_tor`, `myz_haproxy`, and `myz_upstream` are terminated and removed.
2. **Zero Orphaned Networks**: The custom bridge network `myz_onion_net` is unmapped and pruned.
3. **Zero Persistent Key Residue**: The named volume `tor_keys` storing the Ed25519 onion secret key is completely purged.
4. **Zero Host Side Effects**: No firewall rules, host interfaces, or system configuration outside the Docker daemon are affected.

---

## 2. Standard Safe Rollback Procedure

Execute the following commands from the project root:

### Step 1: Teardown Stack, Volumes, and Networks
```bash
cd ~/teamwork_projects/myzubster_tor_pilot
docker compose -f docker-compose.onion.yml down -v --remove-orphans
```
*(If using Podman compose: `podman compose -f docker-compose.onion.yml down -v`)*

**Flags Explained**:
- `down`: Stops and removes all containers and networks defined in `docker-compose.onion.yml`.
- `-v` (`--volumes`): Purges named volumes declared in the `volumes` section (specifically `tor_keys`).
- `--remove-orphans`: Removes any orphaned containers from previous runs.

---

## 3. Verification of Clean Teardown

Run the following commands to independently verify that all stack resources have been pruned:

### 1. Verify No Active Stack Containers
```bash
docker ps -a --filter "name=myz_"
```
*Expected Output*: Empty list (zero containers).

### 2. Verify Network Removal
```bash
docker network ls --filter "name=myz_onion_net"
```
*Expected Output*: Only the column headers; no `myz_onion_net` network listed.

### 3. Verify Volume Purging
```bash
docker volume ls --filter "name=tor_keys"
```
*Expected Output*: Only the column headers; no `tor_keys` volume listed.

### 4. Verify Zero Open Ports on Host
```bash
ss -tulpn | grep -E ':(80|8080|9050)\b'
```
*Expected Output*: No listening sockets associated with Docker or Tor.

---

## 4. Emergency Cleanup & Troubleshooting

If a container fails to stop gracefully due to a stuck process or unmounted storage:

### Force Remove Lingering Containers
```bash
docker rm -f myz_tor myz_haproxy myz_upstream 2>/dev/null || true
```

### Force Remove Network
```bash
docker network rm myz_onion_net 2>/dev/null || true
```

### Force Remove Volume
```bash
docker volume rm myzubster_tor_pilot_tor_keys tor_keys 2>/dev/null || true
```

### Prune Ephemeral Build Layers
To free cached image layers created during PoC builds:
```bash
docker image prune -f --filter "label=com.docker.compose.project=myzubster_tor_pilot"
```
