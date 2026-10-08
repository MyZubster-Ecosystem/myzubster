# Contributor Interoperability Matrix

This document defines the canonical path for connecting MyZubster contributors to the shared MyZubster ecosystem with reproducible, evidence-first interoperability checkpoints.

The reference pattern is the Nicola / N4K48 pilot: independent contributor work remains independently owned, while MyZubster records a bounded, reproducible bridge test with public provenance.

## Common interoperability pattern

```text
INDEPENDENT CONTRIBUTOR WORK
        ↓
PUBLIC REPO / PR / EVIDENCE PACKAGE
        ↓
MYZUBSTER CONTRIBUTOR PROFILE / PASSPORT
        ↓
STRUCTURED KNOWLEDGE / API / RUNTIME BRIDGE
        ↓
HARMLESS REPRODUCIBLE TEST
        ↓
PUBLIC TEST EVIDENCE
        ↓
TESTED / VERIFIED STATUS
```

The bridge type depends on the contributor's actual work:

- software / service → independent build, API/runtime or read-only interoperability test;
- research / evidence package → structured evidence ingestion, provenance and retrieval test;
- security / testing contribution → reproducible regression/security test against the relevant MyZubster component;
- documentation / KPI / framework contribution → structured knowledge, schema or validation workflow test;
- fork only / evidence pending → discovery and consent first; no competence claim is inferred from a fork alone.

## Contributor matrix

| Contributor | Public work / role | MyZubster bridge target | Minimum reproducible checkpoint | Current status | Next gate |
|---|---|---|---|---|---|
| **Nicola / N4K48 — @nicolaususnicola-lgtm** | Independent MyZubster MVP / Docker node / Comics + evidence-first AI | Runtime + semantic knowledge bridge | Independent Docker reproduction; API health; read-only Zorgax; H4X0R semantic ingestion/retrieval | **TESTED** | Direct contributor-to-contributor / peer node exchange if both sides explicitly participate |
| **Open Period Care — @khongten124** | Research / evidence package | Evidence + Knowledge Card / Zorgax retrieval bridge | Public evidence fetched and normalized; contributor-scoped Qdrant lookup returns KC-OPC-001 / KC-OPC-002 with correct SUPPORTED state; credential-boundary check prevents unsupported personal-certification claims | **TESTED — contributor-scoped semantic bridge; #1451 `fc4a5cd30c854a242e6ed39e757c77f463c5d231`; #1489 `6d88448821f25a252a79a777101ef904af8bbccb`** | Link Contributor Passport / Knowledge Graph and preserve deterministic metadata lookup for structured fields |
| **@Shweta-singh24** | MyZubsterGateway jurisdiction-capability contribution | Independent verifier bridge | VPS verifier reproduced commit `82461433e0c5bfee9aa369b4a71e9331261cf803`: 14/14 policy checks passed, 5/5 JS syntax checks passed, and 6/6 Tari/XMR `jurisdictionGate` wiring checks were true | **TESTED — VPS protocol TESTED_PASS; source checkpoint closed/unmerged; MyZubster evidence #1575 merged at `dc4fb1e3c403f6e554c2402ec9fb4c5dfd93e593`** | Keep scope bound to the tested commit; upstream merge/deployment, legal compliance and security certification remain separate |
| **@hoicailon94** | Revenue split / deterministic allocation / reconciliation architecture | Accounting / deterministic calculation bridge | Reproduce one deterministic allocation/reconciliation vector from public inputs and compare expected vs actual output | **IN VERIFICATION** | Identify canonical runnable artifact or test vector; run independent reproduction |
| **@Aming9303** | Signed payment webhooks [#891](https://github.com/MyZubster-Ecosystem/myzubster/pull/891), replication-package validation, environmental sensor adapters | Integration / regression bridge | Independent VPS rerun: HMAC-SHA256 signing, stable delivery ID on retry, unsigned-endpoint rejection, one-time replay claim and stale-event rejection; 5/5 targeted Jest cases passed | **TESTED — signed payment-webhook regression; #891 merged at `be78e0cf9081c3346aa0c61e022acd297d745619`** | Keep TESTED bounded to this webhook checkpoint; external receiver deployment, settlement, wallet and broader security claims remain separate |
| **@wasim-builds** | Security testing / fail-closed admin-auth coverage [#860](https://github.com/MyZubster-Ecosystem/myzubster/pull/860); [merged onboarding fix #1513](https://github.com/MyZubster-Ecosystem/myzubster/pull/1513) | Security regression + Character Registry provenance | Independent VPS rerun on current MyZubster code: unconfigured→503, missing→401, wrong→401, correct→200; 4/4 targeted Jest cases passed | **TESTED — fail-closed admin-auth regression; #860 merged at `9c36d5be450e12345ff9251a40ab4df38839a7fe`** | Keep TESTED bounded to this regression; onboarding/Character Registry and any broader security claims remain separate |
| **@foxxx009** | KPI/evidence framework [#894](https://github.com/MyZubster-Ecosystem/myzubster/pull/894), automated bot testing [#259](https://github.com/MyZubster-Ecosystem/myzubster/pull/259); maintainer integration follow-up [#1526](https://github.com/MyZubster-Ecosystem/myzubster/pull/1526) re-enabled the historical suite; docs/Marketplace forks | Validation / evidence-framework bridge | #894 independently reproduced on VPS with synthetic data; #259 historical 4-test GitHubMonitor suite re-enabled on main by #1526 after replacing the unconditional CommonJS Octokit load with lazy dynamic import for the real-token path | **TESTED — KPI/evidence/report regression; #894 `50f70aab6dc9a909f65b81cb70d932706143afec`; #259 `1c78fadd608e8c8acaeaeaf00d448676f82c3f91`; #259 RE-ENABLED VIA maintainer #1526 `f8cbdee1e50cfbfa6925b4bc1014ca75ed5e90d1`** | Keep TESTED bounded to the exact software checkpoints. Public alias + public contribution references are authorized; public profile, Knowledge Card and Contributor Passport remain separate explicit-consent steps. |
| **@blucca** | Invited independent research/evidence reviewer | Review / provenance verification bridge | Independently review one source → evidence → requirement chain and publish a bounded review result | **INVITED / REVIEW PENDING** | Explicit participation + completed independent review |
| **@Shweta-singh24 fork path** | Public MyZubsterGateway fork containing the tested checkpoint | Discovery → verifier bridge | Use the independently reproduced verifier checkpoint above rather than inferring competence from the fork alone | **CHECKPOINT TESTED / FORK NOT MERGED UPSTREAM** | Preserve commit-level provenance and distinguish test evidence from upstream merge status |
| **@Luzijano** | Public MyZubsterGateway-related fork | Discovery / opt-in bridge | Confirm participant intent and identify one harmless, reproducible component or diff to test | **FORK DISCOVERED / EVIDENCE PENDING** | Contributor opt-in + scoped first test |

## Evidence update — 2026-10-08

- **Shweta-singh24:** the external-project VPS verifier in PR #1575 independently reproduced the pinned public fork commit `82461433e0c5bfee9aa369b4a71e9331261cf803`. Observed result: verifier `TESTED`, 14/14 deterministic policy checks passed, 5/5 JavaScript syntax checks passed, and all 6 bounded Tari/XMR jurisdiction-gate wiring checks were true. The source PR `MyZubster-Ecosystem/MyZubsterGateway#1385` remains `CLOSED_UNMERGED`. MyZubster evidence PR #1575 passed CI – Test e Lint, Security Audit, MYZ-164 Seller Free policy and Continuous Evidence Gate, then squash-merged at canonical commit `dc4fb1e3c403f6e554c2402ec9fb4c5dfd93e593`. This is a bounded technical checkpoint only; it does not establish upstream merge, production deployment, legal/regulatory compliance or security certification.


- **Canonical merge cross-check (2026-10-08):** #891 by `@Aming9303` is merged at `be78e0cf9081c3346aa0c61e022acd297d745619`; #860 by `@wasim-builds` is merged at `9c36d5be450e12345ff9251a40ab4df38839a7fe`; #894 by `@foxxx009` is merged at `50f70aab6dc9a909f65b81cb70d932706143afec`; historical #259 by `@foxxx009` is merged at `1c78fadd608e8c8acaeaeaf00d448676f82c3f91`. PR #1526 (`f8cbdee1e50cfbfa6925b4bc1014ca75ed5e90d1`) is a maintainer-authored integration fix that re-enabled the #259 suite and is not attributed as a foxxx009-authored contribution.

## Evidence update — 2026-10-07

- **foxxx009:** [#259](https://github.com/MyZubster-Ecosystem/myzubster/pull/259) remains valid merged historical evidence but its test suite had later been disabled as `monitor.test.skip.js`. Independent contributor reproduction identified the `@octokit/rest` v22 CommonJS/ESM loading defect. [#1526](https://github.com/MyZubster-Ecosystem/myzubster/pull/1526) was merged at `f8cbdee1e50cfbfa6925b4bc1014ca75ed5e90d1`, re-enabling `monitor.test.js` and loading Octokit lazily with dynamic `import()` on the real-token path. Repository Test/Lint/Build, Seller Free regression, Evidence Gate, npm audit, GitGuardian and Vercel Preview checks were green before merge. This update records technical/public contribution evidence only; it does not publish a public profile, Knowledge Card or Contributor Passport.

## Evidence update — 2026-10-06

- **wasim-builds:** #1513 merged at commit `65766912572ec9a28c9c52ecfde7662165950587`. It changes the onboarding registry from #617 to #1512. The existing consent record in #1512 is reused; no duplicate character, Knowledge Node or Passport is created. Character consent alone does not establish Passport publication or a completed independent node.
- **khongten124:** [#1451](https://github.com/MyZubster-Ecosystem/myzubster/pull/1451) merged at `fc4a5cd30c854a242e6ed39e757c77f463c5d231` and [#1489](https://github.com/MyZubster-Ecosystem/myzubster/pull/1489) merged at `6d88448821f25a252a79a777101ef904af8bbccb`. Research Knowledge Cards remain `SUPPORTED`; the documented semantic bridge checkpoint remains `TESTED` within its stated scope. [Canonical linkage](../contributions/khongten124-canonical-project-link.md) records contributor approval but account-side Knowledge Card publication is still pending.
- **edvinas1573:** [#1507](https://github.com/MyZubster-Ecosystem/myzubster/pull/1507), head `642421c9ab5c41898c137708843acb62e0e501c0`, remains draft/open. CI, Security Audit, Evidence Gate and Seller Free workflows are queued at this check, with no passing conclusion yet. The maintainer's bounded arithmetic review is recorded on the PR; whole-repository verification and Vercel authorization remain separate. No new compensation is reserved by inclusion here.
- University preparation: [12 October evidence index](../life/MEETING-2026-10-12-EVIDENCE-INDEX.md).

## Status semantics

- **TESTED** — a specific technical interoperability checkpoint was actually reproduced and observed.
- **EVIDENCE VERIFIED** — contribution/evidence provenance and content were verified, but this does not automatically mean a runtime interoperability test was completed.
- **MERGED CONTRIBUTION EVIDENCE** — contribution is merged in MyZubster; a separate independent reproduction is still needed before calling the bridge TESTED.
- **IN VERIFICATION** — evidence exists, but one or more required checks remain incomplete.
- **PENDING** — the proposed bridge has not yet been run.
- **FORK DISCOVERED / EVIDENCE PENDING** — a public fork exists, but no competence or interoperability claim is inferred without a scoped test.

## Standard evidence package for every contributor

Each completed bridge should publish:

1. contributor and public repository / PR / evidence source;
2. exact branch / commit / artifact where applicable;
3. environment used for the test;
4. harmless test command or procedure;
5. observed output;
6. source/provenance retained in the result;
7. exact status: `TESTED`, `EVIDENCE VERIFIED`, or another bounded state;
8. explicit limitations and what remains untested;
9. cross-link to Contributor Passport / Knowledge Graph when available.

## Safety and access boundary

Connecting a contributor to MyZubster does not automatically grant:

- SSH or shell access;
- production credentials;
- API secrets;
- wallet keys or seed phrases;
- database write access;
- deployment rights;
- payment authority;
- governance authority.

The default first checkpoint should be read-only or otherwise harmless, minimally scoped and independently reproducible.

## Definition of done

A contributor is considered fully connected to the MyZubster interoperability layer when:

- their public work is linked canonically;
- the appropriate bridge type is selected;
- at least one scoped interoperability checkpoint has been independently reproduced;
- the result is publicly documented with provenance;
- status wording matches the exact evidence;
- Contributor Passport / Knowledge Graph linkage is present where supported.

This creates a common evidence standard without pretending that every contributor has the same type of project or the same technical interface.
