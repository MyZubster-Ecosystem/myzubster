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

## Nicola Comics × MyZubster

Status updated on **2026-09-16**: `PUBLIC_PILOT_CI_PASS; UPSTREAM_ZORGAX_BRIDGE_PR_PREPARED; E2E_PENDING`.

On **2026-09-16**, Nicola confirmed participation in the MyZubster LIFE meeting scheduled for **2026-09-22, 10:30–11:30**, and confirmed that he wants to continue the Nicola Comics × MyZubster pilot, including preparatory work on the first NFT candidate. This is a participant-confirmed next-step decision, not authorization to mint, execute a blockchain transaction, list or sell an asset, or bypass rights verification and human review.

Nicola directly reported creating three narrative visuals with AI assistance, using the N4K48 appearance he selected, to describe the path from a software idea to the MyZubster metaverse. The public gallery and files are present in his repository:

1. [Dall’idea software al metaverso](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/n4k48-comics/01-dall-idea-al-metaverso.png) — `n4k48-comic-001`
2. [Il software prende forma](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/n4k48-comics/02-il-software-prende-forma.png) — `n4k48-comic-002`
3. [Verso Neon Plaza](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/n4k48-comics/03-verso-neon-plaza.png) — `n4k48-comic-003`

[Gallery](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/GALLERY.md) · [Zorgax adapter contract](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/ZORGAX.md) · [Local test report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/8944fcbe31354cd513380dc3f5be7853380ef5c2/docs/nicola-comics/TEST-REPORT-2026-09-15.md)

Repository evidence confirms the files, documentation and adapter code exist. Authorship and visual-element rights remain `PARTICIPANT_REPORTED / TO_VERIFY`. The three earlier MyZubster ecosystem comics remain references and are not claimed by Nicola.

### Local adapter validation

Nicola reported a healthy local Docker service and manual HTTP `PASS` results for:

- `gallery` — returns the three N4K48 visuals;
- `detail` — returns the card for `n4k48-comic-001`;
- `candidate` — returns only `n4k48-comic-001`;
- `next_steps` — returns the remaining validation steps.

The published report correctly records that automated `pytest` tests were **not run** because pytest was unavailable. This automation verified the public commits and report, not Nicola's local runtime independently.

The adapter remains read-only and now supports an environment-provided `NICOLA_COMICS_BASE_URL`, without requiring a localhost URL in public integration. The supporting public commits are:

- [local manual validation](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/8944fcbe31354cd513380dc3f5be7853380ef5c2);
- [configurable adapter base URL](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/27a628c9836ee4ce5eb15f405c8555f992172bdb);
- [integration contract](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/d777958dc2744d64ed4cbc0327a82c52fe7e655e);
- [Docker environment pass-through](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/24361946c9bc4807e19a8c5235c3a8839ae39af6).

### NFT and rights boundary

Nicola selected `n4k48-comic-001`, **Dall’idea software al metaverso**, as `NFT_CANDIDATE / PROPOSED_FOR_REVIEW`. Rights remain `TO_VERIFY`; transaction hash, contract, token ID, network and metadata URI remain empty. No mint, ownership, listing, sale or revenue is claimed.

The scenes are narrative illustrations and may depict functions still to be developed. They are not verified software screenshots or evidence of deployed metaverse functionality.

The minimized evidence record is stored in:

`docs/life/nicola-comics-participant-update-2026-09-09.json`

### Public pilot verification and upstream gate

On **2026-09-16**, the participant repository's [GitHub Actions run 35106091555](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/actions/runs/35106091555) completed successfully on commit `d8070fd33febcf0fe1dc0c6c6613056df1e3bc61`. The verified job includes software tests, Docker verification and a public smoke test against `https://myzubster-mvp.onrender.com` for `gallery`, `detail`, `candidate` and `next_steps`.

This verifies the public participant-side pilot at that run. It does not prove that the bridge from the deployed MyZubster public Zorgax has passed end to end.

Coordination continues in [issue #1176](https://github.com/MyZubster-Ecosystem/myzubster/issues/1176). Nicola's proposal branch and commits were reviewed, and a bounded maintainer-side implementation has been prepared in draft PR [#1210](https://github.com/MyZubster-Ecosystem/myzubster/pull/1210). The bridge accepts only explicit Nicola Comics requests, remains read-only, does not forward the generic chat message, and performs no mint, wallet, payment or persistent write.

The next gate is human review, deployment configuration, and a documented public end-to-end test through the deployed MyZubster Zorgax route. No Zorgax-public E2E PASS is claimed before that test.

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
