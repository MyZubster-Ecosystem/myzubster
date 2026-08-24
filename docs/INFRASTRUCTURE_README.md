# MyZubster Infrastructure — README

> Evidence-first infrastructure map. This document distinguishes what is visible in the repository from deployment targets and future architecture. It contains no secret values and must never be used as a place to publish credentials.

## 1. Purpose

This README explains how the technical infrastructure around MyZubster fits together: source repositories, clients, backend services, persistence, AI/automation, CI, deployment, TV/mobile artifacts, evidence storage and external integrations.

It is an architecture/operations guide, not proof that every listed target is currently deployed or production-ready.

## 2. High-level map

```text
                         USERS / DEVICES
                ┌──────────┼───────────┐
                ▼          ▼           ▼
               Web       Mobile      Google TV
                │          │           │
                └──────────┼───────────┘
                           ▼
                    Frontend / Clients
                           │
                           ▼
                      Backend API
             ┌─────────────┼──────────────┐
             ▼             ▼              ▼
          MongoDB      AI/Automation   Domain services
             │             │              │
             └─────────────┼──────────────┘
                           ▼
                   Evidence / integrations

        GitHub ── CI / PR / source / artifacts / docs
        Vercel ── web deployment / previews where configured
        Drive  ── selected GitHub-bound archive assets
```

## 3. Source-control boundary

GitHub is the canonical engineering collaboration layer for:

- source code;
- branches;
- pull requests;
- issues;
- CI workflows;
- build artifacts where configured;
- documentation;
- evidence/provenance records suitable for public source control.

Operational rule:

```text
change
  ↓
dedicated branch
  ↓
Draft PR
  ↓
CI / security / review
  ↓
human merge decision
```

Do not push operational changes directly to `main`/`master` as part of automated maintenance.

## 4. Repository domains

The ecosystem is not one executable binary. It includes multiple technical domains:

```text
myzubster repository
 ├── frontend
 ├── backend
 ├── services
 ├── CI/workflows
 ├── documentation
 ├── TV/web-TV work
 ├── infrastructure/container configuration
 └── domain modules

MyZubster-App repository
 └── mobile / Android application build path
```

Other repositories may exist in the organisation; inclusion here should be evidence-based rather than assumed from naming alone.

## 5. Frontend

The main frontend is the browser-facing application layer.

Responsibilities can include:

- account/user interfaces;
- environmental dashboards;
- observations;
- proposal/DAO surfaces;
- public documentation/evidence views;
- garden interfaces;
- TV-compatible web surfaces where implemented.

The frontend must not be trusted to enforce ownership or financial authorization by itself. Sensitive authorization belongs server-side.

## 6. Backend API

The backend is the primary trust boundary for application operations.

Expected responsibilities include:

- authentication validation;
- authorization;
- ownership checks;
- data validation;
- domain operations;
- proposal/governance APIs;
- observation workflows;
- controlled external-service integration;
- audit/evidence generation where implemented.

Client input must be treated as untrusted.

## 7. Persistence

The repository's Docker Compose configuration currently declares a **MongoDB 6** service with persistent volume storage.

Conceptual path:

```text
Backend
  ↓
MongoDB
  ↓
application/domain records
```

Persistent application data must not be modified casually by documentation/CI automation.

Backups, retention, production replication and disaster recovery must be documented separately before claiming production resilience.

## 8. Docker development stack

The current `docker-compose.yml` declares these services:

| Service | Repository role | Container port / exposed port |
|---|---|---|
| `mongodb` | database | 27017 / host 27018 |
| `backend` | application API | 3009 / host 3010 |
| `frontend` | web application | 3000 / host 3000 |
| `ai-automation` | AI/automation service | 3002 / host 3004 |
| `onion` | Tor/onion frontend target | internal target to frontend |

All are attached to the `myzubster-network` bridge network in the current Compose definition.

These settings describe the repository's container configuration, not necessarily the public production topology.

## 9. Important Docker security note

The Compose file currently contains a development fallback value for the MongoDB password when `MONGO_PASSWORD` is not supplied.

That fallback must be treated as **development-only** and must not be considered a production secret or safe production credential.

Production environments should require externally managed secret values and fail closed when required secrets are absent.

This README intentionally does not reproduce or expose secret/token values.

## 10. AI / automation service

The Compose stack contains an `ai-automation` service under `services/ai-automation`.

Infrastructure boundary:

```text
AI service
  ↓
analysis / assistance / automation
  ↓
validated backend boundary
  ↓
application effect
```

An AI output must not automatically become an irreversible financial, governance or physical action without appropriate authorization.

API keys belong in secret management/environment configuration, never hard-coded in source or documentation.

## 11. Zorgax

Zorgax is the higher-level assistant/operator concept spanning multiple infrastructure surfaces.

Operationally, Zorgax may inspect evidence and use authorised tools to help with:

- GitHub/CI diagnostics;
- documentation;
- evidence classification;
- ecosystem operations;
- environmental analysis support;
- governance analysis.

Zorgax is not itself the database, deployment provider or source-control system.

## 12. Web deployment

Vercel is used for MyZubster web deployment/preview workflows where configured.

The correct deployment evidence ladder is:

```text
source commit
  ↓
CI success
  ↓
deployment build success
  ↓
deployment READY
  ↓
accessible smoke test
  ↓
functional verification
```

`READY` alone does not prove that every authenticated route or user flow works.

Preview access may also be protected by deployment-provider authentication/SSO; that limitation must be recorded rather than bypassed.

## 13. CI/CD

GitHub Actions is the repository CI layer.

CI should keep separate concerns observable:

- backend tests;
- frontend tests;
- lint/static checks;
- security audit;
- Android/TV builds;
- artifact checksums;
- framework-upgrade validation.

A workflow that did not execute is not equivalent to a passing workflow.

## 14. Baseline vs PR regression

When a PR fails CI, always determine:

```text
Does the same failure exist on base/main?
       │
       ├── yes → baseline problem
       └── no  → candidate PR regression
```

This prevents incorrectly attributing existing repository failures to a documentation or feature branch.

## 15. Mobile / Android app

`MyZubster-App` provides the mobile/Android application path.

The current operational model for Beta builds is intended to be reproducible through CI rather than relying on undocumented local builds.

Build evidence should include:

- source commit;
- workflow/run ID;
- artifact ID/name;
- SHA-256;
- build type (`debug`, `release`, etc.);
- dependency/security status;
- device-test status.

A successfully generated APK is not automatically approved for public distribution.

## 16. Android Beta security gate

The Android Beta pipeline has demonstrated that build success and dependency security are separate gates.

Conceptually:

```text
APK BUILT
   ↓
dependency/security audit
   ↓
critical/high remediation
   ↓
rebuild
   ↓
device QA
   ↓
PUBLIC BETA APPROVAL
```

Do not publish a Beta merely because `assembleDebug` succeeds.

## 17. Google TV / Android TV

The TV layer has multiple parts:

- web TV experience;
- Android TV scaffold/build;
- garden-streaming architecture;
- character/metaverse navigation targets;
- downloadable APK artifact lifecycle.

TV readiness requires more than compilation:

```text
build
  ↓
checksum/provenance
  ↓
install on real Google TV/Android TV
  ↓
D-pad/focus/back verification
  ↓
stream/auth verification
  ↓
release decision
```

## 18. Garden streaming infrastructure

A secure garden-streaming design should avoid exposing camera credentials to clients.

```text
Camera / gateway
      ↓
stream origin / relay
      ↓
authorised backend access
      ↓
short-lived playback URL/session
      ↓
Web / TV client
```

Requirements include ownership checks, TLS, expiring access, logging/rate limits where appropriate and a clear offline/error state.

## 19. Network boundaries

The local Compose network is an implementation convenience, not a complete security model.

For production, explicitly document:

- public ingress;
- private services;
- database exposure;
- TLS termination;
- firewall/network policy;
- service-to-service authentication;
- outbound integration permissions.

Database ports should not be assumed public merely because a development Compose file maps them to localhost/host networking.

## 20. Onion/Tor service

The Compose file includes an `onion` service targeting the frontend and persisting onion data.

Its presence proves that an onion-service container path is represented in repository configuration. It does **not** by itself prove that a public Tor service is currently reachable, production-supported or monitored.

Production claims require independent reachability and operational evidence.

## 21. Environment configuration

Environment variables are used to connect services and configure runtime behaviour.

Never publish values for:

- API keys;
- passwords;
- private keys;
- wallet seeds;
- webhook secrets;
- bot tokens;
- database production credentials;
- camera credentials.

Documentation may list **variable names and purpose**, but not secret values.

## 22. Secrets management target

Production target:

```text
source repository
   X  no secret values

CI/deployment secret store
   ↓
runtime injection
   ↓
least-privilege service
```

Secret rotation and incident response should be documented before production maturity is claimed.

## 23. Authentication and authorization

Authentication answers:

> Who is this user/service?

Authorization answers:

> Is this identity allowed to perform this specific action on this specific resource?

Both are required.

Garden ownership, private observations, governance actions, settlement operations and administrative routes require explicit authorization checks.

## 24. Financial boundary

Treasury/reward/payment infrastructure must remain separated from ordinary application state.

```text
application decision
  ↓
authorised financial boundary
  ↓
transaction submission
  ↓
independent settlement verification
```

A database field saying `paid` is not sufficient evidence by itself for an external payment.

## 25. DAO infrastructure

DAO infrastructure consists of application models/routes/UI plus any future execution boundary.

Governance infrastructure should enforce:

- voter authorization;
- duplicate-vote prevention;
- deterministic tally;
- server-side time windows;
- quorum/threshold calculation;
- proposal state transitions;
- audit trail;
- controlled execution payloads.

Zorgax's advisory role must remain non-binding unless governance rules are explicitly and safely changed.

## 26. Evidence infrastructure

MyZubster uses evidence-first operational practices.

Useful evidence includes:

- Git commit SHA;
- PR number;
- workflow run;
- artifact ID;
- SHA-256;
- deployment ID/state;
- test output;
- independently verifiable external reference.

Evidence should identify exactly what it proves and what it does not prove.

## 27. Google Drive archive boundary

Selected assets intended for GitHub/Chronicle workflows may be archived in the designated MyZubster Zorgax Chronicle Drive folder.

Drive is not the canonical source-code repository and must not become an untracked dumping ground.

Archive only assets with a defined GitHub/evidence destination and do not change sharing permissions as part of routine ecosystem operations.

## 28. Public evidence / IPFS

Where public-evidence or IPFS components are used, treat content addressing as a provenance mechanism, not automatic truth verification.

A hash can prove that bytes match a referenced object. It does not prove that the statement inside those bytes is scientifically or legally true.

## 29. Observability

A production infrastructure should expose enough telemetry to answer:

- Is the service up?
- Are requests failing?
- Is the database reachable?
- Are authentication failures abnormal?
- Are queues/jobs stuck?
- Are garden streams healthy?
- Are deployments healthy?
- Are dependencies/security checks failing?

Logs must avoid unnecessary secrets and sensitive personal data.

## 30. Health checks

Container/service health should be explicit where practical.

The current Compose definition includes a healthcheck for the onion service. Other critical production services should have equivalent operational checks appropriate to their runtime.

A process being alive is not always the same as the application being healthy.

## 31. Backups and recovery

Before production readiness, persistent services require documented:

- backup scope;
- backup frequency;
- encryption/access policy;
- retention;
- restore procedure;
- restore test evidence;
- recovery objectives where applicable.

Do not claim disaster recovery merely because a Docker volume exists.

## 32. Dependency security

Each runtime has a dependency lifecycle:

```text
dependency inventory
  ↓
audit/scanning
  ↓
triage
  ↓
supported update
  ↓
tests/build
  ↓
release
```

Avoid blindly using force-upgrade commands when the supported remediation requires a framework major upgrade.

## 33. Supply-chain integrity

Build artifacts should be traceable back to source.

Minimum provenance:

```text
repository
commit SHA
workflow definition
workflow run
artifact
SHA-256
```

For stronger production maturity, add signing/attestation and controlled release channels.

## 34. Branch and release policy

Safe ecosystem-operator rule:

- dedicated branches;
- Draft PR by default;
- no force push;
- no automatic merge;
- no direct main/master changes;
- human decision for release/promotion;
- security gates before public binaries.

## 35. Infrastructure maturity labels

Use explicit states:

- `CONFIGURED` — configuration exists in source;
- `BUILD_VERIFIED` — build succeeded for a known commit;
- `CI_VERIFIED` — required automated checks succeeded;
- `DEPLOYED` — deployed to an intended environment;
- `REACHABILITY_VERIFIED` — independently reachable where intended;
- `DEVICE_VERIFIED` — tested on target hardware;
- `SECURITY_REVIEWED` — defined security gate passed;
- `PRODUCTION_READY` — operational, security, recovery and release gates passed.

Do not use `configured` as a synonym for `deployed`.

## 36. Development topology vs production topology

The checked-in Compose topology is primarily useful as a reproducible local/development model.

```text
Development
Docker Compose
single bridge network
mapped local ports
local volumes

Production target
managed ingress
secret management
private persistence
TLS
monitoring
backups
scaling/recovery policy
```

The exact production topology must be evidenced from actual deployment configuration rather than inferred from Compose.

## 37. Failure classification

For incidents, record separately:

### Symptom
What failed visibly?

### Cause
What evidence demonstrates the actual failure mechanism?

### Hypothesis
What is suspected but not yet demonstrated?

### Fix
What change was applied?

### Verification
What proves the fix worked?

This structure should be used for CI, deployments, app builds and runtime incidents.

## 38. Infrastructure Definition of Done

The infrastructure can be called production-ready only when at minimum:

```text
source-controlled architecture
  ↓
reproducible CI builds
  ↓
security/dependency gates
  ↓
managed secrets
  ↓
server-side auth/authz
  ↓
private/controlled persistence
  ↓
TLS + network boundaries
  ↓
observability + health checks
  ↓
backup + tested restore
  ↓
deployment provenance
  ↓
real smoke/device tests
  ↓
incident/recovery procedure
```

Subsystems may reach these gates independently.

## 39. Quick operator checklist

Before changing infrastructure:

- identify the exact repository/component;
- inspect current PRs and incidents to avoid duplication;
- never read/publish secret values unnecessarily;
- create a dedicated branch;
- make the smallest bounded change;
- run relevant CI/security checks;
- preserve artifact/checksum evidence;
- verify deployment/device separately from build;
- document remaining limitations;
- leave merge/release decisions to an authorised human.

---

## Infrastructure principle

**MyZubster infrastructure should make every important transition traceable: from source code to build, from build to deployment, from identity to authorised data access, and from real-world evidence to the digital experience — without confusing configuration with operation or automation with authority.**
