# MyZubster External & LIFE Bounty Federation

Status: `PROPOSED`

Tracking issue: #734

This document defines one reusable bounty framework for LIFE-aligned work and independently governed external ecosystems such as Aruba-related cloud-support concepts, Metasploit defensive-security tooling, Monero/privacy projects, metaverse/WebXR projects and future external organizations.

The framework is owned and governed by MyZubster. Naming an external organization or open-source project in a bounty does **not** mean that organization sponsors, funds, approves, endorses, employs, partners with or has adopted MyZubster.

## 1. Core rule

A federated bounty must reward a **specific, bounded, verifiable deliverable**. It must not reward a vague relationship claim, speculative partnership, brand association or unverifiable adoption claim.

Every bounty inherits the canonical rules in [`BOUNTIES.md`](../BOUNTIES.md) and [`TREASURY.md`](../TREASURY.md).

## 2. Tracks

| Track | Typical work | Existing anchors | Mandatory boundary |
|---|---|---|---|
| `LIFE` | baseline/KPI, MRV, IoT, human validation, dashboards, replication, official-source research | #533–#538 | LIFE-aligned != LIFE-funded/approved |
| `ARUBA` | generic support workflows, cloud portability, deployment evidence, runbooks, accessibility | #712 | independent concept unless relationship evidence exists |
| `METASPLOIT` | defensive lab/staging validation, findings import, CVE/CWE/CVSS mapping, regression/remediation | #487–#490 | authorized targets only; no destructive/third-party testing |
| `MONERO` | upstream docs/tests, stagenet-safe work, privacy/non-custodial architecture, reconciliation | #356–#360 | fork/PR != Monero endorsement/adoption |
| `METAVERSE` | WebXR, Vircadia/Decentraland-style interoperability, provenance, accessibility, upstream contributions | #726, #733 | integration != partnership; upstream governs acceptance |
| `EXTERNAL_OTHER` | any other verified external project/organization | requires primary source | no speculative brand-only bounty |

## 3. Admission gate

A new external track or bounty can be created only if at least one of these exists:

- a public upstream repository, issue or pull request;
- an official call/program source;
- a documented MyZubster roadmap/architecture need;
- a public technical specification/API;
- a maintainer-approved, concrete integration target;
- an explicit external communication that is safe to cite and does not contain confidential data.

A company/project name by itself is not enough.

## 4. Required metadata

Every federated bounty must state:

```text
track: LIFE | ARUBA | METASPLOIT | MONERO | METAVERSE | EXTERNAL_OTHER
relationship: none | independent | verified
relationship_evidence: <public/approved evidence or null>
source_of_truth: <issue/repo/spec/call/docs>
upstream_state: NONE | FORK | PR_OPEN | CHANGES_REQUESTED | MERGED | CLOSED
work_status: PROPOSED | VALIDATED | APPROVED | ACTIVE | SUBMITTED | UNDER_REVIEW | VERIFIED | REJECTED
reward_unit: MYZ | XMR | TOKEN | none
reward_amount: <explicit value or none>
funding_state: PROPOSED | APPROVED | FUNDED | EXTERNAL_UNFUNDED
review_mode: normal | manual | multi-review
sensitivity: low | medium | high
```

`relationship=verified` requires explicit evidence. Otherwise use `none` or `independent`.

## 5. Work lifecycle

```text
DISCOVERY
→ PROPOSED
→ VALIDATED
→ APPROVED
→ FUNDED            # only when external settlement needs a real reservation
→ ACTIVE
→ SUBMITTED
→ UNDER_REVIEW
→ VERIFIED | REJECTED
→ REWARD_RECORDED
→ SETTLEMENT_PENDING | SETTLED/PAID
```

Issue creation, assignment, PR, CI success, merge or upstream acceptance do not skip these gates.

## 6. External-adoption lifecycle

External adoption is tracked separately from bounty completion:

```text
DISCOVERY
→ INTEREST
→ FORK
→ CONTRIBUTION
→ INTEGRATION
→ DEPLOYMENT
→ VERIFIED_ADOPTION
```

Examples:

- a fork is `FORK`, not adoption;
- an upstream pull request is `CONTRIBUTION`, not partnership;
- an adapter merged only in MyZubster is `INTEGRATION` at most;
- a public deployment can be `DEPLOYMENT` only when independently reachable/verifiable;
- `VERIFIED_ADOPTION` requires explicit evidence that the external party actually uses/adopts the work.

## 7. Reward model

Default proposal unit: **MYZ internal reward/accounting ledger**.

Suggested non-security proposal bands:

| Scope | Suggested MYZ proposal |
|---|---:|
| small docs/research/review | 100–250 |
| bounded implementation/test/adapter | 250–750 |
| larger reproducible package with tests/evidence | 750–1,500 |

These are proposal bands, not automatic entitlements or funded commitments.

Security severity rewards remain governed by #489 and the security program, not by the ordinary bands above.

External XMR, fiat or token settlement may be listed only when all of the following are explicit:

1. amount and asset;
2. lawful settlement rail;
3. ecosystem funding source;
4. auditable reservation/allocation;
5. recipient and verification method;
6. independent evidence before `PAID`.

No silent MYZ↔XMR or MYZ↔TOKEN conversion is allowed.

## 8. Track-specific gates

### LIFE

Use official EU/CINEA/MASE or other authoritative sources for call/eligibility/deadline facts. Do not invent partners, consortium status, budget, KPI targets or funding state. Synthetic data should be used until authorized real pilot data exists.

### Aruba

Aruba-related bounty work is MyZubster-owned unless explicit evidence says otherwise. Do not expose support tickets, customer data, employee identities, private IPs, credentials, account details or infrastructure secrets. Generic portability/support evidence is preferred.

### Metasploit

Only defensive and explicitly authorized work is eligible. Safe examples include parsers, lab fixtures, findings schemas, regression tests, remediation verification and import-first adapters. No normal bounty authorizes exploitation, credential theft, persistence, DoS or third-party scanning.

### Monero

Upstream work must respect the upstream repository's contribution rules. Stagenet/testnet and non-custodial approaches are preferred for integration work. Mainnet custody/exchange/escrow/payment activation remains behind legal, compliance and security gates.

### Metaverse / WebXR

Respect upstream licenses, contribution policies and asset rights. External identity/auth systems remain external unless a reviewed adapter exists. Do not copy assets without compatible rights. Upstream merge still does not imply sponsorship or MyZubster adoption.

## 9. Anti-duplication procedure

Before creating a new bounty:

1. search open and closed issues for the same deliverable;
2. search active/merged PRs;
3. search external contribution/upstream records;
4. continue an existing issue if the scope matches;
5. create a new bounty only for a materially distinct deliverable;
6. link the parent track and all primary evidence.

## 10. Evidence requirements

At least one primary evidence path is required:

- MyZubster PR/commit with tests;
- upstream PR/issue and review state;
- reproducible test output;
- sanitized screenshot/report;
- official program/source document;
- SHA-256/CID for public sanitized artifacts where useful.

A CID proves content identity, not truth or bounty completion.

## 11. Privacy, security and IP

Federated bounties must never require:

- secrets, tokens, passwords, private keys or seed phrases;
- unnecessary personal data;
- confidential partner/customer/research data;
- unauthorized access to external systems;
- restricted-area physical collection;
- unlicensed asset copying;
- destructive security testing.

## 12. Creating a bounty

Use `.github/ISSUE_TEMPLATE/external-life-bounty.md` after confirming that the deliverable is not already tracked.

The issue should remain `PROPOSED` until scope, evidence and reward boundaries are reviewed. External settlement remains `EXTERNAL_UNFUNDED` unless an auditable ecosystem reservation exists.

## Related

- #734 — program tracking issue
- #533–#538 — LIFE bounty examples
- #487–#490 — security / Metasploit governance
- #712 — Aruba support-role integration
- #726 — metaverse interoperability
- #733 — WebXR upstream follow-up bounty
- [`BOUNTIES.md`](../BOUNTIES.md)
- [`TREASURY.md`](../TREASURY.md)
