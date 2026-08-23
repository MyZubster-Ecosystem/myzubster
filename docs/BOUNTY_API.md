# Public Bounty Registry API

The MyZubster backend exposes the treasury-aware bounty registry at:

```text
GET /api/bounties
GET /api/bounties/:id
```

The API reads `bounty-engine/registry-v2.json` and preserves the canonical separation between internal MYZ accounting and external settlement.

## List bounties

```http
GET /api/bounties
```

Optional query filters:

- `classification=MYZ|EXTERNAL_UNFUNDED|FUNDED|HISTORICAL|FREE|MIXED`
- `work_state=PROPOSED|VALIDATED|APPROVED|ACTIVE|CLAIMED|SUBMITTED|UNDER_REVIEW|VERIFIED|REJECTED|CLOSED`
- `settlement_state=NOT_APPLICABLE|NOT_STARTED|REWARD_RECORDED|SETTLEMENT_PENDING|SUBMITTED|CONFIRMED|PAID|FAILED|CANCELLED`
- `asset=MYZ|XMR|FIAT|TOKEN|FREE`
- `funding_state=PROPOSED|UNFUNDED|RESERVED|FUNDED|HISTORICAL|FREE`
- `limit=1..200`

Examples:

```text
/api/bounties?asset=MYZ
/api/bounties?classification=EXTERNAL_UNFUNDED
/api/bounties?funding_state=FUNDED
/api/bounties?asset=XMR&funding_state=UNFUNDED
```

The response contains:

- registry version and generation timestamp;
- canonical policy links;
- applied filters;
- result count;
- summary grouped by classification, work state, settlement state, asset and funding state;
- registry entries.

## Read one bounty

```http
GET /api/bounties/:id
```

Example:

```text
/api/bounties/robot-31-singapore
```

Returns `404` when the registry ID does not exist.

## Trust boundary

The endpoint is a read-only public view of the registry. It does **not** create, fund, verify or pay a bounty.

In particular:

- `MYZ` is the internal reward/accounting unit unless a separately defined external rail exists;
- `EXTERNAL_UNFUNDED` is not a payment promise;
- `FUNDED` is valid only when an auditable ecosystem reservation is recorded;
- no silent MYZ↔XMR/fiat/token conversion is allowed;
- `PAID` requires independently verifiable settlement evidence.

Canonical policy:

- `BOUNTIES.md`
- `TREASURY.md`
- `myz/LEDGER.md`
