# Bounty Engine Integration Contract

## Program ingestion

Identity, Comics and future bounty programs should expose stable challenge identifiers and rewards. The engine imports them only when the source policy/challenge files are merged or otherwise treated as canonical.

Normalized fields:

```json
{
  "bounty_id": "ID-BNT-0001",
  "program": "identity",
  "title": "Independent hash verification",
  "reward_myz": 100,
  "status": "OPEN",
  "source_issue": "https://github.com/.../issues/564",
  "claimant": null,
  "submission": null,
  "review": null,
  "ledger_entry_id": null,
  "history": []
}
```

## Claim

A claim associates one contributor identity/reference with a bounty. Claim policy remains program-specific. The engine records only the normalized outcome.

## Submission

Submission evidence should reference reproducible public artifacts when possible: PRs, commits, CIDs, hashes, documents or test outputs. Sensitive security evidence may remain private and be referenced by a redacted identifier.

## Review

The reviewer records one of:

- `VERIFIED`
- `REJECTED`
- `REVISION_REQUESTED`

Only `VERIFIED` can advance toward MYZ accounting.

## MYZ ledger bridge

After verification, a separate ledger operation creates an append-only MYZ ledger entry. The engine record then stores the returned `ledger_entry_id` and moves from `VERIFIED` to `MYZ_RECORDED`.

The intended linkage is:

```text
Bounty ID
   -> verified contribution/evidence
   -> MYZ ledger entry ID
   -> contributor account/reference
   -> amount in MYZ
```

The engine must never generate a fake ledger ID merely to close a bounty.

## Future API surface

A service implementation can expose:

- `GET /bounties`
- `GET /bounties/:id`
- `POST /bounties/:id/claim`
- `POST /bounties/:id/submit`
- `POST /bounties/:id/review`
- `POST /bounties/:id/record-myz`
- `GET /contributors/:id/bounties`
- `GET /contributors/:id/reputation`

Authentication, authorization, rate limits and anti-abuse controls must be implemented before exposing write endpoints publicly.

## Reputation

A future reputation score should derive only from verifiable events such as completed verified bounties, rejected submissions, review history and contribution diversity. Identity characteristics, tattoos, cultural affiliation, protected attributes or unrelated personal information must not influence the score.