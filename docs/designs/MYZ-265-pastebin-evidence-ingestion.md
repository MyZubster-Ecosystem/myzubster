# Technical Design: Read-Only Pastebin → GitHub → Zorgax Evidence Ingestion

**Issue / Tracking:** [GitHub Issue #1591](https://github.com/MyZubster-Ecosystem/myzubster/issues/1591) | [Linear MYZ-265](https://linear.app/myzubster/issue/MYZ-265/pilot-interoperabilita-pastebin-github-zorgax-read-only-antispam)  
**Author:** `@wasim-builds`  
**Classification:** Architecture & Security Specification (Design Proposal — Zero Code Execution)  
**Status:** `PROPOSED`  

---

## 1. Problem Statement & Context

Public Pastebin documents referencing MyZubster and community pilots exist, but past manual reviews showed significant contamination by malicious automated comments, credential stuffing, and deceptive cryptocurrency phishing links. 

To bridge valid external documentation into the MyZubster ecosystem without compromising security:
1. **External content is untrusted data**: It must never be evaluated, executed, or promoted automatically.
2. **Strict isolation**: Ingestion must be 100% read-only, non-interactive, and filtered for secrets, PII, and spam before reaching Zorgax.
3. **No automatic identity binding**: Claims of identity must require verifiable cryptographic or bidirectional GitHub proof before linking to any Contributor Passport.

---

## 2. Threat Model & Safeguards

| Threat Vector | Risk Level | Mitigation & Boundary |
|---|---|---|
| **Remote Code Execution (RCE)** | Critical | Treat all ingested payloads strictly as plain text (`text/plain`). Disallow HTML/JS rendering, shell piping, template interpolation, or `eval()`. |
| **Phishing / Malicious Links** | High | Aggressive regex stripping of URLs outside a strict domain allowlist (only `github.com/MyZubster-Ecosystem/*` allowed). Reject all crypto address patterns and shorten URL domains. |
| **Credential / Secret Ingestion** | High | Multi-pattern secret scanning (private keys, API tokens, mnemonic phrases). Any detection results in immediate drop and failure recording. |
| **Impersonation & Sybil Claims** | High | Unauthenticated pastes cannot claim contributor identity. Provenance requires a bi-directional reference (e.g., matching a public commit hash or issue signed by the contributor). |
| **Denial of Service / Bloat** | Medium | Payload size capped at 64 KB. Rate-limited retrieval (max 1 request per 10s per origin). SHA-256 deduplication to prevent replay bloat. |

---

## 3. Ingestion Pipeline Architecture

```
[ Explicit Allowlist Entry ]
           │
           ▼
[ Fetch Raw Plaintext (HTTP GET) ] ── (Size > 64KB?) ────────► [ REJECT: Over Max Size ]
           │
           ▼
[ SHA-256 Digest Computation ] ─── (Known Digest?) ──────────► [ REJECT: Duplicate ]
           │
           ▼
[ Anti-Spam & Threat Scanner ]
  ├─ Secret / PII detection
  ├─ Phishing URL detection
  └─ Exploits / Scam keyword filter
           │ (Violations detected)
           ├────────────────────────────────────────────────► [ REJECT: Security Policy Violation ]
           │ (Clean)
           ▼
[ Identity & Provenance Verification ]
  └─ Cross-reference declared GitHub commit / PR link
           │ (No valid linkage)
           ├────────────────────────────────────────────────► [ INGEST AS: ANONYMOUS UNVERIFIED ]
           │ (Verified)
           ▼
[ Knowledge Candidate Construction ]
  └─ Format into `myzubster.knowledge.evidence.v1`
  └─ Status: `PENDING_HUMAN_REVIEW`
           │
           ▼
[ Maintainer Human Review Gate ] ── (Approved by maintainer) ─► [ Promote to Knowledge Graph ]
```

---

## 4. Pipeline Specifications

### 4.1 Step 1: Pre-Approved Allowlist Schema
Ingestion is initiated only for records pre-declared in `data/pastebin_allowlist.json`:

```json
{
  "paste_id": "harmless-sample-01",
  "source_url": "https://pastebin.com/raw/harmless-sample-01",
  "declared_author": "contributor-alias",
  "github_reference": "https://github.com/MyZubster-Ecosystem/myzubster/pull/1582",
  "purpose": "Pilot verification documentation",
  "consent_persisted": true
}
```

### 4.2 Step 2: Secret & Content Sanitization Filters
Before processing, the plaintext payload is subjected to strict pattern evaluation:
- **Private Keys & Seeds**: Matches `-----BEGIN [A-Z ]+ PRIVATE KEY-----`, BIP-39 12/24-word seed dictionaries, and common secret tokens (`ghp_`, `xoxb-`, `AKIA[0-9A-Z]{16}`).
- **Cryptocurrency Addresses**: Drops any input matching Bitcoin (`^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$`), Ethereum (`^0x[a-fA-F0-9]{40}$`), or Monero (`^4[0-9AB][1-9A-HJ-NP-Za-km-z]{93}$`) addresses embedded in unapproved text.
- **Executable Code Signs**: Drops strings with shell invocations, `eval(`, `<script`, `powershell`, or `curl | sh`.

### 4.3 Step 3: Knowledge Candidate Representation
Sanitized payloads are transformed into a compliant candidate record matching the canonical `myzubster.knowledge.evidence.v1` schema:

```json
{
  "schema": "myzubster.knowledge.evidence.v1",
  "subject": "Pastebin Evidence Candidate",
  "domain": "interoperability-pilot",
  "claim": "Community pilot documentation bridge",
  "evidenceLevel": "unverified-external-paste",
  "evidenceRefs": [
    {
      "type": "pastebin_source",
      "reference": "https://pastebin.com/raw/harmless-sample-01"
    },
    {
      "type": "content_sha256",
      "reference": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    },
    {
      "type": "github_anchor",
      "reference": "https://github.com/MyZubster-Ecosystem/myzubster/pull/1582"
    }
  ],
  "reviewStatus": "PENDING_HUMAN_REVIEW",
  "version": "1"
}
```

---

## 4.4 SSRF & Redirect Protection

To prevent Server-Side Request Forgery (SSRF) and DNS rebinding attacks:
1. **Protocol Constraint**: Strictly enforce `https://`. Reject `http://`, `file://`, `ftp://`, or any other scheme.
2. **Strict Host Allowlist**: Host must match exactly `pastebin.com`. IP addresses or alternate hostnames are rejected.
3. **No Redirect Following**: HTTP client configured with `redirect: 'manual'` (`maxRedirects: 0`). Any `301`, `302`, `307`, or `308` redirect triggers immediate rejection (`REJECT_REDIRECT_DISALLOWED`).
4. **Private IP & DNS Pinning**: Resolution must reject RFC 1918 / loopback / link-local addresses (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, `fc00::/7`).

---

## 5. Reproducible Negative Rejection Test Cases

The test suite must implement and assert the following deterministic rejection cases:

| Test ID | Input Scenario / Vector | Expected Rejection Code | Expected Behavior |
|---|---|---|---|
| **NEG-01** | Paste URL attempts HTTP 302 redirect to another domain | `REJECT_REDIRECT_DISALLOWED` | Immediate drop; 0 bytes fetched from redirected host. |
| **NEG-02** | Payload size exceeds 65,536 bytes | `REJECT_PAYLOAD_TOO_LARGE` | Stream terminated; payload purged from memory. |
| **NEG-03** | Contains fake private key (`BEGIN RSA PRIVATE KEY`) | `REJECT_SECRET_DETECTED` | Ingestion aborted; audit log records pattern match without printing secret. |
| **NEG-04** | Contains BIP-39 12-word seed phrase format | `REJECT_SEED_DETECTED` | Ingestion aborted; rejected cleanly. |
| **NEG-05** | Contains Bitcoin or Ethereum crypto payment addresses | `REJECT_UNAUTHORIZED_CRYPTO_ADDRESS` | Ingestion aborted; protects against exploit/scam links. |
| **NEG-06** | Contains external URLs outside `github.com/MyZubster-Ecosystem/*` | `REJECT_DISALLOWED_LINK` | Ingestion aborted. |
| **NEG-07** | Paste not declared in `data/pastebin_allowlist.json` | `REJECT_NOT_IN_ALLOWLIST` | Request refused prior to any network I/O. |
| **NEG-08** | Declared GitHub user has no matching commit or signed issue | `REJECT_PROVENANCE_UNVERIFIED` | Ingestion aborted or marked unlinked. |

---

## 6. Formal Acceptance Criteria

- [ ] **Read-Only Ingestion**: Script uses standard GET requests with zero state mutation on external services.
- [ ] **SSRF & Redirect Defense**: Redirects (`3xx`) and non-allowlisted hosts are blocked with `REJECT_REDIRECT_DISALLOWED`.
- [ ] **Payload Sanitization**: 100% of negative test fixtures (NEG-01 through NEG-08) fail closed and produce reproducible rejection codes.
- [ ] **Candidate Conformity**: Valid synthetic paste produces a JSON candidate conforming to `myzubster.knowledge.evidence.v1` with `reviewStatus: "PENDING_HUMAN_REVIEW"`.
- [ ] **Zero Automatic Promotion**: Candidates cannot be published to the Knowledge Graph or Contributor Passport without manual maintainer review.
- [ ] **Zero Financial Cost**: Test execution runs entirely on local mock fixtures without VPS or third-party paid API requirements ($0.00).

---

## 7. Resource Impact & Boundaries

- **Compute & Storage**: Local Node script execution (< 100ms per paste, < 1 MB memory).
- **Financial Cost**: **$0.00**. No paid API tokens, VPS hosting, cloud buckets, or third-party gateways required.
- **Governance Gate**: Does not confer contributor status, KYC, bounty payout, or DAO voting power.

