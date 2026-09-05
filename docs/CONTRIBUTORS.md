# MyZubster Contributors

This document is the public, evidence-first contributor registry for MyZubster.

A contributor entry records **public GitHub activity only**. It does not establish legal identity, employment, partnership, institutional affiliation, payment, endorsement, ownership, availability for future work or membership in a LIFE consortium.

## Contributor states

```text
PROPOSED
→ SUBMITTED
→ REVIEWED
→ MERGED
→ VERIFIED_CONTRIBUTION
```

`VERIFIED_CONTRIBUTION` means that the referenced public contribution can be checked against repository evidence and has an integration/review state stated below. It does not mean identity/KYC verification or external settlement.

## Contributor paths

- **First-time contributor** — docs, translations, small fixes, tests.
- **Developer** — API, backend, frontend, database, automation.
- **GIS / IoT** — mapping, geolocation, sensing, environmental data.
- **Design / storytelling** — UX, visual guides, comics, accessibility.
- **Research / LIFE-aligned** — KPI/MRV, evidence methodology, datasets, replication.
- **QA / reproducibility** — CI, testing, security review, clean-checkout validation.

## Public contributor registry — verified 2026-08-31

| GitHub alias | Contribution path | Public evidence | Current evidence status | LIFE-aligned candidate lane |
|---|---|---|---|---|
| `@Aming9303` | Frontend / dashboard / visual documentation / IoT sensing | PR #531; PR #634; PR #859 | all `OPEN / SUBMITTED`; #859 is a bounded contribution on LIFE-aligned issue #534 | #534 sensing adapter **active public LIFE contribution**; #537 dashboard & KPI evidence; evidence UX / visualization |
| `@wasim-builds` | Security / QA / review / geolocation | PR #58; PR #636; PR #637 | #58 and #636 `CLOSED_NOT_MERGED`; #637 `OPEN / SUBMITTED` | #534 geospatial context; #536 safety/review; #713 evidence-integrity QA |
| `@ghzhost` | Backend / telemetry / sensing | PR #396 | `OPEN / SUBMITTED` | #534 sensing adapter; #713 ingest/provenance |
| `@laurentketterle-hub` | Telemetry / dashboard / Gateway / robotics | PR #397; #398; #399; #400; #404 | #397/#399/#400 `MERGED`; #398 `CLOSED_NOT_MERGED`; #404 `OPEN` | #534 sensing; #536 device safety; #537 dashboard; #713 evidence automation |
| `@foxxx009` | GIS / geolocation / garden mapping | PR #27 | `CLOSED_NOT_MERGED / REVIEWED` | #534 geospatial environmental data; #538 replication mapping |
| `@leanworld7-netizen` | Agriculture data / plant API | PR #59 | `CLOSED_NOT_MERGED / REVIEWED` | #534 agriculture data context; #538 site/replication data |
| `@rafaio1` | CI/CD / load testing / performance / observability | PR #693; #694; #736 | #693/#736 `CLOSED_NOT_MERGED`; #694 `OPEN / SUBMITTED` | #713 reproducibility/CI; #538 deployment/readiness verification |

### Evidence links

- `@Aming9303`: https://github.com/MyZubster-Ecosystem/myzubster/pull/531, https://github.com/MyZubster-Ecosystem/myzubster/pull/634, https://github.com/MyZubster-Ecosystem/myzubster/pull/859
- `@wasim-builds`: https://github.com/MyZubster-Ecosystem/myzubster/pull/58, https://github.com/MyZubster-Ecosystem/myzubster/pull/636, https://github.com/MyZubster-Ecosystem/myzubster/pull/637
- `@ghzhost`: https://github.com/MyZubster-Ecosystem/myzubster/pull/396
- `@laurentketterle-hub`: https://github.com/MyZubster-Ecosystem/myzubster/pull/397, https://github.com/MyZubster-Ecosystem/myzubster/pull/398, https://github.com/MyZubster-Ecosystem/myzubster/pull/399, https://github.com/MyZubster-Ecosystem/myzubster/pull/400, https://github.com/MyZubster-Ecosystem/myzubster/pull/404
- `@foxxx009`: https://github.com/MyZubster-Ecosystem/myzubster/pull/27
- `@leanworld7-netizen`: https://github.com/MyZubster-Ecosystem/myzubster/pull/59
- `@rafaio1`: https://github.com/MyZubster-Ecosystem/myzubster/pull/693, https://github.com/MyZubster-Ecosystem/myzubster/pull/694, https://github.com/MyZubster-Ecosystem/myzubster/pull/736

Additional contributors should be added only after verifying the **actual public PR/issue author alias**. Do not infer identity from text, payout addresses, commit messages, email notifications or external profiles.

## LIFE-aligned contributor work

MyZubster contributors may opt into preparatory LIFE-aligned technical work when their existing skills match a bounded issue.

```text
PUBLIC CONTRIBUTION EVIDENCE
→ CANDIDATE LIFE LANE
→ CONTRIBUTOR OPT-IN / CLAIM OR CLEAR LIFE CONTRIBUTION ACTION
→ BOUNDED LIFE ISSUE
→ PR + TESTS / EVIDENCE
→ REVIEW
→ VERIFIED LIFE-ALIGNED CONTRIBUTION
```

Current source-of-truth LIFE lanes:

- #534 — IoT sensing & auditable environmental data adapter;
- #535 — human-in-the-loop AI recommendation & intervention log;
- #536 — automation safety & manual override;
- #537 — environmental pilot dashboard & KPI evidence view;
- #538 — pilot replication package;
- #713 — Zorgax LIFE evidence automation.

A clear public contribution on one of these bounded issues may establish contributor-work opt-in for that task. It is **not** participant-profile consent, partnership, employment or external payment authorization. PR #859 currently provides that bounded public contribution evidence for `@Aming9303` on #534.

## Contributor claim template

```text
CLAIM
GitHub username:
Contributor path: first-time / developer / GIS-IoT / design / research / QA
Issue:
Proposed approach:
Testing/evidence plan:
Expected first milestone:
```

For LIFE-aligned work, contributors may use:

```text
LIFE INTEREST
GitHub username:
Preferred lane:
Relevant public contribution:
Availability / proposed first task:
```

## Evidence rules

Valid evidence may include:

- issue links;
- pull requests;
- commits;
- reproducible tests;
- review records;
- public documentation contributions.

Do not include private emails, phone numbers, home addresses, identity documents, private institutional discussions, credentials, payout addresses, wallet seeds or other unnecessary personal information.

## Reward and settlement boundary

Contribution status is independent from reward and settlement status.

```text
VERIFIED CONTRIBUTION ≠ REWARD RECORDED ≠ EXTERNAL SETTLEMENT ≠ PAID
```

See `BOUNTIES.md`, `REWARDS_LEDGER.md` and `TREASURY.md` for the canonical boundaries.

## Relationship boundary

Contributor evidence and institutional LIFE relationships are separate registries:

- contributor evidence: this file;
- LIFE contributor candidates: `docs/life-2027/CONTRIBUTOR_POOL.md`;
- internal pilot participants: `docs/life/participant-automation/participant-registry.json`;
- organisations/pilot sites/formal partner states: `docs/life-2027/STAKEHOLDER_REGISTRY.md`.

```text
PUBLIC CONTRIBUTOR ≠ INTERNAL PARTICIPANT ≠ LIFE PARTNER ≠ CONSORTIUM MEMBER
```

## Related

- #742 — Contributor onboarding system
- #743 — Contributor evidence registry implementation
- `JOIN.md`
- `CONTRIBUTING.md`
- `docs/PUBLIC-COMMUNITY-ACTIVITY.md`
- `docs/life-2027/CONTRIBUTOR_POOL.md`
- `docs/life-2027/STAKEHOLDER_REGISTRY.md`

**One newcomer → one bounded task → one reproducible PR → one reviewed public contribution.**
