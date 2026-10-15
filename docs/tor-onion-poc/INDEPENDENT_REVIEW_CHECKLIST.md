# Tor v3 Onion PoC — Independent Review & Audit Checklist

> **Tracking Reference**: [Issue #1584](https://github.com/MyZubster-Ecosystem/myzubster/issues/1584) · [Draft PR #1610](https://github.com/MyZubster-Ecosystem/myzubster/pull/1610)  
> **Scope**: Local design, threat modeling, and containerized verification only.  
> **Author**: Wasim (@wasim-builds)  
> **Date**: October 2026  

---

## 1. Scope & Hard Constraints

Independent reviewers must verify that this PoC strictly conforms to the following operational boundaries:

| Constraint | Requirement | Verification Method |
| :--- | :--- | :--- |
| **Zero Cloud / VPS Cost** | 100% local or isolated hardware execution (e.g. Raspberry Pi test node). No cloud infrastructure or VPS instances provisioned. | Audit `docker-compose.onion.yml` and deployment runbooks for absence of cloud endpoints. |
| **Zero Host Port Exposure** | No container binds or exposes any ports to the host machine (`0.0.0.0:*` or `127.0.0.1:*`). Inter-container traffic is strictly confined to the private bridge `myz_onion_net`. | Verify `ports:` section is completely absent from all services in `docker-compose.onion.yml`. |
| **Zero Secrets / Key Commits** | No persistent private Ed25519 Tor keys, authentication tokens, or real `.onion` domain names are committed to version control. | Verify `.gitignore` excludes keys and run `git status`/`git diff` to confirm zero committed keys. |
| **No Production Impact** | Design milestone only. Does not authorize production deployments, DNS updates, or mainnet transactions. | Confirm PR remains in Draft mode. |

---

## 2. Reviewer PASS / FAIL Verification Matrix

Reviewers should evaluate the local stack against the 7-phase execution protocol:

### Phase 1: Network Isolation & Ingress Boundary
- [ ] **Check 1.1**: Inspect `docker-compose.onion.yml`. Confirm that `tor`, `haproxy`, and `upstream` attach exclusively to `myz_onion_net`.
- [ ] **Check 1.2**: Confirm that no `ports:` declarations exist for any service.
- [ ] **Check 1.3**: Validate that ingress from the Tor network arrives only at the Tor container's private Hidden Service port (80) forwarding to `haproxy:8080`.
- **Criteria**: **PASS** if no port is listening on the host network (`ss -tulpn` or `netstat -an` shows no service ports bound).

### Phase 2: Tor v3 Daemon Security & File Permissions
- [ ] **Check 2.1**: Verify `tor/torrc` configures `HiddenServiceVersion 3` and specifies `HiddenServiceDir /var/lib/tor/hidden_service/`.
- [ ] **Check 2.2**: Inspect `tor/entrypoint.sh` to ensure directory ownership is set to `debian-tor:debian-tor` with mode `0700` and private key permissions with mode `0600`.
- [ ] **Check 2.3**: Verify the daemon drops root privileges and executes as non-root user `debian-tor`.
- **Criteria**: **PASS** if Tor reaches 100% bootstrap without permission warnings.

### Phase 3: Ephemeral Key Generation & Cryptographic Identity
- [ ] **Check 3.1**: Confirm that the hidden service hostname matches the 56-character base32 Ed25519 format (`[a-z2-7]{56}.onion`).
- [ ] **Check 3.2**: Confirm the generated private keys reside solely in the named Docker volume `tor_keys` and are never copied to the workspace or git index.
- **Criteria**: **PASS** if valid v3 onion address is generated locally in volume storage and withheld from logs.

### Phase 4: SOCKS5 Client Verification
- [ ] **Check 4.1**: Launch an isolated client container on `myz_onion_net` configured with `ALL_PROXY=socks5h://tor:9050`.
- [ ] **Check 4.2**: Execute `curl -s http://<sanitized-address>.onion/healthz`.
- **Criteria**: **PASS** if response returns `200 OK` with JSON payload `{"status": "healthy"}` through the Tor circuit.

### Phase 5: Reverse Proxy Header Cleansing & Anonymity Audit
- [ ] **Check 5.1**: Inspect `haproxy/haproxy.cfg`. Confirm explicit deletion of identifying client and intermediary headers:
  - `http-request del-header X-Forwarded-For`
  - `http-request del-header X-Real-IP`
  - `http-request del-header Client-IP`
  - `http-request del-header Via`
  - `http-request del-header Forwarded`
- [ ] **Check 5.2**: Confirm deletion of server fingerprinting headers in responses:
  - `http-response del-header Server`
  - `http-response del-header X-Powered-By`
- [ ] **Check 5.3**: Issue a test request with forged client headers (`curl -H "X-Forwarded-For: 198.51.100.1" ...`). Query `/dump-headers` on upstream.
- **Criteria**: **PASS** if the upstream application logs zero incoming client IP addresses or leaked host metadata.

### Phase 6: Dynamic Upstream Recovery (Zero-Downtime Resilience)
- [ ] **Check 6.1**: Verify `haproxy.cfg` defines `resolvers docker_dns` with `nameserver dns1 127.0.0.11:53` and `resolve-prefer ipv4`.
- [ ] **Check 6.2**: Restart or recreate the upstream container (`docker compose restart upstream`).
- [ ] **Check 6.3**: Retest routing via SOCKS5 proxy immediately.
- **Criteria**: **PASS** if requests continue to route successfully to the new container IP without restarting or reconfiguring HAProxy.

### Phase 7: Complete Rollback & Tear-Down Sanitization
- [ ] **Check 7.1**: Execute the teardown procedure defined in `ROLLBACK.md`:
  ```bash
  docker compose -f docker-compose.onion.yml down -v --rmi local
  ```
- [ ] **Check 7.2**: Verify that all containers, networks (`myz_onion_net`), and persistent volumes (`tor_keys`) are pruned.
- **Criteria**: **PASS** if `docker ps -a`, `docker network ls`, and `docker volume ls` show zero residual resources.

---

## 3. Residual Risks & Future Production Hardening

For production evaluation (outside the scope of this local PoC), the following risks must be addressed:

1. **Traffic Correlation & End-to-End Timing Analysis**:
   - *Risk*: Flow correlation if entry guards and destination traffic are monitored by an adversary.
   - *Mitigation*: Integrate Tor pluggable transports, fixed-size padding, and strict connection timeouts.

2. **DoS / Slowloris via Hidden Service Circuit Exhaustion**:
   - *Risk*: Adversary opens concurrent Tor rendezvous circuits without completing requests.
   - *Mitigation*: Deploy Tor PoW (Proof-of-Work) defense (`HiddenServicePoWDefensesEnabled 1` in Tor 0.4.8+) and HAProxy stick-table connection rate-limiting.

3. **Filesystem Immutability**:
   - *Risk*: Compromise of container allows file tampering.
   - *Mitigation*: Run containers with `read_only: true` and temporary `tmpfs` mounts for `/tmp` and `/run`.

---

## 4. Auditor Sign-Off Template

```markdown
### Tor v3 Onion PoC Review Sign-Off
- **Auditor**: @[username]
- **Target Commit**: [commit-sha]
- **Environment Tested**: [Fedora 43 / Ubuntu 24.04 / Raspberry Pi 4 / Other]
- **Zero Host Ports Verified**: [YES / NO]
- **Zero Secrets / Keys Committed**: [YES / NO]
- **Header Stripping Verified**: [YES / NO]
- **Dynamic DNS Recovery Verified**: [YES / NO]
- **Overall Verdict**: [PASS / FAIL]
- **Notes / Observations**: [Optional notes]
```
