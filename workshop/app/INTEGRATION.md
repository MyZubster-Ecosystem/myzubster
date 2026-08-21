# Workshop -> Bounty Engine -> MYZ Ledger

The workshop mini-app can produce a `myzubster-myz-ledger-proposal/v1` only after a bounty submission has an explicit `VERIFIED` review.

`workshop/app/integrate.mjs` is the bridge into the canonical MYZ ledger and bounty registry.

## Canonical flow

`SERVICE_EVENT -> CLAIMED -> SUBMITTED -> UNDER_REVIEW -> VERIFIED -> ledger proposal -> RECORDED ledger entry -> MYZ_RECORDED`

## Recording rules

1. The proposal must still be `PROPOSED_NOT_RECORDED`.
2. The referenced bounty must be `VERIFIED`.
3. Proposal and bounty IDs must agree.
4. The canonical ledger must be `myzubster-myz-ledger/v1`.
5. An existing entry with the same proposal ID or review ID blocks a second recording.
6. The adapter creates a `RECORDED` internal MYZ accounting entry and returns updated bounty/proposal objects marked `MYZ_RECORDED`.
7. `RECORDED` does not prove fiat payment or blockchain settlement.

## Local verification

Run:

```bash
node workshop/app/domain.test.mjs
node workshop/app/integrate.test.mjs
node myz/verify-ledger.mjs myz/ledger.json
```

The adapter does not write automatically to the repository. A trusted ingestion process must review the returned objects before replacing canonical registry/ledger files. This preserves an auditable approval boundary and prevents a browser client from minting MYZ by itself.
