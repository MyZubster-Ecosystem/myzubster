# XMR Stagenet Settlement — MyZubster

Status: **active implementation / validation**

This document tracks the current Monero settlement implementation that lives in [`MyZubsterGateway`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway).

## Why this exists

MyZubster deliberately separates internal reward accounting from external settlement:

```text
MYZ INTERNAL REWARD ACCOUNTING
        ↓
AUTHORIZED EXTERNAL SETTLEMENT INTENT
        ↓
SUBMITTER / WALLET BOUNDARY
        ↓
MONERO STAGENET TRANSACTION
        ↓
INDEPENDENT VERIFIER
        ↓
CONFIRMED
        ↓
PAID
```

`MYZ` remains internal reward/accounting logic. An issue, PR, merge, ledger update or wallet-provider response is not proof of an external XMR payment.

## Current implementation

The first verifiable XMR settlement path is being implemented in `MyZubsterGateway` under:

- issue [`MyZubsterGateway#1403`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/1403);
- PR [`MyZubsterGateway#1404`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/1404);
- branch `feat/xmr-stagenet-e2e`.

The implementation currently includes:

- **stagenet-only safety gate** for the first E2E path;
- canonical positive integer **XMR atomic amount** handling;
- strict **64-hex TXID validation**;
- explicit separation between transaction **submitter** and **independent verifier**;
- settlement submission that may reach `SUBMITTED` but can never self-declare `PAID`;
- **fail-closed** verification behavior;
- recipient, amount, network and TXID consistency checks;
- minimum-confirmation enforcement before finality;
- idempotent/replay-safe submission behavior;
- negative-path tests for wrong network, malformed amount, duplicate submission, missing verifier, timeout, wrong recipient, wrong amount, wrong TXID and insufficient confirmations;
- a single successful verification path that may transition to `PAID` only after independent evidence matches the expected settlement.

## Settlement lifecycle

The current settlement model is evidence-first:

```text
PENDING
  ↓
ACCEPTED
  ↓
SUBMITTED
  ↓
CONFIRMED
  ↓
PAID
```

Failure/recovery states may include `UNSETTLED`, `FAILED` and `DISPUTED`.

A submitter response is treated as evidence that submission was attempted, not as finality. The verifier must independently establish that the observed transaction matches the expected network, destination, canonical amount and transaction identifier with the required confirmations.

## Verification boundary

The verifier is intentionally a separate dependency boundary. The system must not infer success when verification is unavailable.

Examples that must remain non-final include:

- verifier unavailable;
- verifier timeout;
- wrong network;
- wrong recipient;
- wrong atomic amount;
- wrong TXID;
- insufficient confirmations;
- malformed or incomplete evidence.

These cases remain `UNSETTLED` or otherwise non-`PAID` until valid evidence is available.

## CI status

On the current XMR implementation branch, the principal functional CI workflows have passed, including the main `CI`, `CI Boost`, quality and lint/typecheck checks. A separate performance workflow has reported a failure and is tracked independently rather than being represented as functional settlement success.

CI success proves automated checks for the implementation under test. It does **not** prove that a real Monero transaction has occurred.

## Next validation gate

The next milestone is to connect the dependency-injected submitter/verifier contracts to:

1. an authorized `monero-wallet-rpc` instance configured for **stagenet**;
2. a separately configured read-only / independent verification source;
3. one tiny-value real stagenet transaction;
4. a sanitized evidence package showing the transaction lifecycle without publishing wallet seeds, private keys, passwords or other secrets.

Until that real stagenet transaction is executed and independently verified, MyZubster must describe the implementation as **runtime + automated tests in active validation**, not as a completed real-world XMR payout.

## Mainnet gate

Mainnet is intentionally outside the current milestone. No mainnet activation should occur merely because stagenet tests pass.

Before any future mainnet consideration, the project should require an explicit production review covering at minimum:

- wallet custody model;
- secret/key management;
- RPC authentication and network isolation;
- authorization of settlement intent;
- amount and destination controls;
- idempotency/replay protection;
- independent chain verification;
- monitoring and reconciliation;
- incident/rollback procedure;
- legal/compliance review where applicable.

## Evidence vocabulary

Use these terms consistently:

```text
IMPLEMENTED
    ↓
AUTOMATED TESTS PASS
    ↓
STAGENET RUNTIME WIRED
    ↓
REAL STAGENET TX SUBMITTED
    ↓
INDEPENDENTLY VERIFIED
    ↓
REPRODUCIBLE E2E EVIDENCE
```

Only the final stages justify claims of an actual externally verified settlement. None of these states automatically implies production readiness or mainnet deployment.
