# MyZubster Bounty Platform Engine v1

This directory defines the canonical workflow engine that connects MyZubster bounty programs to the MYZ accounting ledger.

## Scope

The engine normalizes bounty state across Identity, Comics and future programs. It does not prove fiat or blockchain settlement. Its terminal accounting state is `MYZ_RECORDED`, meaning a verified reward has been recorded in the canonical internal MYZ ledger.

## Canonical lifecycle

```text
OPEN
  -> CLAIMED
  -> SUBMITTED
  -> UNDER_REVIEW
  -> VERIFIED | REJECTED
  -> MYZ_RECORDED
```

Optional operational transitions:

```text
CLAIMED -> OPEN          (claim released/expired)
SUBMITTED -> CLAIMED     (changes requested before formal review)
UNDER_REVIEW -> SUBMITTED (review requests revision)
REJECTED -> SUBMITTED    (resubmission allowed by policy)
```

## Core records

Each bounty instance must have:

- `bounty_id`: globally unique stable identifier;
- `program`: e.g. `identity`, `comics`;
- `source_issue`: GitHub issue reference when applicable;
- `title`;
- `reward_myz`;
- `status`;
- `claimant` when claimed;
- `submission` evidence reference when submitted;
- `review` result when reviewed;
- `ledger_entry_id` only after MYZ is recorded.

## Truth boundaries

- A GitHub issue being open does not mean a bounty is funded or paid.
- A claim does not reserve external money.
- A verified contribution does not itself mean MYZ has been recorded.
- `MYZ_RECORDED` requires an append-only entry in the canonical MYZ ledger.
- No state in this engine proves on-chain, bank or fiat settlement.

## Privacy and safety

Do not store secrets, private keys, seed phrases, credentials, unnecessary personal data or government identity documents in public bounty records. Security-sensitive evidence should be redacted or handled privately.

## Files

- `schema.json` — machine-readable bounty-instance schema.
- `state-machine.json` — allowed transitions.
- `engine.mjs` — local validator and transition tool.
- `registry.json` — bootstrap public bounty registry.

The engine is designed to consume canonical program definitions and eventually emit ledger-ready reward records for the MYZ ledger.