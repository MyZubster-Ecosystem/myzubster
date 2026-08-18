# MyZubster — Canonical GitHub Labels

This taxonomy is the shared issue/PR vocabulary for first-party repositories in `MyZubster-Ecosystem`.

`tari` is excluded because it is treated as an upstream/dependency repository rather than a normal MyZubster product repository.

## Type

- `type:bounty` — work with an explicitly declared reward path.
- `type:bug` — defect or regression.
- `type:feature` — product/engineering feature.
- `type:docs` — documentation-only work.
- `type:security` — defensive security, hardening or responsible-disclosure work.
- `type:ops` — deployment, reliability or operational work.

## Lifecycle

- `status:proposed`
- `status:validated`
- `status:approved`
- `status:funded`
- `status:active`
- `status:submitted`
- `status:review`
- `status:verified`
- `status:reward-recorded`

These labels describe project/bounty workflow state. They do not prove payment.

## Reward asset

- `reward:myz` — MYZ internal reward/ledger component.
- `reward:xmr` — XMR external-settlement component.
- `reward:token` — external token settlement component.

A bounty may carry more than one reward label. No implicit asset conversion is assumed.

## Settlement

- `settlement:pending`
- `settlement:submitted`
- `settlement:verified`
- `settlement:settled`
- `settlement:unsettled`
- `settlement:disputed`

`settlement:settled` is reserved for externally verifiable settlement evidence where an external rail is used. Internal MYZ credits must not be represented as blockchain settlement.

## Review / evidence

- `review:manual`
- `review:multi`
- `evidence:required`
- `sensitivity:normal`
- `sensitivity:elevated`
- `sensitivity:high`

High-sensitivity work must not encourage trespass, restricted-area access, sensitive security collection, confidential research capture or other unauthorized activity.

## Priority / contributor routing

- `priority:p0`
- `priority:p1`
- `priority:p2`
- `good first issue`
- `help wanted`
- `blocked`

## Canonical bounty transition

```text
PROPOSED
  → VALIDATED
  → APPROVED
  → FUNDED
  → ACTIVE
  → SUBMITTED
  → UNDER_REVIEW
  → VERIFIED
  → REWARD_RECORDED
  → SETTLEMENT_PENDING / SETTLED
```

The canonical bounty and settlement policy lives in [`../BOUNTIES.md`](../BOUNTIES.md).
