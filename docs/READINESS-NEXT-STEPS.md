# MyZubster Readiness — Next Steps

This short execution note complements [`ROADMAP.md`](ROADMAP.md) and [`P0-READINESS-CHECKLIST.md`](P0-READINESS-CHECKLIST.md).

## Immediate sequence

1. Re-check current CI/workflow health.
2. Configure the independent verifier in a controlled integration environment.
3. Add fail-closed verifier integration tests.
4. Implement/verify Treasury reservation, release/refund and reconciliation behavior.
5. Add concurrency and replay/idempotency tests.
6. Run the complete controlled bounty/payment flow.
7. Only after P0 exit criteria are satisfied, continue with P1 payment-rail validation.

## Parallel visible product work

While P0 is being hardened, development can continue on:

- Escrow monitoring dashboard;
- frontend display of verified payment/bounty states;
- explicit escrow/funding-state publication;
- Photo & Visual Map Phase 1.

Parallel product work must not be presented as evidence that production payment readiness has been achieved.
