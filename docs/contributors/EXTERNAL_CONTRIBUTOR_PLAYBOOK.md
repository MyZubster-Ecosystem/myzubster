# External Contributor Playbook

This playbook turns the verified ID-BNT-0003 contribution cycle into the default evidence-first operating model for external MyZubster contributors.

## Canonical lifecycle

```text
DISCOVER / CLAIM
-> IMPLEMENT
-> PR OPENED
-> REVIEW
-> CHANGES ADDRESSED
-> APPROVED
-> MERGED
-> CONTRIBUTION VERIFIED
-> MYZ REWARD RECORDED (if applicable)
-> EXTERNAL SETTLEMENT VERIFIED (only if independently evidenced)
-> RETURNING CONTRIBUTOR
```

No step may be inferred from a later-looking event. In particular:

- a claim is not a submission;
- a PR is not approval;
- a merge is not automatically contribution verification;
- verification is not MYZ recording;
- MYZ recording is not external payment;
- GitHub activity is not proof of partnership, funding, legal identity, or market adoption.

## Provenance required per completed contribution

Record at minimum:

- public GitHub alias;
- source issue/bounty;
- PR number and merge commit;
- review outcome and material requested changes;
- verification/acceptance evidence;
- MYZ amount only when explicitly defined;
- ledger entry ID only after append-only internal accounting;
- external settlement evidence only when independently checkable.

## Reference implementation

The first reference cycle is:

- contributor: `Aming9303`;
- bounty: `ID-BNT-0003` / issue #566;
- PR: #602;
- contribution state: `VERIFIED`;
- MYZ accounting entry: `MYZ-LEDGER-000002` for 2,500 MYZ;
- external settlement: `NOT VERIFIED`.

See `docs/bounties/ID-BNT-0003-VERIFICATION.md`, `myz/ledger.json`, `bounty-engine/registry.json`, and `REWARDS_LEDGER.md`.

## Maintainer response standard

External contributor work should receive a concrete review as quickly as practical. Reviews should distinguish blockers from suggestions, explain acceptance criteria, and avoid vague rejections. When a contributor addresses blocking findings, re-review the latest commit rather than relying on stale review state.

## Reward discipline

Do not invent a reward because an issue carries a `bounty` label. A reward must have an explicit amount and accounting/rail semantics. If absent, record the reward state as `UNSPECIFIED` until maintainers define it.

When a contribution is verified and an internal MYZ reward is explicitly authorized, append a new immutable `myz/ledger.json` entry. Never reuse an `entry_id`; corrections require a reversing entry.

## Current application queue

- PR #635 / issue #620: review/approval exists; advance only according to its defined reward boundary after merge and verification.
- MyZubsterGateway issue #1380 / `abylyn-xx02`: claim/work-in-progress only until a PR exists and is reviewed; reward remains unspecified unless explicitly defined.

## Traction metrics

Count evidence-backed states, not impressions:

- unique external contributors;
- claims that become PRs;
- PRs that reach substantive review;
- requested changes addressed;
- approved contributions;
- merged contributions;
- verified contributions;
- MYZ rewards recorded;
- returning contributors.

Use these metrics to describe community maturity conservatively.
