# MyZubster Adoption Radar

This file records public, verifiable signals of independent participation and adoption around the MyZubster ecosystem.

## Classification

`DISCOVERY` → `INTEREST` → `FORK` → `CONTRIBUTION` → `INTEGRATION` → `DEPLOYMENT` → `VERIFIED_ADOPTION`

Entries must not imply partnership, endorsement, payment, commercial adoption or deployment unless the cited evidence explicitly establishes it.

## Timeline

### 2026-08-23 — CONTRIBUTION — Aming9303 / Signed technical identity

External contributor `Aming9303` submitted PR #602 and the contribution was merged into `main`. It defines an Ed25519-signed technical identity credential, an external trusted-key registry, strict canonicalization, signing/verifying CLIs, key fingerprint checks, revocation/rotation handling, validity windows and a broader negative-path test suite.

- **Component:** `MyZubster-Ecosystem/myzubster` — `identity/credential`
- **Classification:** `CONTRIBUTION`
- **Confidence:** `HIGH`
- **Evidence:** https://github.com/MyZubster-Ecosystem/myzubster/pull/602
- **Status:** merged 2026-08-23
- **Boundary:** verifies a substantial independent technical contribution. It does not establish legal identity certification, partnership, payment, third-party deployment or commercial adoption.

### 2026-08-22 — CONTRIBUTION — Aming9303 / Metasploit Sentinel visual set

External contributor `Aming9303` submitted and merged PR #12 to `MyZubster-Visual`, delivering a Metasploit Sentinel character sheet, cover, six-panel episode, regeneration documentation, AI/rights disclosure and safety review.

- **Component:** `MyZubster-Ecosystem/MyZubster-Visual` — Comic Universe / Metasploit Sentinel
- **Classification:** `CONTRIBUTION`
- **Confidence:** `HIGH`
- **Evidence:** https://github.com/MyZubster-Ecosystem/MyZubster-Visual/pull/12
- **Status:** merged 2026-08-22
- **Boundary:** verifies independent visual/creative contribution; it does not establish a production security deployment, Rapid7/Metasploit endorsement, partnership, payment or commercial adoption.

### 2026-08-22 — CONTRIBUTION — Aming9303 / Deterministic identity verifier

External contributor `Aming9303` submitted PR #600, rebased onto current `main` and approved after review. The contribution extracts deterministic verification into reusable code and adds fail-closed handling and synthetic tests for malformed input, tampering and spoofed organization URLs.

- **Component:** `MyZubster-Ecosystem/myzubster` — `identity/verifier`
- **Classification:** `CONTRIBUTION`
- **Confidence:** `HIGH`
- **Evidence:** https://github.com/MyZubster-Ecosystem/myzubster/pull/600
- **Status:** open / mergeable / approved at last verification
- **Boundary:** contribution status does not establish external deployment, partnership, payment or commercial adoption.

### 2026-08-22 — CONTRIBUTION — Aming9303 / Independent canonical hash reproduction

External contributor `Aming9303` submitted PR #603, rebased onto current `main` and approved after review. It independently reproduces the canonical SHA-256 identity-artifact hash and adds privacy-safe verification plus tampering, key-order, array-order and malformed-reference tests.

- **Component:** `MyZubster-Ecosystem/myzubster` — identity hash verification
- **Classification:** `CONTRIBUTION`
- **Confidence:** `HIGH`
- **Evidence:** https://github.com/MyZubster-Ecosystem/myzubster/pull/603
- **Status:** open / mergeable / approved at last verification
- **Boundary:** verifies artifact integrity work, not legal identity, external deployment, partnership, payment or commercial adoption.

### 2026-08-22 — CONTRIBUTION — Aming9303 / The Signal Garden

External contributor `Aming9303` submitted PR #604, an original six-page short-comic concept that uses MyZubster's observation → review → follow-up workflow as a material part of the story.

- **Component:** `MyZubster-Ecosystem/myzubster` — comics/contributor workflow
- **Classification:** `CONTRIBUTION`
- **Confidence:** `HIGH`
- **Evidence:** https://github.com/MyZubster-Ecosystem/myzubster/pull/604
- **Status:** open / mergeable at last verification
- **Boundary:** verifies independent creative use of the MyZubster workflow, not production usage, deployment, partnership, payment or commercial adoption.

### 2026-08-07 — CONTRIBUTION — Luzijano / MyZubsterGateway

External contributor `Luzijano` submitted and merged PR #420, adding a structured set of 50 Italian shop-marketing templates across five categories, A/B-test metadata, a reusable service/API for template retrieval and deterministic variant selection, documentation, and automated tests. The contribution spans 6 files with 1,854 additions and was merged into the canonical repository.

- **Component:** `MyZubster-Ecosystem/MyZubsterGateway`
- **Classification:** `CONTRIBUTION`
- **Confidence:** `HIGH`
- **Evidence:** https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/420
- **Boundary:** verifies substantial independent contribution to MyZubsterGateway; it does not by itself establish merchant adoption, commercial deployment, partnership, endorsement or payment.

## Promotion rule

A signal should only be promoted above `CONTRIBUTION` when public evidence shows independent use outside the normal upstream contribution workflow. Examples include a third-party repository importing MyZubster code/API/data, an independently operated reproducible deployment, a third-party integration, or documented external usage that can be verified without relying only on MyZubster-maintainer claims.
