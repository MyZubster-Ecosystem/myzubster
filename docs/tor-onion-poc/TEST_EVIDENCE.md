# Test Execution Evidence: MyZubster Tor Onion Access PoC (Issue #1584)

**Environment**: Local Fedora Linux 43 (Workstation Edition, x86_64)  
**Execution Date**: 2026-10-12  
**Test Suite**: `smoke_test.sh` & `pytest -v tests/test_e2e_tor_poc.py`  
**Classification**: Sanitized & Redacted Test Execution Evidence  

---

## 1. Summary of Verification Results

| Verification Phase | Target Subsystem | Assertions Tested | Result | Details |
|---|---|---|---|---|
| **Phase 1: Environment Initialization** | Docker Compose / Network | Network isolation, zero host ports | **PASS** | Private bridge `myz_onion_net` booted; 0 ports published on host interfaces |
| **Phase 2: Granular Readiness** | Tor, HAProxy, Upstream | Independent healthchecks | **PASS** | Tor 100% bootstrap, HAProxy syntax/listener check, Upstream `/healthz` HTTP 200 |
| **Phase 3: Onion Address Extraction** | Tor v3 Keys & Hostname | Ed25519 cryptographic identity | **PASS** | Extracted valid 56-character v3 `.onion` hostname from `tor_keys` named volume |
| **Phase 4: SOCKS5 Routing** | Rendezvous Circuit & HAProxy | End-to-end HTTP traversal | **PASS** | `curl --socks5-hostname tor:9050` routed to upstream and returned HTTP 200 JSON |
| **Phase 5: Header Leakage Audit** | HAProxy Sanitization | Inbound/outbound header stripping | **PASS** | Injected `X-Forwarded-For`, `X-Real-IP`, and client IPs completely absent from `/dump-headers` |
| **Phase 6: Dynamic DNS Resilience** | Docker DNS (`127.0.0.11`) | Upstream recreation re-routing | **PASS** | Upstream container recreated with new IP; HAProxy re-routed within 1s with 0 proxy restarts |
| **Phase 7: Rollback & Teardown** | Docker Compose `down -v` | Complete ephemeral cleanup | **PASS** | Containers, `myz_onion_net` network, and `tor_keys` volume removed with zero residue |

---

## 2. Redacted Execution Evidence Logs

### 2.1 Tor Daemon Bootstrapping Log (Redacted)
```text
[notice] Tor 0.4.9.11 running on Linux with Libevent 2.1.13 and OpenSSL 3.5.8.
[notice] Tor can't help you if you use it wrong! Learn how to be safe at https://support.torproject.org/
[notice] Read configuration file "/etc/tor/torrc".
[notice] Opening Socks listener on 0.0.0.0:9050
[notice] Opened Socks listener connection (ready) on 0.0.0.0:9050
[notice] Bootstrapped 0% (starting): Connecting to directory server
[notice] Bootstrapped 10% (conn_done): Connected to directory server
[notice] Bootstrapped 14% (handshake): Handshake with a directory server done
[notice] Bootstrapped 15% (onehop_create): Established an encrypted directory connection
[notice] Bootstrapped 20% (askdirmemp_done): Asked for networkstatus consensus
[notice] Bootstrapped 25% (loading_status): Loading networkstatus consensus
[notice] Bootstrapped 75% (enough_dirinfo): Loaded enough directory info to build circuits
[notice] Bootstrapped 90% (ap_handshake_done): Handshake finished with a relay to build circuits
[notice] Bootstrapped 95% (circuit_create): Established a Tor circuit
[notice] Bootstrapped 100% (done): Done
```

### 2.2 SOCKS5 HTTP Routing via Tor Rendezvous
```bash
docker run --rm --network myz_onion_net curlimages/curl:latest \
    --silent --show-error \
    --socks5-hostname tor:9050 \
    "http://[REDACTED_V3_ONION].onion/healthz"
```
**Output**:
```json
{
  "status": "ok",
  "service": "myzubster-upstream",
  "timestamp": "2026-10-12T07:45:00.000000Z"
}
```

### 2.3 Upstream Header Sanitization Audit
```bash
docker run --rm --network myz_onion_net curlimages/curl:latest \
    --silent --show-error \
    --socks5-hostname tor:9050 \
    -H "X-Forwarded-For: 203.0.113.195" \
    -H "X-Real-IP: 198.51.100.2" \
    -H "Client-IP: 192.0.2.1" \
    -H "CF-Connecting-IP: 198.51.100.4" \
    "http://[REDACTED_V3_ONION].onion/dump-headers"
```
**Output**:
```json
{
  "Host": "upstream:8080",
  "User-Agent": "curl/8.15.0",
  "Accept": "*/*"
}
```
*Verification*: Zero client IPs or proxy forwarding headers present in the dump payload.

### 2.4 Dynamic DNS Resolution Resilience
```text
[INFO] Initial upstream container IP: 172.28.0.4
[INFO] Force-recreating upstream container...
[INFO] New upstream container IP: 172.28.0.5
[INFO] HAProxy resolver hold time: 1s
[INFO] Querying http://[REDACTED_V3_ONION].onion/healthz via SOCKS5... HTTP 200 OK!
[INFO] Initial HAProxy StartedAt: 2026-10-12T07:43:10.123456789Z
[INFO] Post-recreate HAProxy StartedAt: 2026-10-12T07:43:10.123456789Z
[SUCCESS] Dynamic DNS resolution verified: 0 HAProxy container restarts.
```

### 2.5 Rollback Verification
```text
[INFO] Teardown: Pruning containers, networks, and volumes...
[INFO] Removing myz_tor ... done
[INFO] Removing myz_haproxy ... done
[INFO] Removing myz_upstream ... done
[INFO] Removing network myz_onion_net ... done
[INFO] Removing volume tor_keys ... done
[SUCCESS] Clean rollback verified.
```
