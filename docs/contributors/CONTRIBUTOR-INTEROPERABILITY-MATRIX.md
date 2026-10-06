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
| **Open Period Care — @khongten124** | Research / evidence package | Evidence + Knowledge Card / Zorgax retrieval bridge | Public evidence fetched and normalized; contributor-scoped Qdrant lookup returns KC-OPC-001 / KC-OPC-002 with correct SUPPORTED state; credential-boundary check prevents unsupported personal-certification claims | **TESTED — contributor-scoped semantic bridge** | Link Contributor Passport / Knowledge Graph and preserve deterministic metadata lookup for structured fields |
| **@Shweta-singh24** | MyZubsterGateway jurisdiction-capability contribution | Independent verifier bridge | Reproduce commit `82461433e0c5bfee9aa369b4a71e9331261cf803`; verify JS syntax, fail-closed policy behavior and Tari/XMR `jurisdictionGate` wiring | **TESTED — exact closed/unmerged checkpoint** | Keep scope bound to the tested commit; upstream merge/deployment remains separate |
| **@hoicailon94** | Revenue split / deterministic allocation / reconciliation architecture | Accounting / deterministic calculation bridge | Reproduce one deterministic allocation/reconciliation vector from public inputs and compare expected vs actual output | **IN VERIFICATION** | Identify canonical runnable artifact or test vector; run independent reproduction |
| **@Aming9303** | Signed payment webhooks, replication-package validation, environmental sensor adapters | Integration / regression bridge | Re-run at least one merged contribution against current MyZubster code and capture exact test result and commit | **MERGED CONTRIBUTION EVIDENCE** | Select one current merged path and publish a reproducible TESTED checkpoint |
| **@wasim-builds** | Security testing / fail-closed admin-auth coverage; [merged onboarding fix #1513](https://github.com/MyZubster-Ecosystem/myzubster/pull/1513) | Security regression + Character Registry provenance | Reproduce the security test separately; verify onboarding targets registry #1512 and retains explicit consent | **MERGED CONTRIBUTION EVIDENCE**; [character opt-in recorded as PROPOSED](https://github.com/MyZubster-Ecosystem/myzubster/issues/1512#issuecomment-6014255144) | Independent current-main rerun; link Knowledge Node / Passport only when their canonical records and applicable opt-in are evidenced |
| **@foxxx009** | KPI/evidence framework, automated bot testing, docs/Marketplace forks | Validation / bot-test / evidence-framework bridge | Re-run one merged KPI/bot validation path and connect the result to a structured MyZubster evidence record | **MERGED CONTRIBUTION EVIDENCE** | Choose canonical merged test path and publish reproducible result |
| **@blucca** | Invited independent research/evidence reviewer | Review / provenance verification bridge | Independently review one source → evidence → requirement chain and publish a bounded review result | **INVITED / REVIEW PENDING** | Explicit participation + completed independent review |
| **@Shweta-singh24 fork path** | Public MyZubsterGateway fork containing the tested checkpoint | Discovery → verifier bridge | Use the independently reproduced verifier checkpoint above rather than inferring competence from the fork alone | **CHECKPOINT TESTED / FORK NOT MERGED UPSTREAM** | Preserve commit-level provenance and distinguish test evidence from upstream merge status |
| **@Luzijano** | Public MyZubsterGateway-related fork | Discovery / opt-in bridge | Confirm participant intent and identify one harmless, reproducible component or diff to test | **FORK DISCOVERED / EVIDENCE PENDING** | Contributor opt-in + scoped first test |

## Evidence update — 2026-10-06

- **wasim-builds:** #1513 merged at commit `65766912572ec9a28c9c52ecfde7662165950587`. It changes the onboarding registry from #617 to #1512. The existing consent record in #1512 is reused; no duplicate character, Knowledge Node or Passport is created. Character consent alone does not establish Passport publication or a completed independent node.
- **khongten124:** [#1451](https://github.com/MyZubster-Ecosystem/myzubster/pull/1451) and [#1489](https://github.com/MyZubster-Ecosystem/myzubster/pull/1489) are merged. Research Knowledge Cards remain `SUPPORTED`; the documented semantic bridge checkpoint remains `TESTED` within its stated scope. [Canonical linkage](../contributions/khongten124-canonical-project-link.md) records contributor approval but account-side Knowledge Card publication is still pending.
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
