# MyZubster Canonical Rewards Ledger

This file is the canonical public status ledger for MyZubster rewards and settlement claims.

It exists to prevent a common ambiguity in historical issues:

```text
issue closed / PR merged
≠ reward funded
≠ reward recorded
≠ external settlement verified
≠ PAID
```

## Status model

Use only the following meanings:

- `PROPOSED` — a reward amount or opportunity was published, but funding/approval is not yet established.
- `VALIDATED` — scope/criteria were reviewed.
- `APPROVED` — maintainers approved the reward definition.
- `FUNDED` — funding evidence exists for the applicable reward/rail.
- `SUBMITTED` — contributor submitted work/evidence.
- `UNDER_REVIEW` — work is being reviewed.
- `VERIFIED` — the contribution passed the defined acceptance criteria.
- `REWARD_RECORDED` — an internal reward/accounting entry was created and checked.
- `SETTLEMENT_PENDING` — external settlement is expected but not yet independently verified.
- `SETTLED` — external settlement has independently verifiable evidence matching recipient, asset, amount/network and transaction/reference data.
- `REJECTED` / `CANCELLED` / `DISPUTED` — use when applicable.

**MYZ is currently treated as an internal reward/accounting ledger unless a specific external rail is explicitly documented and independently verified.**

## Required evidence for `SETTLED`

A row may be marked `SETTLED` only when the applicable rail has independently checkable evidence. A merge, issue-closing event, screenshot, application database flag or provider response alone is insufficient.

Where relevant, evidence should include:

- expected recipient;
- asset/currency and network/rail;
- canonical amount;
- transaction/reference identifier;
- independent verification source;
- duplicate/replay check;
- verification timestamp or review reference.

If evidence is unavailable, the status must remain no stronger than the strongest verified prior state.

## Current reviewed entries

| Repository / Issue | Contributor | Historical / proposed reward | Work state visible on GitHub | Reward-record status | External settlement status | Evidence / notes |
|---|---|---:|---|---|---|---|
| `MyZubsterGateway#257` — Wallet reale per Tari (MYZ) | `laurentketterle-hub` | 150 MYZ | Issue closed as completed | **NOT ESTABLISHED BY ISSUE** | **NOT VERIFIED** | Historical issue wording said payment after merge; issue was corrected on 2026-08-22 to clarify that closure/merge is not payment proof. |
| [`MyZubsterGateway#789`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/789) — Repeater Payment Model | `laurentketterle-hub` | **DISPUTED:** 2,500 MYZ in the issue; 250 MYZ in a later payment statement | [PR #791](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/791) merged on 2026-08-08, commit `7b9c4ef303918bce77d325df78cff983bea1b577` | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | A historical `PAGATO` statement has no transaction hash or working explorer evidence; recipient reported no balance. [Correction and evidence](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/789#issuecomment-5352254553). |
| [`MyZubsterGateway#282`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/282) — Job queue con Bull | `shiyaam-s07` | 150 MYZ | [PR #318](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/318) is closed and **not merged**; acceptance/integration is unresolved | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Historical `PAGATO` and merge statements were corrected. No valid transaction hash, working network/token contract or verified spendable balance was supplied. [Correction and evidence](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/282#issuecomment-5350458334). |

| [`MyZubsterGateway#56`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/56) — FCMP++ research | `SourceProofLabs` | **DISPUTED:** 0.01 XMR in issue vs 0.06 XMR confirmed later | [PR #100](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/100) merged | **NOT ESTABLISHED IN CANONICAL LEDGER** | **UNSETTLED** | Payment was explicitly deferred; no transaction evidence. |
| [`MyZubsterGateway#144`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/144) — Arduino sensor API | `foxxx009` | **DISPUTED:** legacy 0.08 XMR in corrected issue vs 0.06 XMR in discussion | [PR #177](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/177) merged | **NOT ESTABLISHED IN CANONICAL LEDGER** | **EXTERNAL_UNFUNDED / UNSETTLED** | Payment was explicitly deferred pending funds; no treasury reservation or transaction evidence. |
| [`MyZubsterGateway#280`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/280) — Advanced rate limiting | `laurentketterle-hub` | 100 MYZ | [PR #293](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/293) merged | **CLAIMED RECORDED IN COMMENT; CANONICAL ENTRY NOT LOCATED** | **NOT VERIFIED / NO EXTERNAL EVIDENCE** | Historical comment separates recorded bounty from payment pending funding. |
| [`MyZubsterGateway#259`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/259) — Notifications | `laurentketterle-hub` | **DISPUTED:** 100 MYZ in issue vs 250 MYZ later | [PR #330](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/330) merged | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Published transaction hash is a placeholder; historical receipt/payment comments conflict. |
| [`MyZubsterGateway#278`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/278) — MYZ/XMR swap | `laurentketterle-hub` / substitute implementation attribution disputed | **DISPUTED:** 150 MYZ in issue vs 250 MYZ later | Contributor [PR #296](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/296) not merged; substitute PRs #911/#912 merged by maintainer | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Historical payment statement used a placeholder hash and does not resolve authorship/acceptance. |
| [`MyZubsterGateway#725`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/725) — API documentation | `krysto9872` | **DISPUTED:** 600 MYZ / 0.05 XMR equivalence asserted | [PR #763](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/763) closed and not merged | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Simulated/placeholder transaction and merge identifiers; contributor explicitly requested real evidence. |
| [`MyZubsterGateway#769`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/769) — Fauna monitoring | `jihadMo` | 700 MYZ; later described as USDT equivalent | Issue closed; canonical linked PR not identified in the issue thread | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Wallet was posted but transaction ID and network remained placeholders; contributor later requested settlement evidence for an aggregate claim. |
| [`MyZubsterGateway#883`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/883) — 2-of-3 escrow | `laurentketterle-hub` | 500 MYZ | [PR #936](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/936) merged | **NOT ESTABLISHED** | **UNSETTLED / NOT VERIFIED** | Historical `PAGATO` statements contain no transaction, network or explorer evidence. |
| [`MyZubsterGateway#722`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/722) — Wallet API | `Aming9303` / `laurentketterle-hub` attribution disputed | **DISPUTED:** 800 MYZ and 0.127 XMR conversion commitment | Initial [PR #773](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/773) not merged; later [PR #954](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/954) merged from another contributor | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Payment was first deferred, then described as paid without independent evidence and with changed attribution. |

| [`MyZubster-Marketplace#33`](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/issues/33) — AgricoloBot Telegram bot | `testdasislyt`, `ManyRios`, `Samarth1306w`, `laurentketterle-hub` claims/contributions require reconciliation | **DISPUTED:** 200 MYZ + 1% lifetime in issue; later 150 MYZ described as paid | [PR #42](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/pull/42) open; [PR #39](https://github.com/MyZubster-Ecosystem/MyZubster-Marketplace/pull/39) closed and not merged | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Issue paused on 2026-09-01. Revenue-share promise is not approved/funded; payment statements lack transaction evidence; attribution and accepted implementation remain unresolved. |

| [`myzubster#570`](https://github.com/MyZubster-Ecosystem/myzubster/issues/570) — Mira Vale character sheet | `Aming9303` | **500 MYZ internal accounting unit** | [PR #885](https://github.com/MyZubster-Ecosystem/myzubster/pull/885) merged on 2026-09-01, commit `738ffb3d2622146d9405dbb7475c58ca7a6283a8`; acceptance criteria verified | **REWARD_RECORDED** | **NOT APPLICABLE / NO EXTERNAL SETTLEMENT CLAIM** | Canonical ledger entry created after technical acceptance. This records internal MYZ accounting only; no on-chain or external payment is asserted. |\n| [`myzubster#221`](https://github.com/MyZubster-Ecosystem/myzubster/issues/221) — token/native payment | `laurentketterle-hub` named in issue; implementation PR authored by maintainer | 500 MYZ stated only in completion comment | [PR #274](https://github.com/MyZubster-Ecosystem/myzubster/pull/274) merged by `DanielIoni-creator` | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Historical `Pagato` statement has no transaction/network/asset evidence and does not resolve contribution attribution. |
| [`MyZubsterGateway#271`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/271) — Gateway status page | `laurentketterle-hub` named in comments; implementation PR authored by maintainer | **DISPUTED:** 35 MYZ + 10 points in issue vs 250 MYZ in payment statements | [PR #918](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/918) merged by `DanielIoni-creator` | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Multiple receipt comments exist, but no transaction/network/explorer evidence was published and PR authorship does not match the credited contributor. |
| [`MyZubsterGateway#339`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/339) — automated code review | `laurentketterle-hub` | **DISPUTED:** 150 MYZ in issue, 100 MYZ in PR title/final statement, 250 MYZ in other payment statements | [PR #354](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/354) merged | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | Multiple receipt comments exist, but no transaction hash or independently verifiable network evidence was published. |
| [`MyZubsterGateway#747`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/747) — seed marketplace | `jdjioe5-cpu`, `devyeyostellar`, `laurentketterle-hub` attribution/claim history disputed | **DISPUTED:** 0.04 XMR or 250 MYZ; another comment proposed 0.06 XMR | [PR #953](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/953) merged by `laurentketterle-hub`; earlier PR/assignment history conflicts | **NOT ESTABLISHED** | **DISPUTED / NOT VERIFIED** | A pending-payment placeholder was followed by `PAGATO` and receipt comments, but no transaction hash/network/explorer evidence was published. |

Reviewed on 2026-09-01 against current GitHub issue/PR state. These rows record the strongest status supported by public evidence; they do not erase contributor claims or substitute for technical review.

## Paused external-unfunded listings

On 2026-09-01, seven open MyZubster-Robot listings advertising a combined **0.17 XMR** were marked `PAUSED · EXTERNAL_UNFUNDED · NO NEW CLAIMS` because no publicly auditable ecosystem-treasury reservation was identified:

- [#42](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/42) — 0.01 XMR
- [#43](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/43) — 0.03 XMR
- [#44](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/44) — 0.02 XMR
- [#45](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/45) — 0.01 XMR
- [#46](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/46) — 0.02 XMR
- [#47](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/47) — 0.05 XMR
- [#48](https://github.com/MyZubster-Ecosystem/MyZubster-Robot/issues/48) — 0.03 XMR

The issues remain open to preserve history and attribution. Reactivation requires a specific, auditable ecosystem funding reservation under `BOUNTIES.md` and `TREASURY.md`.

## Reported aggregate claims awaiting itemization

The following are contributor-reported aggregates. They are recorded to preserve the claim, but are **not yet independently recomputed or accepted as a final project obligation**. Each amount must be decomposed into issue/PR rows and checked against the original reward wording, technical acceptance, duplicate claims, internal-ledger state and settlement evidence.

| Repository / scope | Contributor | Reported amount | Current status | Transaction evidence | Notes |
|---|---|---:|---|---|---|
| `MyZubsterGateway` — multiple historical bounty PRs | `laurentketterle-hub` | **90,270 MYZ reported across 49 merged PRs**, plus additional PRs without a stated amount | **PENDING ITEMIZATION / DISPUTED** | None published | Contributor report preserved in [issue #789](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/789#issuecomment-5292756513). The aggregate must not be presented as verified, paid or finally reconciled until each row is checked. |
| `MyZubsterGateway` — multiple merged PRs | `jihadMo` | Amount not yet itemized | **PENDING ITEMIZATION / PENDING VERIFICATION** | None published | Contributor publicly reported merged work without verifiable spendable settlement in [issue #282](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/282#issuecomment-5302516932). |

## Legacy wording audit

A repository audit found historical MyZubsterGateway bounty issues that used wording such as **“Pagamento: via gateway dopo il merge”** or **“Pagamento automatico via gateway dopo il merge.”** These phrases are historical and must not be interpreted as current proof of funding or settlement.

Known audit queue includes, among others:

- `#255`, `#257`, `#259`, `#261`;
- `#268`, `#271`, `#274`, `#276`–`#284`;
- `#338`, `#339`, `#344`, `#345`, `#347`;
- `#358`, `#360`–`#367`, `#371`–`#377`;
- `#389` historical bounty-program announcement.

Tracking issue: `MyZubster-Ecosystem/MyZubsterGateway#1380`.

This list is an **audit queue**, not a statement that the listed issues share the same contributor, completion, funding or settlement state.

## How to add or update a row

For each bounty/reward, record:

```text
Repository / issue:
Contributor:
Reward amount / asset:
Funding state:
Contribution verification state:
Reward-record state:
Settlement rail (if any):
Settlement state:
Evidence links:
Reviewed by / date:
```

Do not infer `FUNDED`, `REWARD_RECORDED`, `SETTLEMENT_PENDING` or `SETTLED` from an issue label, assignment, PR, merge, closed state or historical promotional text.

## Relationship to bounty governance

The lifecycle and acceptance rules are defined in [`BOUNTIES.md`](BOUNTIES.md). This ledger records public reward/settlement status; it does not replace the bounty acceptance criteria.

If this ledger, an old issue and promotional copy disagree, use the most conservative state supported by independently verifiable evidence and open a documentation/audit issue to reconcile the discrepancy.
