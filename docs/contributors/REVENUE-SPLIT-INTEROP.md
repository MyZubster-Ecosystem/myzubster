# Revenue Split Interoperability Contract

Canonical checkpoint for issue #1557.

This contract exists to compare the same deterministic revenue-split calculation in:

1. the MyZubster core repository; and
2. an independently controlled contributor environment.

Source implementation: PR #1550, merged into `main`.

## Boundary

This interface is **calculation-only**.

It must not:
- move funds;
- access wallets/private keys;
- mutate treasury balances;
- execute settlement;
- claim payout.

## Canonical fixture

Machine-readable vectors live at:

`tests/fixtures/revenue-split-interop-v1.json`

A conforming implementation must reproduce the exact expected fields for the fixed vectors and preserve:

`creator_amount + treasury_allocation + myzubster_project_revenue == gross_amount`

For all test cases, `settlement_executed` must remain `false`.

## Contributor-side reproduction

If @lamkyo explicitly accepts the node checkpoint, the contributor-side evidence should publish:

- repository and branch;
- commit SHA;
- Python/runtime version;
- exact command;
- exact serialized result for each vector;
- output/fixture hash where useful;
- PASS/FAIL;
- limitations.

A matching result establishes only this bounded economic-calculation interoperability checkpoint. It does not establish treasury authority, payment settlement, token value, DAO membership, or full decentralization.

Related: #1550, #1557, #1554.
