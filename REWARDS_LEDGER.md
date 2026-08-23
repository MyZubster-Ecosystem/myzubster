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
| `myzubster#566` / PR `#602` — Signed identity credential design | `Aming9303` | 2,500 MYZ | **VERIFIED** — approved after security hardening and merged | **NOT YET RECORDED** | **NOT VERIFIED** | Verification provenance: `docs/bounties/ID-BNT-0003-VERIFICATION.md`. Merge/verification does not itself create a MYZ accounting entry. |
| `MyZubsterGateway#257` — Wallet reale per Tari (MYZ) | `laurentketterle-hub` | 150 MYZ | Issue closed as completed | **NOT ESTABLISHED BY ISSUE** | **NOT VERIFIED** | Historical issue wording said payment after merge; issue was corrected on 2026-08-22 to clarify that closure/merge is not payment proof. |

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
