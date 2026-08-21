# MyZubster P0 Readiness Checklist

_Last reviewed: 2026-08-21_

This checklist turns the P0 section of [`docs/ROADMAP.md`](ROADMAP.md) into an executable verification plan.

## Baseline already present

- [x] PR #408 merged into `main`.
- [x] Explicit payment lifecycle exists: `PENDING`, `SUBMITTED`, `CONFIRMED`, `FAILED`, `CANCELLED`.
- [x] Confirmation is designed to fail closed when no independent verifier is configured.
- [x] Adapter/verifier contracts exist.

## 1. CI / workflow health

- [ ] Inspect current GitHub Actions runs on the relevant payment/bounty paths.
- [ ] Resolve any active `action_required`, failing or blocked checks.
- [ ] Record the release-candidate commit SHA used for final P0 verification.

**Exit evidence:** links/IDs for green or intentionally waived checks, with reason documented for any waiver.

## 2. Independent verifier

- [ ] Configure a verifier in a non-production integration environment.
- [ ] Verify the provider/network/asset being checked is explicit.
- [ ] Verify transaction evidence is validated independently of the submitter/adapter.
- [ ] Reject missing, malformed or unverifiable transaction evidence.
- [ ] Reject evidence for the wrong recipient, asset/network or canonical amount.

**Exit evidence:** integration-test output showing valid confirmation and expected rejection cases.

## 3. Fail-closed state transitions

- [ ] Prove `SUBMITTED → CONFIRMED` is impossible with verifier disabled.
- [ ] Prove `SUBMITTED → CONFIRMED` is impossible when verifier returns failure/unknown.
- [ ] Prove only independently verified evidence can produce `CONFIRMED`.
- [ ] Verify failed/cancelled payments cannot later be confirmed without an explicit valid recovery path.

**Exit evidence:** automated negative-path tests.

## 4. Treasury semantics

- [ ] Reserve funds before payment submission.
- [ ] Prevent reservation above available balance.
- [ ] Release reservation after confirmed settlement according to the accounting model.
- [ ] Refund/release reservation after failed or cancelled settlement.
- [ ] Reconcile Treasury state with internal payment state and external verification state.
- [ ] Make reconciliation safe to run repeatedly.

**Exit evidence:** tests for reserve, release, refund and reconciliation.

## 5. Concurrency / overspend protection

- [ ] Simulate two or more concurrent allocations against the same available balance.
- [ ] Confirm total successful reservations never exceed available funds.
- [ ] Confirm failed competing reservations do not corrupt Treasury state.
- [ ] Confirm retries remain idempotent.

**Exit evidence:** deterministic concurrency test with final balance/reservation assertions.

## 6. Replay / duplicate protection

- [ ] Submit the same transaction/verifier event twice.
- [ ] Confirm duplicate callbacks cannot create a second confirmation or settlement.
- [ ] Confirm repeated reconciliation leaves the state unchanged after convergence.
- [ ] Confirm duplicate client retries do not create multiple logical payments.

**Exit evidence:** replay/idempotency tests.

## 7. End-to-end controlled flow

Run at least one complete controlled flow:

```text
bounty/submission
      ↓
acceptance verification
      ↓
Treasury reserve
      ↓
payment submit
      ↓
independent verifier
      ↓
CONFIRMED
      ↓
Treasury/payment reconciliation
      ↓
public evidence/status record
```

- [ ] Positive path passes.
- [ ] Verifier unavailable path fails closed.
- [ ] Wrong transaction evidence path is rejected.
- [ ] Insufficient Treasury path is rejected before submission.
- [ ] Duplicate/replay path remains idempotent.

## P0 definition of done

P0 is complete only when all required items above are checked and reproducible evidence is attached to a commit, PR, CI run or test report.

Completion of P0 does **not** by itself mean MyZubster is production-ready. P1 payment-rail validation and P2 deployment readiness remain required before production payment claims.