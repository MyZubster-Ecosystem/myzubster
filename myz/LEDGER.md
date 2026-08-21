# MYZ Canonical Ledger v1

MYZ is the MyZubster internal reward/accounting unit. This ledger specification makes MYZ rewards auditable and portable across bounty programs without claiming that MYZ is currently an on-chain token or fiat-equivalent asset.

## Core rules

1. Every balance change is an immutable ledger entry.
2. Entries are append-only; corrections use reversing entries rather than editing history.
3. Every entry has a stable `entry_id`, timestamp, subject/account, amount, reason and evidence reference.
4. Positive amounts credit MYZ; negative amounts debit MYZ.
5. Bounty rewards are recorded only after the corresponding contribution reaches the verified/approved state required by its program.
6. `REWARD_RECORDED` means an internal MYZ accounting credit. It is not proof of blockchain settlement or fiat payment.
7. Public ledgers should use project/user identifiers that avoid unnecessary personal information.

## Entry model

```json
{
  "entry_id": "MYZ-LEDGER-000001",
  "timestamp": "2026-08-21T00:00:00Z",
  "account_id": "contributor:github:example",
  "amount_myz": 500,
  "entry_type": "BOUNTY_REWARD",
  "reference": {
    "program": "identity",
    "bounty_id": "ID-BNT-0002",
    "issue": 565
  },
  "status": "RECORDED",
  "evidence": [],
  "reverses_entry_id": null,
  "note": "Verified contribution reward"
}
```

## Allowed entry types

- `BOUNTY_REWARD`
- `CREATIVE_REWARD`
- `ADJUSTMENT_CREDIT`
- `ADJUSTMENT_DEBIT`
- `REVERSAL`
- `TRANSFER` (reserved until transfer semantics are implemented and reviewed)

## Status model

- `PROPOSED` — not included in spendable/accounted balance.
- `APPROVED` — approved but not yet recorded.
- `RECORDED` — included in the internal MYZ balance.
- `REVERSED` — neutralized by a reversing entry.

## Balance rule

For a given `account_id`, the canonical internal balance is the sum of all `RECORDED` entries that have not been neutralized by a valid reversal.

## Integrity and publication

The public ledger should be periodically serialized deterministically, hashed with SHA-256, and published through the same decentralized publication model used by MyZubster public snapshots. Future versions may add Ed25519 signatures and IPFS/IPNS roots.

## Privacy

Do not store private keys, seed phrases, government identity documents, passwords, recovery codes or unnecessary personal data in the MYZ ledger.

## Future on-chain migration

If MYZ is ever represented on-chain, the chain state must be treated as a separate settlement layer with an explicit migration/bridge policy. Historical internal ledger credits must not be represented as on-chain transfers unless an independently verifiable migration transaction exists.