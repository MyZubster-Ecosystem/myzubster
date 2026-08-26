# MyZubster 2026 Execution Roadmap

> Canonical roadmap artifact for issue #395. This document is the single source of truth for the 2026 execution plan. Legacy or duplicate planning issues that contradict this roadmap should be closed in favor of this file.

## North Star
Take MyZubster from a development ecosystem of components to **a verifiable, stable, demonstrable product in a real pilot**, without anticipating regulated features or integrating third-party systems without authorization.

## Absolute Priorities
1. **Technical stability and green CI**
2. **Security baseline + release gates**
3. **Space Station MVP end-to-end** as a demonstrable vertical slice
4. **AI Automation** as an internal operational layer
5. **One concrete commercial pilot** with a single initial workflow
6. Only after: payment/crypto production and RWA, subordinated to legal/compliance gates

---

# PHASE 0 — RESET & STABILIZATION
**Goal:** have a reliable technical baseline.

### P0 — Blockers
- [ ] #374 — resolve conflict markers in `gardens.js`
- [ ] #375 — restore missing dependencies/imports
- [ ] #376 — fix Gardens contract/routing and 404 tests
- [ ] #377 — npm vulnerability audit and remediation
- [ ] #378 — stabilize TARI submodule in CI
- [ ] Verify clean CI on supported Node versions
- [ ] Remove duplications/legacy issues that contradict the roadmap

### Definition of Done
- Clean checkout installation is reproducible
- Main tests are green
- No conflict markers
- Critical security findings resolved or formally mitigated
- Green CI without local workarounds

---

# PHASE 1 — PLATFORM FOUNDATION
**Goal:** define the common foundations that all modules must use.

- [ ] Entity schema/versioning
- [ ] API conventions and error contract
- [ ] Authentication + RBAC
- [ ] Audit trail/event model
- [ ] Deterministic synthetic fixtures
- [ ] Secure and sanitized logging
- [ ] Configuration/secrets management
- [ ] Rate limiting
- [ ] Backup/recovery baseline
- [ ] Security checklist applicable to every new module

### Gate
No important new module enters the roadmap without tests, audit, API documentation, and security baseline.

---

# PHASE 2 — SPACE STATION MVP
**Goal:** build the first complete, demonstrable vertical slice.

## Core
- [ ] #382 — SpaceStation model
- [ ] #383 — Mission model
- [ ] #384 — event + audit trail
- [ ] #385 — CRUD/search API
- [ ] #386 — synthetic fixtures
- [ ] #387 — security/compliance baseline
- [ ] #388 — tests + CI
- [ ] #389 — API contract + documentation

## Telemetry
- [ ] #390 — Eva Ioni simulator
- [ ] #391 — telemetry ingestion/storage/API
- [ ] #392 — telemetry dashboard

## Integration
- [ ] #393 — Gateway API integration

### Vertical Slice acceptance test
`Eva simulator -> telemetry API -> persistence -> dashboard -> audit trail -> Gateway`

The flow must be runnable locally with synthetic data, reproducible from clean checkout, and demonstrable without dependencies on real hardware.

---

# PHASE 3 — AI AUTOMATION
**Goal:** use AI automation to reduce operational work and improve quality/review.

- [ ] GitHub issue monitoring
- [ ] Issue classification/triage
- [ ] Automated PR review with human-in-the-loop approval

> Note: subsequent phases (commercial pilot, payment/crypto production, RWA) are intentionally deferred behind the legal/compliance gates described in the North Star. They will be expanded in this file once the corresponding gates are satisfied.

---

## Maintenance
- This file is updated as phases progress. Checked items are completed work; unchecked items are pending.
- When a phase reaches its Definition of Done, add the completion date next to the phase heading.
- Any new planning issue that overlaps with this roadmap must either update this file or be closed as a duplicate.
