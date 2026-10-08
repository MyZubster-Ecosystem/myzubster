# Contributor Connections — canonical evidence map

Updated: 2026-10-08

This document is an evidence-first index for public contributor relationships in MyZubster.

It does **not** establish legal identity, employment, partnership, funding, payment, professional certification, production approval, university endorsement, LIFE/EU endorsement, or full decentralization.

## State model

- `HISTORICAL_MERGE` — public contribution merged into the repository.
- `PASSPORT_OPT_IN_PENDING` — Contributor Passport / Knowledge link proposed; explicit consent not yet recorded.
- `PASSPORT_OPTED_IN` — contributor explicitly consented to the public evidence link.
- `NODE_PROPOSED` — independent-node checkpoint proposed.
- `NODE_READY` — exact repo/commit/runtime/fixture/commands frozen by both sides.
- `NODE_TESTED_PASS` — bounded checkpoint reproduced with public sanitized evidence.
- `NODE_TESTED_FAIL` — bounded checkpoint executed but did not meet expected result.
- `SETTLEMENT_UNVERIFIED` — no independently verifiable payout reference is recorded.
- `SETTLEMENT_DISPUTED` — contributor has explicitly identified an unresolved settlement/reward record.

A merged PR does not imply payment. A Passport link does not imply a node. A node test does not imply complete decentralization.

## Current connected / active contributor paths

| Contributor | Public contribution evidence | Passport / Knowledge | Node status | Settlement / boundary |
|---|---|---|---|---|
| `@nicolaususnicola-lgtm` | PR #1460; N4K48 public repo/evidence; live checkpoint recorded via #1545/#1547 | public contributor/pilot linkage exists | `NODE_TESTED_PASS` for the bounded N4K48 interoperability checkpoint | no payment inferred |
| `@khongten124` | PR #1451 and #1489 merged | Knowledge Card consent recorded; Open Period Care evidence linked | contributor-side interoperability previously recorded as `TESTED` for bounded scope | bounty #1450 funding/payout not inferred |
| `@wasim-builds` | PR #860, #637, #1513 merged | Passport link requested; character opt-in history exists | `NODE_PROPOSED` — checkpoint invitation sent | no new payment inferred |
| `@edvinas1573` | PR #1507 draft; maintainer reproduced 288 reconciliation combinations + 20 invalid cases | Passport link requested | `NODE_PROPOSED` | compensation request remains separate; no commitment inferred |
| `@Tanayqq` | PR #1456 submitted for #1442 | Passport link requested | `NODE_PROPOSED` | #1442 settlement remains governed by its explicit bounty state |
| `@lamkyo` | PR #1550 open for #1463 | Passport link requested | `NODE_PROPOSED` | PR currently has REQUEST_CHANGES; not merge/reward-ready |
| `@foxxx009` | multiple historical merges including #894 and #259 | public graph connection opt-in recorded with explicit limitations; no Passport publication consent | second-node checkpoint formalized in #1551 | no payment inferred |

## Second independent node checkpoint

Issue #1551 is the canonical coordination record for:

`N4K48 / @nicolaususnicola-lgtm <-> @foxxx009 independently controlled environment`

Current state: `NODE_PROPOSED`.

Do not promote this edge to `NODE_READY` until both participants freeze:
- repository;
- branch;
- commit SHA;
- environment/runtime;
- deterministic fixture/hash;
- exact commands;
- expected result.

Do not promote it to `NODE_TESTED_PASS` until the run produces public sanitized evidence.

## Historical contributors invited to reconnect

The following contributors have verified historical merged work and have been invited to opt into the Contributor Passport / Knowledge path and, optionally, an independent node checkpoint:

| Contributor | Verified historical merge evidence | Current connection state |
|---|---|---|
| `@foxxx009` | 12 merged PRs identified in historical scan | public graph connection opted in; node checkpoint #1551 proposed |
| `@Aming9303` | 11 merged PRs identified | `PASSPORT_OPT_IN_PENDING`, `NODE_PROPOSED` invitation |
| `@bilaldeveloper4312` | PR #262, #263, #264 merged | `PASSPORT_OPT_IN_PENDING`, `NODE_PROPOSED` invitation |
| `@nighshift-labs` | PR #408 merged | `PASSPORT_OPT_IN_PENDING`, `NODE_PROPOSED` invitation |
| `@charlieseay` | PR #276 merged | `PASSPORT_OPT_IN_PENDING`, `NODE_PROPOSED` invitation |
| `@Umesh-Tiruvalluru` | PR #257 merged | `PASSPORT_OPT_IN_PENDING`, `NODE_PROPOSED` invitation |
| `@leanworld7-netizen` | PR #57 merged | `PASSPORT_OPT_IN_PENDING`, `NODE_PROPOSED` invitation |
| `@abhiramvsmg` | PR #12 merged | `PASSPORT_OPT_IN_PENDING`, `NODE_PROPOSED` invitation |

Historical counts above describe the merged PRs identified in the repository scan used for this update; they are not a GitHub-wide contributor metric.

## Settlement-gated historical contributor

### `@laurentketterle-hub`

Verified historical merged work identified:
- #397 — Eva Ioni telemetry simulator
- #399 — Space Station telemetry dashboard
- #400 — Space Station Gateway API integration
- #278 — Reward dashboard
- #280 — QA reward system
- #281 — GitHub reward bot
- #283 — reward backend / MYZ assignment + minting

Current state:
- contribution evidence: `HISTORICAL_MERGE`
- settlement reference: `SETTLEMENT_UNVERIFIED`
- contributor position: `SETTLEMENT_DISPUTED`
- new pilot/node opt-in: **declined pending reconciliation**

Canonical reconciliation record: #1393.

Do not assign new pilot/node work to this contributor unless they independently opt in again after the historical reward record is reconciled or explicitly closed.

## Existing project-level connection records

Canonical supporting records include:
- #1505 — Pilot Node Network
- #1520 — contributor connection / graph coordination
- #1551 — second independent node checkpoint
- #1393 — contributor bounty reconciliation
- `docs/contributors/CONTRIBUTOR-INTEROPERABILITY-MATRIX.md`
- `docs/CONTRIBUTORS.md`
- `docs/GITHUB-COMMUNITY-NETWORK.md`
- `docs/CONTRIBUTOR-PILOT-NODES.md`
- `public/knowledge.html`

## Update rules

1. Never mark `TESTED` without a reproducible bounded run and public sanitized evidence.
2. Never mark a contributor as Passport-linked without explicit consent when a profile/Passport publication is involved.
3. A public PR reference may be indexed as contribution evidence without asserting identity beyond the public GitHub alias.
4. Never mark `PAID` without a verifiable settlement reference.
5. Keep Passport, node status, bounty/payment, character, Marketplace seller status and institutional/LIFE participation as separate dimensions.
6. Record regressions and failed checkpoints; do not preserve stale positive states when later evidence contradicts them.
7. Prefer links to canonical issues/PRs/commits over narrative claims.
