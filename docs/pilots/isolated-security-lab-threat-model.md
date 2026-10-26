# Isolated Security Lab Threat Model & Operational Specification (Issue #1659 — Milestone M1)

**Owner / Author**: Mohammed Wasim Khan (`@wasim-builds`)  
**Context**: [Issue #1659](https://github.com/MyZubster-Ecosystem/myzubster/issues/1659) — Gangkor isolated security & interoperability lab with Wasim  
**Status**: Milestone M1 (Baseline Isolation, Threat Model & Least-Privilege Verification)  
**Target Environment**: Isolated Virtual Machine (`myzubster-wasim-dev` via Tailscale `100.70.67.8`)

---

## 1. Executive Summary & Boundaries

In accordance with [Issue #1659](https://github.com/MyZubster-Ecosystem/myzubster/issues/1659), this specification establishes the security boundaries, network access policies, least-privilege accounting, and threat model for the isolated development virtual machine (`myzubster-wasim-dev`).

### Zero-Trust Operational Principles:
1. **Zero Cloud/VPS Spend**: Runs within the pre-provisioned isolated development VM without creating new cloud expenses or third-party paid subscriptions.
2. **Strict Production Air-Gap**: The development VM has **zero access** to production VPS infrastructure (`gateway.myzubster.com`), production MongoDB clusters, Monero/Tari production wallets, or live Tor Onion services.
3. **No Production Secrets**: All tests, environment configurations, and execution runners use mock secrets, ephemeral in-memory storage (`MongoMemoryReplSet`), and sanitized test identities.
4. **Least-Privilege Non-Root Operation**: The developer and all automation processes execute as unprivileged user `wasim` (`uid=1001`, `gid=1001`) with passwordless `sudo` strictly prohibited.

---

## 2. Environment Architecture & Resource Profile

```
┌─────────────────────────────────────────────────────────────┐
│ Developer Workstation / Contributor Identity               │
│ (@wasim-builds, SSH ED25519)                                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Private Tailscale Encrypted Mesh
                               │ (DERP / Direct UDP peer-to-peer)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Isolated Development VM: `myzubster-wasim-dev`              │
│ IP: 100.70.67.8 (Tailscale interface only)                 │
│ OS: Ubuntu 24.04 LTS x86_64 (Linux 6.8.0-147-generic)       │
│ User: wasim (uid=1001, gid=1001, sudo disabled)             │
│ Storage: 24GB virtual disk (2.0GB used, 22GB available)     │
│ Runtime: Node.js 22 LTS (v22.23.4) in ~/.local/bin/         │
├─────────────────────────────────────────────────────────────┤
│ Execution Layer:                                            │
│  • Ephemeral MongoMemoryReplSet in RAM                      │
│  • Local Express gateway (port 3000 loopback)               │
│  • Zero persistent disk writes to production volumes        │
└─────────────────────────────────────────────────────────────┘
                               │
                ❌ STRICTLY BLOCKED / AIR-GAPPED
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Production VPS Infrastructure & Live Networks               │
│  • gateway.myzubster.com                                    │
│  • Production MongoDB database                              │
│  • Production Monero / Tari wallets                         │
│  • Production Tor v3 onion service                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Network Egress & Ingress Rules

### A. Ingress (Inbound) Rules
- **Interface**: Tailscale virtual interface (`tailscale0`) only.
- **Port**: TCP port 22 (SSH).
- **Authentication**: Strict OpenSSH public key authentication (`ssh-ed25519`). Password authentication and interactive keyboard authentication are disabled.
- **Fencing**: Access is constrained exclusively to Wasim's authenticated Tailscale identity via tailnet access control policies. Public IPv4 and IPv6 interfaces are unbound.

### B. Egress (Outbound) Rules
- **Permitted Outbound**:
  - `github.com` / `api.github.com`: Git checkout and repository synchronization over HTTPS (port 443).
  - `nodejs.org`: Initial LTS runtime package download over HTTPS (port 443).
  - `registry.npmjs.org`: Package dependency resolution and installation over HTTPS (port 443).
- **Prohibited Outbound**:
  - Direct network connections to production server IPs, production database ports, or remote Monero daemon RPCs (`18081`).
  - No public inbound service exposure (no port forwarding or external DNS mapping).

---

## 4. Threat Model (STRIDE Evaluation)

| Threat Category | Potential Vector | Impact | Implemented Mitigation / Security Guard |
|---|---|---|---|
| **Spoofing** | Attacker attempts to impersonate developer on the development VM. | High | Tailscale cryptographic peer keys + ED25519 SSH host and user key verification. Only Wasim's key is authorized. |
| **Tampering** | Dependency poisoning or test payload modifying critical system files. | High | Non-root execution (`uid=1001`), root directory `/` and `/etc` are read-only to `wasim`. Database runs in-memory (`MongoMemoryReplSet`). |
| **Repudiation** | Unverified code changes executed without attribution. | Medium | All git commits cryptographically signed via SSH signing key (`id_ed25519.pub`); audit logs retained. |
| **Information Disclosure** | Leakage of production secrets, tokens, or wallet keys in issue logs. | Critical | Zero production secrets loaded. Mocks used exclusively (`JWT_SECRET="lifecycle-test-secret"`, dummy wallets). Automated log sanitizer. |
| **Denial of Service** | Rogue test or infinite loop exhausts system memory or disk. | Medium | VM constrained to 24GB virtual disk; process memory bound to node heap limit; test harness enforces clean teardown hooks (`afterAll`). |
| **Elevation of Privilege** | Container or process breakout attempting `sudo` execution. | Critical | `sudo: a password is required`. Sudoers policy forbids unauthenticated escalation; kernel namespaces active. |

### 4.1 Mock Integrity vs. Sender Authenticity Boundary

As highlighted in the maintainer review, an unkeyed SHA-256 digest (`integrity.digest`) only detects **accidental data corruption** (e.g. transmission bit flips or storage rot). An active adversary can modify payload contents and freely recompute the matching unkeyed SHA-256 digest. Therefore, the interop harness explicitly demarcates two operating boundaries:

1. **Tier 1 (Isolated Lab Mock Only)**:
   - Uses RFC 8785 (JCS) canonicalization and unkeyed SHA-256 digests.
   - Tagged explicitly as `mode: 'unauthenticated-mock-integrity-only'`.
   - Used solely for hermetic, single-process walkthroughs and offline unit tests.
   - Emits an explicit security warning that sender authenticity is unverified.
2. **Tier 2 (Cryptographically Authenticated Peer Interoperability)**:
   - Enforced by `requireAuth: true` in `verifyBridgePayload()` and `InteropBridgeDispatcher`.
   - Supports **HMAC-SHA256** (with pre-shared symmetric keys) and **Ed25519** digital signatures (with asymmetric public/private key pairs).
   - Signatures are computed over the canonical RFC 8785 JSON representation, guaranteeing non-repudiation, sender authenticity, and active tamper detection.
   - Any bridge payload without a verifiable cryptographic signature or using an unauthorized key is immediately rejected and fails closed.

### 4.2 Strict Production Air-Gap Reaffirmation

This isolated lab is strictly air-gapped from production environments:
- **No Production Wallets**: Monero (`xmr`) and Tari (`tari`) production wallets, seed phrases, view keys, and spend keys are prohibited from the VM.
- **No Onion Services**: Tor hidden services (`.onion`) and live Tor proxies are not bound.
- **No Production Secrets**: Zero production database strings, API tokens, or admin passwords exist on the VM.
- **No Real Peer Connections**: Peer bridging remains strictly within the mock loopback/test harness until Milestone M3 explicit maintainer authorization.

---

## 5. Isolated CI Runner Feasibility Assessment

As requested in [Issue #1659](https://github.com/MyZubster-Ecosystem/myzubster/issues/1659), we evaluated the feasibility of hosting an isolated GitHub Actions runner inside `myzubster-wasim-dev`:

1. **User Space Feasibility**: GitHub Actions runner v2.338.0+ supports headless user-space execution without requiring root or daemon-level permissions.
2. **Resource Adequacy**: With 22 GB free disk space and a modern x86_64 Linux kernel (Ubuntu 24.04), the VM can comfortably execute unit, integration, and linter jobs.
3. **Isolation Benefit**: Running fork PR tests on `myzubster-wasim-dev` provides complete isolation from maintainer local machines and production servers, ensuring untrusted PR code never touches production environments.
4. **Recommendation**: If maintainers choose to activate a runner here, it should be configured as a repository-level runner scoped exclusively to the contributor fork or isolated testing workflows.

---

## 6. Reproducible Isolation Verification Commands

The following commands can be executed by any reviewer via SSH to independently verify that the security isolation criteria are strictly satisfied:

```bash
# 1. Verify user identity is unprivileged
id
# Expected output: uid=1001(wasim) gid=1001(wasim) groups=1001(wasim)

# 2. Verify sudo privilege escalation is blocked
sudo -n true 2>&1
# Expected output: sudo: a password is required (Exit code 1)

# 3. Verify disk boundaries and usage
df -h /
# Expected output: ~24G total, ~2.0G used, ~22G available (9% use)

# 4. Verify no unauthorized network daemons are listening publicly
ss -tulpn
# Expected output: Only sshd listening on loopback / Tailscale IP

# 5. Verify hermetic execution of seller lifecycle test
cd /home/wasim/myzubster
node scripts/run-seller-walkthrough-live.js
# Expected output: All 8/8 lifecycle checks pass in < 1.0s using MongoMemoryReplSet
```

---

## 7. Setup & Teardown Lifecycle

1. **Setup**:
   - VM starts via hypervisor; Tailscale service negotiates encrypted peer channel with maintainer and authorized contributors.
   - User `wasim` logs in via SSH key; Node.js LTS environment loaded from `~/.local/bin`.
2. **Execution**:
   - Tests run in ephemeral directories; Mongo replica sets allocated dynamically in RAM on ephemeral ports.
3. **Teardown**:
   - `MongoMemoryReplSet.stop()` releases memory and cleans socket handles.
   - Tailscale session terminates automatically on SSH disconnect; no daemon artifacts left running.
