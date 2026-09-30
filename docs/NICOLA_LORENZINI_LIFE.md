# Nicola — MyZubster LIFE Pilot Profile

Nicola is participating in the **MyZubster / Zorgax LIFE digital-business pilot** as an early real-world pilot user.

## GitHub identity

- GitHub: `nicolaususnicola-lgtm`
- MyZubster GitHub linkage: `PARTICIPANT_REPORTED_COMPLETE`; independent application/runtime verification is still pending.
- Pilot program: `LIFE`
- Pilot track: Digital Entrepreneur / Digital Business
- Metaverse configuration: `N4K48` · Explorer · Neon Plaza; verified live account-linked activation is still pending technical evidence.

No OAuth token, email address, password, OTP, or other credential is stored in this public profile.

## Pilot objective

The pilot is designed to test whether Zorgax can act as an AI business copilot while a human participant learns, evaluates and develops a small digital work project.

The target workflow is:

```text
LEARNING / IDEAS
      ↓
ZORGAX AI BUSINESS COPILOT
      ↓
RESEARCH → HUMAN SELECTION → VALIDATION → MVP → HUMAN APPROVAL
      ↓
REAL-WORLD TEST
      ↓
EVIDENCE → LEARNING → GO / CHANGE / STOP
```

## Product discovery and human selection

Status recorded on **2026-08-31**.

### Candidate ideas considered

1. Kit “Primo prodotto digitale in 7 giorni”
2. Project Planner per lavorare con AI/Zorgax

### First pilot target selected by Nicola

**Selected:** `project-planner-ai` — **Project Planner per lavorare con AI/Zorgax**.

Nicola directly confirmed the selection and requested that Zorgax automation proceed with completion of the pilot profile. The minimized decision record is stored in:

`docs/life/nicola-project-planner-selection-2026-08-31.json`

This is evidence of the participant's choice only. It is not evidence of market demand, product-market fit, customers, revenue, employment, funding, or commercial success.

The first candidate remains a possible future alternative; it is not classified as failed by this selection.

## Project Planner MVP v1

Status: `PILOT_TEST_STARTED_PARTICIPANT_REPORTED`.

On **2026-08-31**, Nicola directly reported that he had started the seven-day test. The minimized start record is stored in:

`docs/life/nicola-project-planner-pilot-start-2026-08-31.json`

This is participant-reported evidence only. It does not independently verify the planner button press, the project objective, browser-local state, daily use, completion, usefulness, or the final pilot result.

The first testable version is defined in:

`docs/life/nicola-project-planner-mvp-v1.md`

The MVP is deliberately limited to:

- one real project brief;
- 3–7 bounded tasks;
- priority, deadline, status and explicit next action;
- optional AI work note/prompt/decision note;
- evidence log for completed work or learning;
- blocker/change/next-action review.

MVP v1 explicitly excludes automated payments, purchases, outbound commercial email, automatic publishing, autonomous price changes and automatic GitHub merge.

The first validation period is seven days of real use. GO / CHANGE / STOP criteria are defined before the test results are collected.

## Preliminary interview evidence

Earlier anonymized feedback produced positive signals around AI-supported work, deadlines, digital-product workflows and guided error detection, but the evidence was incomplete and partly ambiguous between the two candidate concepts.

Those earlier interviews remain contextual evidence. Nicola's later direct selection resolves the **human idea-selection gate for the first pilot test**, but does not by itself resolve commercial validation.

## Current validation state

- Human idea selection: `CONFIRMED`.
- Selected candidate: `project-planner-ai`.
- MVP scope: `DEFINED`.
- Pilot test start: `PARTICIPANT_REPORTED_STARTED` on 2026-08-31; technical verification was not performed.
- Pilot test result: `NOT_YET_COMPLETED`.
- Commercial validation: `NOT_CLAIMED`.
- Deployment: `NOT_CLAIMED` unless independently evidenced.

### Next validation gate

Continue the bounded seven-day Project Planner test and collect only real evidence from actual use. After the test, apply the predefined GO / CHANGE / STOP criteria without changing them to fit the outcome.

## Zorgax participant automation status

Status recorded on **2026-08-31**.

- Consent state: `CONFIRMED` by the participant via email.
- Instruction acknowledgement: `ACCEPTED`.
- Automation preference: participant explicitly requested Zorgax automation.
- Automation state: `ENABLED`, event-driven by authorized participant updates.
- Repository action mode: `BRANCH → COMMIT → PULL REQUEST → HUMAN REVIEW`.
- Automatic merge: `DISABLED`.
- Automatic outbound email: `DISABLED` unless a human explicitly requests the send action.
- Sensitive public, commercial and financial actions: `HUMAN_APPROVAL_REQUIRED`.
- Privacy rule: process only participant-authorized information, minimize personal data and keep relayed interview evidence anonymous.

Zorgax may coordinate analysis and prepare technical changes. Human control remains required for merge, publication, spending, pricing, payments and other sensitive external actions.

## Technical completion record

The participant profile, automation documentation and prior validation artifacts are present on `main`. Nicola reported via email on 2026-08-31 that he completed the GitHub login step. This is participant confirmation, not independent proof that the OAuth linkage exists in the MyZubster database. PR #882 prepared and merged the N4K48 configurator, but runtime activation of the account-linked character has not been independently verified.

The next technical change for the selected Project Planner pilot is being prepared through a dedicated branch and pull request. A branch or PR is evidence of implementation work only; it is not evidence that the MVP has been pilot-tested or commercially validated.

## Knowledge Profile Builder result — 2026-09-28

Nicola reported that all three Knowledge Cards were saved as private drafts, reopened successfully and then published through the owner-controlled flow merged in [PR #1410](https://github.com/MyZubster-Ecosystem/myzubster/pull/1410). All three public artifacts were independently observed:

- [Prove Docker e chat AI del progetto myzubster-mvp](https://www.myzubster.com/knowledge-card?id=6abaaefb3a7460c4574a45fd)
- [Apprendimento e collaborazione nel percorso MyZubster](https://www.myzubster.com/knowledge-card?id=6abaaf563a7460c4574a4623)
- [Autista di camion e organizzazione dei trasporti](https://www.myzubster.com/knowledge-card?id=6abaae353a7460c4574a4597)

The pages identify the public account as `nicolaususnicola-lgtm`, label the activities as owner declarations, list owner-supplied sources and state that MyZubster does not automatically certify the claims. Professional experience, licences and qualifications on the transport card remain participant-declared; no private supporting documents were accessed.

Nicola also reported that local RAG retrieval through Qdrant and `/api/ai/ask` succeeded after changing `AI_CONTEXT_LIMIT` from `1` to `5`. Commit [`d360ae96`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/d360ae96a26f2e9f82e8982015b29b71b75d27e3) independently verifies the configuration change. It does not independently reproduce the local retrieval result, and no workflow run was found for that commit.

Nicola subsequently reported a successful syntax check and full re-ingestion with 46 knowledge chunks loaded into Qdrant and one empty document skipped. Commit [`ea80799`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/ea80799da0b775f866d80915d9282a0c5df8600a) independently verifies the `scripts/ingest_knowledge.py` change: chunking now prefers paragraph and line boundaries, preserves overlap and prevents non-progress loops. The public software Knowledge Card was independently observed linking to that commit and describing the same contribution. The commit does not independently prove the reported syntax-check or ingestion counts, and no workflow run or commit status was found.

Nicola then attempted the visual Knowledge Graph test but reported that Vercel showed `Request Sent` and required team-owner approval. The deployment `myzubster-knowledge-4u97rq3hu-myzubster.vercel.app` was independently verified as a `READY` production deployment tied to commit [`6c9b786`](https://github.com/danieldirimini-myzubster/myzubster/commit/6c9b786ce9cbc8fdc2bd0e8f26855754d139b729), which adds dynamic public Knowledge Card, publisher and source nodes. Both the deployment URL and its production alias redirect to Vercel SSO, so the N4K48 nodes, source navigation and mobile behavior remain `BLOCKED_BY_DEPLOYMENT_PROTECTION` and were not verified by the participant. No access permission or temporary bypass URL was created by this automation.

Nicola subsequently reported a first Ethereum Sepolia testnet proof for the software Knowledge Card. Commit [`2df5b39`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/2df5b391f707eb0945dda9512ceb9387736b6402) independently verifies the Solidity source and the repository documentation. The recorded `knowledgeHash` (`0x15b21c4f189259f143f6c946ac866001d88f5bc7aa371cac7cbcc1ce66b43685`) was independently recomputed and exactly matches the SHA-256 of the card URL string. Timestamp `1790630820` converts to `2026-09-28T21:27:00Z`. This experiment anchors only the URL string, not a canonical hash of the card contents; it does not certify the card, its ownership or Nicola's competence. The linked Etherscan contract and transaction pages were not independently retrieved in this run, so deployment success, stored contract values and Etherscan `Exact Match` remain participant-reported pending human explorer verification. Nicola stated an intention to add these sources to the card; that card update is not yet recorded as completed.

Nicola later reported that he updated the software Knowledge Card in the Builder, normalized the sources to one entry per line using the format `name | URL | note`, removed duplicates and saved the result as a private draft containing six sources. The draft itself and its exact source set are not public, were not stored in this record and could not be independently inspected. Publication remains an owner-controlled action. After Nicola publishes the revision, the public card must be checked again before the updated evidence list is treated as verified.

Nicola then reported a second Sepolia proof based on a committed content snapshot rather than the card URL. Commit [`ecefd81`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/ecefd81c5c9da0be15c99aeeb83878480abd60a8) independently verifies the one-line UTF-8 JSON payload (`MYZUBSTER-KNOWLEDGE-CARD-V1`), and commit [`405467e`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/405467e8d7b4e55ea9f18044a00aa66804f3ada3) documents Proof v2. SHA-256 was independently recomputed over the exact 3,168 committed bytes and matches `6097e05866bafceec24663d2638cb1dae5742ac78284abbfd45cc9c3b0bfb845`. The payload is valid JSON, targets card `6abaaefb3a7460c4574a45fd` and contains six source entries; one local-Docker source has an empty URL and therefore is not a public link. The hash match proves the digest of the committed bytes only. It does not prove that the snapshot is an automatic or complete canonical export of the live card, nor certify its statements. The new Etherscan contract and transaction pages could not be retrieved automatically, so deployment success and the reported `knowledgeHash()` value remain pending independent explorer verification.


Nicola then reported that the Proof v2 evidence had been added to the existing public Knowledge Card and requested the graph path `N4K48 → Knowledge Card → canonical payload → SHA-256 → Proof v2 Sepolia → GitHub documentation`. The [public card URL](https://www.myzubster.com/knowledge-card?id=6abaaefb3a7460c4574a45fd) is recorded, but the updated live contents were not independently re-retrieved in this run, so publication of the revision remains participant-reported.

A scoped implementation was prepared in draft [PR #1414](https://github.com/MyZubster-Ecosystem/myzubster/pull/1414) on branch `feat/nicola-proof-v2-knowledge-graph-2026-09-29`. It adds parent-aware graph edges for the payload, digest, Proof v2, explorer references and documentation, while stating that the proof covers integrity and linkage only. The PR is not merged or deployed; Nicola's requested mobile test therefore remains pending review, merge and deployment. The Sepolia contract state is still pending independent explorer verification.


### Architecture comparison and decision gate — 2026-09-29

Nicola compared the pilot with existing systems and proposed evaluating standards before further consolidation of Proof v2. The comparison was checked against official documentation:

- [Talent Protocol Builder Score](https://talentprotocol.com/) computes an explainable score from public GitHub and on-chain data and can optionally publish an EAS attestation on Base. Its own [terms](https://talentprotocol.com/terms) state that the score is an automated summary rather than an endorsement or credential.
- [Ethereum Attestation Service](https://docs.attest.org/) supports schema-based on-chain and off-chain attestations and is a candidate for a future standardized artifact-integrity attestation.
- [cheqd Trust Registries](https://docs.cheqd.io/product/studio/trust-registries) combine DIDs, Verifiable Credentials and issuer authorization chains; this is relevant only if MyZubster later introduces governed credential issuers and relying parties.
- [Open Badges 3.0](https://www.1edtech.org/standards/open-badges) represents issuer-signed achievements as credentials compatible with the W3C Verifiable Credentials Data Model 2.0 and can carry criteria and evidence.

The participant hypothesis is that MyZubster's distinctive layer is not a new score or credential format, but the navigable evidence path from a person and declared activity to concrete artifacts and proofs. The resulting architectural recommendation is provisional: retain the MyZubster Knowledge Graph as the relationship/navigation layer; keep the current Proof v2 as an experimental integrity anchor; evaluate EAS for generic attestations; evaluate Open Badges only for issuer-backed achievements; and consider cheqd only if a formal multi-issuer trust registry becomes necessary. Do not add a reputation score, issue credentials, or merge the Proof v2 integration until a human review defines claim types, issuer/verifier roles, canonicalization, status/revocation, privacy, chain/cost and migration requirements.

The minimized record is stored in:

`docs/life/nicola-zorgax-profile-onboarding-test-2026-09-28.json`

## Human-control rules

This pilot is advisory-first. Zorgax must not autonomously:

- publish a product;
- change pricing;
- spend money;
- execute payments or wallet actions;
- send external commercial messages;
- issue refunds;
- merge code to protected branches;
- claim or guarantee profit.

Those actions require explicit human approval.

## MYZ-209 PC validation — 30 September 2026

Nicola reported a PC validation session completed with AI support. This is participant-reported evidence; the automation did not access his private draft or reproduce the browser session.

- The public catalog showed the three original cards and the Docker card opened in the visual graph.
- The graph identified N4K48 as `nicolaususnicola-lgtm`; the card and evidence nodes were selectable and linked to the canonical payload, Proof v2 documentation and Sepolia references.
- Both public GitHub commits and the referenced Etherscan pages were reachable; Nicola reported the deployment transaction as successful.
- The session did not independently recompute the digest or read `knowledgeHash()` from the contract.
- A synthetic private draft persisted after reload, remained visible in preview, and did not appear in either public catalog. Its public URL returned an unavailable/withdrawn state while the draft remained private.
- Two usability defects were isolated: the authenticated account area lacked a **Le mie conoscenze** shortcut, and the Builder could keep showing **Accedi per salvare** after authenticated draft loading and saving worked. Draft PR [#1418](https://github.com/MyZubster-Ecosystem/myzubster/pull/1418) contains the minimal UI fix and regression test.
- Phone validation and the next real contribution update with duplicate-safe graph synchronization remain pending.
- Proof v2 remains integrity/linkage evidence only; it is not a certification of skill, truth, authorship or ownership.
- Zorgax Private was not tested or activated in this session.

## Relationship to the EU LIFE Programme

This profile refers to an **internal MyZubster LIFE pilot track**. It must not be presented as participation in an EU-funded LIFE project, an approved LIFE grant, or an official European Commission / MASE partnership.

MyZubster's environmental LIFE proposal work is a separate track focused on measurable environmental outcomes such as water efficiency, circularity, IoT/MRV and pilot validation.

## Identity and privacy

The public repository profile contains only the public GitHub identity and minimized pilot state needed for project linkage. Personal contact details, home address, passwords, authentication tokens and other private data must not be stored here.

## Verification state

- GitHub public identity: `nicolaususnicola-lgtm`.
- Authenticated MyZubster GitHub OAuth linkage: `PENDING_TECHNICAL_VERIFICATION`; participant reported the login step completed on 2026-08-31.
- Human selection of `project-planner-ai`: `CONFIRMED` on 2026-08-31.
- Project Planner MVP test result: `PENDING`.
