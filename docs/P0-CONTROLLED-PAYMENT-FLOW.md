# P0 Controlled Payment Flow

_Status: controlled integration path; not production settlement._

This layer connects the P0 building blocks into one deterministic flow:

```text
bounty accepted
      ↓
Treasury reserve
      ↓
payment adapter submit
      ↓
independent verifier
      ↓
Treasury reconcile
```

The implementation is `src/services/controlledPaymentFlow.js`.

## Required invariants

1. Treasury reservation happens **before** payment adapter submission.
2. Insufficient Treasury balance prevents submission.
3. A missing independent verifier fails closed before submission and releases the reservation.
4. A verifier mismatch or failed settlement releases the reservation.
5. A confirmed independently verified settlement moves the reservation to `SETTLED` exactly once.
6. Replaying an already confirmed flow does not submit or settle twice.
7. A released reservation ID cannot silently be reused for a retry; a retry must use an explicit new reservation identity and policy decision.

## Controlled test coverage

`tests/controlledPaymentFlow.test.js` covers:

- positive reserve → submit → verify → settle;
- insufficient-balance rejection before adapter submission;
- missing-verifier fail-closed path;
- wrong verifier evidence;
- adapter failure and release;
- replay/idempotency after confirmation;
- rejection of silent reuse of a released reservation.

## Amount boundary

The Treasury receives `amountAtomic` as a canonical positive integer string. The bounty/payment request may still expose a human amount at the current application boundary. A rail-specific canonical conversion layer must be defined before a real rail is enabled.

## Remaining P0 work

This controlled flow does not complete P0. The remaining high-priority work includes:

- durable atomic Treasury persistence across processes/hosts;
- rail-specific canonical amount conversion;
- real non-production verifier/provider integration;
- crash/restart reconciliation tests;
- durable idempotency and callback/event replay handling;
- CI evidence for the full stacked flow;
- final release-candidate end-to-end evidence.

No production payment claim should be made from this controlled integration layer alone.
