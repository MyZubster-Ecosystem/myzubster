# MyZubster — Asset & Dependency Register

**Status:** PUBLIC / LIVING SECURITY REGISTER  
**Baseline date:** 29 August 2026  
**Security control:** SEC-01 — Asset inventory

> This register records assets and dependency boundaries that are actually evidenced by the MyZubster GitHub organization/repositories. It is not a penetration-test report, SBOM, certification, production-deployment attestation or proof that every dependency is vulnerability-free.

## Security rule

> **UNKNOWN ASSET → NO PRODUCTION TRUST**  
> **UNKNOWN DEPENDENCY → REVIEW BEFORE DEPLOYMENT**  
> **SECRET / WALLET / PRIVILEGED ACCESS → RESTRICTED + HUMAN-AUTHORIZED**

## 1. Repository / system asset inventory

The organization inventory currently evidences the following material repositories/systems. Visibility is recorded because private components require separate access, secret and dependency review.

| ID | Asset / repository | Visibility | Security relevance | Dependency / trust boundary | Status |
|---|---|---|---|---|---|
| AST-01 | `MyZubster-Ecosystem/myzubster` | Public | Core ecosystem, canonical governance/contracts/docs | GitHub, Node/JS where present, external settlement integrations | `INVENTORIED` |
| AST-02 | `MyZubster-Ecosystem/MyZubsterGateway` | Public | Integration/API/payment boundary | Node.js, MongoDB design, wallet/RPC integrations, environment configuration | `HIGH-REVIEW` |
| AST-03 | `MyZubster-Ecosystem/MyZubster-App` | Public | Mobile/client surface | client dependencies, APIs, wallet/payment interfaces | `REVIEW` |
| AST-04 | `MyZubster-Ecosystem/MyZubster-Marketplace` | Public | Marketplace/contributor transaction surface | application dependencies, API/data/payment boundaries | `HIGH-REVIEW` |
| AST-05 | `MyZubster-Ecosystem/MyZubster-Robot` | Public | Robotics / physical-world interface | device, network, wallet/x402 and hardware boundaries | `HIGH-REVIEW` |
| AST-06 | `MyZubster-Ecosystem/myzubster-animal-registry` | Public | Registry/NFC/data verification | Node package lock; registry provider; NFC; browser/device interfaces | `REVIEW` |
| AST-07 | `MyZubster-Ecosystem/myzubster-docs` | Public | Public documentation | publication integrity / links / claims | `INVENTORIED` |
| AST-08 | `MyZubster-Ecosystem/MyZubster-Visual` | Public | Visual/evidence presentation | media provenance, frontend dependencies | `REVIEW` |
| AST-09 | `MyZubster-Ecosystem/myzubster-manuals` | Public | Manuals/STEM documentation | publication integrity | `INVENTORIED` |
| AST-10 | `MyZubster-Ecosystem/MyZubster-Photos` | Public | Photo/media evidence | metadata, privacy, provenance, storage | `HIGH-REVIEW` |
| AST-11 | `MyZubster-Ecosystem/myzubster-space-station` | Public | Robotics/IoT experimental infrastructure | physical systems, network/device interfaces | `HIGH-REVIEW` |
| AST-12 | `MyZubster-Ecosystem/myzubster-platform` | Public | Platform application | app/runtime/data dependencies | `HIGH-REVIEW` |
| AST-13 | `MyZubster-Ecosystem/MyZubsterWeb` | Public | Web/public interface | browser/frontend/API dependencies | `REVIEW` |
| AST-14 | `MyZubster-Ecosystem/EVA-IONI` | Public | AI/automation-related ecosystem component | model/agent/data/tool boundaries to be enumerated | `HIGH-REVIEW` |
| AST-15 | `MyZubster-Ecosystem/myzubster-verifier` | Private | Verification component | restricted code/data/credentials | `RESTRICTED-REVIEW` |
| AST-16 | `MyZubster-Ecosystem/myzubster-ai-bot` | Private | AI agent/bot | model provider, prompts, tools, credentials, user data | `RESTRICTED-REVIEW` |
| AST-17 | `MyZubster-Ecosystem/MyZubster-Nythera` | Private | Internal ecosystem component | dependencies not yet publicly classified | `RESTRICTED-REVIEW` |
| AST-18 | `MyZubster-Ecosystem/myzubster-escrow-api` | Private | Escrow/payment boundary | wallet/payment/credential/API trust boundary | `CRITICAL-REVIEW` |
| AST-19 | `MyZubster-Ecosystem/MyZubster-Zorgax` | Private | AI/agent component | model/tool/data/credential boundaries | `RESTRICTED-REVIEW` |
| AST-20 | `MyZubster-Ecosystem/MyZubster-Oruun` | Private | Internal ecosystem component | dependencies not yet publicly classified | `RESTRICTED-REVIEW` |
| AST-21 | `MyZubster-Ecosystem/MyZubster-Selya-9` | Private | Internal ecosystem component | dependencies not yet publicly classified | `RESTRICTED-REVIEW` |
| AST-22 | `MyZubster-Ecosystem/MyZubster-Robot-Stack` | Private | Robotics/IoT stack | device/network/hardware/payment interfaces | `CRITICAL-REVIEW` |
| AST-23 | `MyZubster-Ecosystem/ai-automation` | Private | Automation/agent workflows | external APIs, tokens, model/tool permissions | `CRITICAL-REVIEW` |

`INVENTORIED` means the asset is identified. It does **not** mean security review is complete.

## 2. Known technology / external dependency classes

Only dependencies supported by repository evidence are listed as `EVIDENCED`. Others remain to be extracted from manifests/lockfiles.

| DEP ID | Dependency / class | Evidence / use | Risk focus | State |
|---|---|---|---|---|
| DEP-01 | GitHub | Source, issues, PRs, CI/governance surface | account compromise, token permissions, branch integrity, supply chain | `EVIDENCED` |
| DEP-02 | Node.js / JavaScript ecosystem | Multiple public repositories are JavaScript-based | npm supply chain, malicious/transitive package, lifecycle scripts | `EVIDENCED` |
| DEP-03 | npm lock/manifests | `package-lock.json` evidenced in animal registry; manifests expected elsewhere but require per-repo extraction | pinning, outdated/vulnerable transitive packages | `PARTIAL` |
| DEP-04 | MongoDB | Gateway development architecture references MongoDB | authentication, exposure, backup, injection/access controls | `EVIDENCED-DESIGN` |
| DEP-05 | Docker / Compose | Gateway development work explicitly defines Docker Compose / Dockerfile environment | image provenance, exposed ports, secrets, privilege, stale base images | `EVIDENCED-DESIGN` |
| DEP-06 | Monero / wallet RPC | Settlement/payment and gateway work references Monero wallet/RPC | keys, RPC authentication, transaction verification, network boundary | `CRITICAL` |
| DEP-07 | Tari wallet RPC | Gateway work references Tari wallet integration and environment endpoints | wallet credentials, RPC authorization, settlement semantics | `CRITICAL-DESIGN` |
| DEP-08 | NFC / browser/device APIs | Animal registry NFC tooling | untrusted tag input, spoofing, privacy, verifier trust | `EVIDENCED` |
| DEP-09 | Registry provider/source of truth | NFC verification requires configured provider | provider compromise, stale/false source, authorization | `EVIDENCED` |
| DEP-10 | AI/model providers | AI/bot/Zorgax/EVA/automation assets imply model/tool dependency but exact providers are not established by this register | data disclosure, prompt injection, tool abuse, model/version change | `TO-ENUMERATE` |
| DEP-11 | Sensors / GIS / IoT | Pilot architecture | device identity, tampering, geolocation/privacy, data integrity | `CANDIDATE` |
| DEP-12 | External institutional/partner data | Candidate pilots and evidence workflows | authorization, confidentiality, provenance, retention | `AUTHORIZATION-GATED` |

## 3. Critical asset classes

These must never be placed in a public inventory with actual secret values.

| Class | Examples | Minimum control |
|---|---|---|
| Secrets | API tokens, GitHub tokens, OAuth secrets | secret manager/environment protection; never commit |
| Wallet secrets | private keys, seed phrases, signing material | restricted custody; no repository storage; documented recovery |
| Privileged endpoints | wallet RPC, admin API, databases | authentication + network restriction + logging |
| Personal data | contributor/user/contact/location data | GDPR data inventory + least privilege |
| Pilot credentials | partner/site/system access | written authorization + scoped account + expiry/revocation |
| AI tool credentials | agent API/tool tokens | least privilege + human authorization for consequential actions |
| Evidence originals | measurements, photos, logs, validation records | integrity/provenance + access classification + retention |

## 4. Dependency extraction backlog

For every executable repository, create or verify the following evidence:

- package/application manifest(s);
- lockfile(s) and exact versions where available;
- container base images and tags/digests;
- runtime version;
- external APIs/RPCs and purpose;
- database/storage engines;
- CI/CD actions and pinned revisions;
- privileged environment variables **by name only**, never values;
- network listeners/ports;
- deployment platform/region where applicable;
- dependency license;
- vulnerability scan/SBOM date and tool;
- owner/reviewer and next review date.

## 5. Per-repository dependency record template

```text
REPOSITORY:
OWNER / REVIEWER:
RUNTIME:
MANIFESTS:
LOCKFILES:
DIRECT DEPENDENCIES:
CONTAINER IMAGES:
DATABASE / STORAGE:
EXTERNAL API / RPC:
CI/CD THIRD-PARTY ACTIONS:
PRIVILEGED ENV VAR NAMES:
PUBLIC NETWORK SURFACE:
PERSONAL / RESTRICTED DATA:
SBOM:
VULNERABILITY SCAN:
CRITICAL FINDINGS:
REMEDIATION OWNER:
LAST REVIEW:
NEXT REVIEW:
SECURITY GO / NO-GO:
```

## 6. Production gate

An asset must remain `NO-GO` for production/high-impact deployment when any of the following applies:

1. asset owner/responsible person is unknown;
2. runtime/manifests/lockfiles have not been identified for executable code;
3. critical external APIs/RPCs are undocumented;
4. secret storage or privileged access is uncontrolled;
5. a critical vulnerability is unresolved without an approved, documented risk decision;
6. required third-party/site/data authorization is missing;
7. backup/recovery or incident ownership is required but undefined;
8. a physical-world/financial/regulated function lacks its separate safety/compliance review.

## 7. Evidence boundary

This first baseline is based on the GitHub organization/repository inventory and currently visible repository evidence. It intentionally does **not** claim that:

- all runtime dependencies have already been enumerated;
- all repositories are deployed;
- private repositories have been security-audited;
- Docker/MongoDB/Tari/Monero design references prove production use;
- a closed issue or merged PR proves a secure production deployment;
- an asset is vulnerability-free because it appears in this register.

## 8. Next security evidence

The next SEC-01/SEC-02 pass should extract exact dependency manifests and lockfiles repository-by-repository, then produce an SBOM/vulnerability evidence record. Priority order:

`escrow/payment & wallet boundaries → Gateway → AI/automation agents → robotics/IoT → marketplace/platform → public clients → documentation/media`.

## Related controls

- [`CYBERSECURITY-BASELINE-THREAT-MODEL-INCIDENT-RESPONSE.md`](CYBERSECURITY-BASELINE-THREAT-MODEL-INCIDENT-RESPONSE.md)
- [`ITALY-COMPLIANCE-REGISTER.md`](ITALY-COMPLIANCE-REGISTER.md)
- [`GDPR-PRIVACY-DATA-INVENTORY.md`](GDPR-PRIVACY-DATA-INVENTORY.md)
- [`GDPR-ARTICLE-30-ROPA.md`](GDPR-ARTICLE-30-ROPA.md)
- [`AI-INVENTORY-AI-ACT-CLASSIFICATION.md`](AI-INVENTORY-AI-ACT-CLASSIFICATION.md)

**Security posture statement:** inventory is evidence of awareness and control scope, not proof of certification or complete security.