# Threat Model & Security Architecture: Tor Onion Access PoC

**Project**: MyZubster Isolated Tor Onion v3 Access PoC (Issue #1584)  
**Document**: `THREAT_MODEL.md`  
**Classification**: Security Architecture, Threat Analysis & Network Isolation Boundaries  
**Target Architecture**: Docker Compose (`docker-compose.onion.yml`)  

---

## 1. Executive Summary & Scope

This threat model evaluates the isolation boundaries, deanonymization vectors, and cryptographic protections of the Proof of Concept (PoC) architecture implemented for **Issue #1584: Resilient Tor Onion Access via HAProxy and Internal DNS Resolution**.

The objective of this architecture is to provide onion service (v3) access to the MyZubster platform while preserving the operational anonymity of connecting clients, isolating the upstream application from direct Tor network exposure, preventing internal Docker infrastructure topology leaks, and eliminating single points of failure caused by container IP address re-allocations.

> **Operational Scope Note**: This implementation is an isolated, local, non-production Proof of Concept (PoC). It contains zero production secrets, relies on dynamically generated local ephemeral v3 keys, and operates within a standalone private bridge network.

---

## 2. Architecture & Trust Boundaries

The system defines four distinct trust zones:

```
+-----------------------------------------------------------------------------------------+
| UNTRUSTED EXTERNAL ZONE: Tor Overlay Network & Clients                                  |
| (Client initiates v3 rendezvous circuit to .onion address)                             |
+-----------------------------------------------------------------------------------------+
                                      │
                                      ▼ [Tor Rendezvous Protocol / Encrypted WAN]
+-----------------------------------------------------------------------------------------+
| TRUST ZONE 1: Tor Hidden Service Container (myz_tor)                                    |
| - Executes as unprivileged user 'tor' (UID 100) via root entrypoint drop               |
| - Dedicated volume 'tor_keys' mounted at /var/lib/tor/hidden_service (0700)            |
| - Listens on internal SOCKS5 (0.0.0.0:9050) & forwards Onion port 80 to haproxy:80      |
| - ZERO host-exposed ports (0.0.0.0:*)                                                   |
+-----------------------------------------------------------------------------------------+
                                      │
                                      ▼ [HTTP Cleartext within myz_onion_net bridge]
+-----------------------------------------------------------------------------------------+
| TRUST ZONE 2: HAProxy Anonymizing Reverse Proxy (myz_haproxy)                           |
| - Strips 18+ client and proxy headers (X-Forwarded-For, X-Real-IP, Client-IP, etc.)   |
| - Strictly omits 'option forwardfor' (prevents Tor container IP injection)              |
| - Masks server fingerprints (Server: Protected-Onion-Service)                           |
| - Dynamic Docker DNS resolution (127.0.0.11:53, hold valid 1s, init-addr libc,none)     |
| - ZERO host-exposed ports (0.0.0.0:*)                                                   |
+-----------------------------------------------------------------------------------------+
                                      │
                                      ▼ [Sanitized HTTP within myz_onion_net bridge]
+-----------------------------------------------------------------------------------------+
| TRUST ZONE 3: Upstream Application Container (myz_upstream)                             |
| - Mock application server listening on internal port 8080                               |
| - Receives clean HTTP requests with zero client IP metadata                             |
| - Recreatable dynamically without breaking reverse proxy routing                        |
| - ZERO host-exposed ports (0.0.0.0:*)                                                   |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Threat Vectors & Defense Mechanisms

### 3.1 Threat Vector 1: Deanonymization via Forwarding Header Injection
- **Threat**: In traditional reverse proxy setups, `option forwardfor` automatically appends the TCP source IP address to the `X-Forwarded-For` header. In an onion service topology, the incoming TCP connection to the proxy originates from the **Tor container** (e.g., `172.28.0.2`). Enabling `option forwardfor` injects private container IP addresses into application logs, revealing internal network addressing and container topology to the application layer. Furthermore, if a malicious client injects spoofed client IP headers (`X-Forwarded-For: 198.51.100.1`, `X-Real-IP`, `Client-IP`), an unhardened proxy might forward them downstream, poisoning backend analytics or rate-limiters.
- **Defense Mechanism**:
  1. `option forwardfor` is **strictly omitted** from `haproxy.cfg`.
  2. Explicit inbound header stripping via HAProxy `http-request del-header` rules for 18 known client-identifying headers:
     - `X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Proto`, `X-Forwarded-Server`, `X-Forwarded-Port`
     - `X-Real-IP`, `Forwarded`, `Client-IP`, `True-Client-IP`, `X-Client-IP`, `X-Originating-IP`
     - `CF-Connecting-IP`, `Fastly-Client-IP`, `Incap-Client-IP`, `X-Cluster-Client-IP`
     - `Via`, `X-Request-ID`, `X-Correlation-ID`

### 3.2 Threat Vector 2: Backend Framework Fingerprinting & Information Leakage
- **Threat**: Application servers often leak server implementation details in response headers (e.g., `Server: Python/3.11`, `X-Powered-By: Express`, `X-AspNet-Version`). Attackers correlate these headers to profile the backend software stack and identify version-specific exploits.
- **Defense Mechanism**:
  1. HAProxy deletes fingerprinting headers in outbound responses:
     - `http-response del-header Server`
     - `http-response del-header X-Powered-By`
     - `http-response del-header X-AspNet-Version`
     - `http-response del-header X-Runtime`
  2. Sets a generic, uniform server banner:
     - `http-response set-header Server "Protected-Onion-Service"`

### 3.3 Threat Vector 3: Host Interface Port Exposure
- **Threat**: Accidental binding of container ports to host network interfaces (`0.0.0.0:80` or `0.0.0.0:9050`) exposes internal services to LAN or WAN port scanners, bypassing Tor and enabling direct host deanonymization.
- **Defense Mechanism**:
  - `docker-compose.onion.yml` specifies **zero published ports** (`ports: []`) across all services.
  - Ingress is cryptographically restricted to the Tor rendezvous protocol.
  - SOCKS5 listener (`9050`) binds strictly within the internal bridge network (`myz_onion_net`) for ephemeral testing and is unreachable from the host's external interfaces.

### 3.4 Threat Vector 4: Tor Secret Key Compromise & Insecure File Permissions
- **Threat**: Tor v3 hidden services derive their identity from an Ed25519 secret key (`hs_ed25519_secret_key`). If file permissions are permissive (e.g., `0755` or owned by root), local unprivileged users could read the private key and hijack the `.onion` identity. Furthermore, Tor daemon source code (`check_private_dir()`) explicitly refuses to run if `HiddenServiceDir` permissions are not strictly `0700` and `0600`.
- **Defense Mechanism**:
  1. Multi-stage startup in `tor/entrypoint.sh`: starts as root to normalize volume ownership (`chown -R tor:tor /var/lib/tor`).
  2. Strict permission enforcement: `chmod 700 /var/lib/tor/hidden_service` and `chmod 600 /var/lib/tor/hidden_service/hs_ed25519_secret_key`.
  3. Privilege drop: executes `exec su-exec tor tor -f /etc/tor/torrc "$@"` to drop root privileges and run Tor unprivileged as UID 100.
  4. Keys persist inside the isolated Docker named volume `tor_keys`.

### 3.5 Threat Vector 5: Denial of Service via Upstream Container Re-allocation
- **Threat**: In containerized environments, redeploying or recreating the backend container (`docker compose up -d --force-recreate upstream`) provisions a new container IP from the bridge subnet. Reverse proxies relying on startup DNS resolution (`libc getaddrinfo()`) cache the dead IP indefinitely, causing persistent `503 Service Unavailable` outages until manually restarted.
- **Defense Mechanism**:
  - HAProxy is configured with a dynamic runtime resolver block:
    ```haproxy
    resolvers docker_dns
        nameserver dns1 127.0.0.11:53
        resolve_retries 3
        timeout resolve 1s
        hold valid 1s
        accepted_payload_size 8192
    ```
  - Backend server directive uses `resolvers docker_dns resolve-prefer ipv4 init-addr libc,none check inter 1s fall 2 rise 1`.
  - When upstream is recreated, HAProxy actively invalidates its DNS cache within 1 second and re-routes requests to the new container IP with zero downtime and zero HAProxy restarts.

---

## 4. Network Isolation Boundaries

| Boundary | Interface / Protocol | Ingress Policy | Egress Policy | Security Control |
|---|---|---|---|---|
| **Host <-> Stack** | None (0.0.0.0) | Blocked (no open ports) | N/A | No `ports:` declared in compose |
| **WAN <-> Tor** | Encrypted Tor Circuit | Allowed via Tor rendezvous | Allowed to Tor directory/guard relays | Tor circuit encryption |
| **Tor <-> HAProxy** | HTTP over `myz_onion_net` | Allowed to `haproxy:80` | Allowed to Tor rendezvous | Private bridge network isolation |
| **HAProxy <-> Upstream** | HTTP over `myz_onion_net` | Allowed to `upstream:8080` | Allowed response to HAProxy | Private bridge network isolation |
| **HAProxy <-> Docker DNS** | DNS (UDP/TCP 53) | N/A | Allowed to `127.0.0.11:53` | Embedded Docker resolver query only |

---

## 5. Non-Production Limitations & Future Hardening

1. **Single Node PoC**: This architecture runs as a local Docker Compose stack. In production, Tor and HAProxy should reside on distinct hardened hosts or separate security zones.
2. **TLS Termination**: Traffic between Tor, HAProxy, and Upstream is cleartext HTTP over the Docker bridge network. For production multi-host clusters, mTLS should be enabled between proxy and application services.
3. **Rate Limiting & Anti-DDoS**: HAProxy stick tables can be introduced in production to mitigate Layer 7 application denial-of-service attacks from Tor circuits without relying on client IPs.
