# P0 Durable Payment Attempts

_Status: controlled crash-safety integration; not production settlement._

This layer closes a critical P0 ambiguity in the payment path:

```text
Treasury reserve
      ↓
payment adapter submit
      ↓
process crashes before txId is persisted
      ↓
unsafe retry could pay twice
```

The durable-attempt design records a stable payment identity **before** the external submit begins.

## Durable identity

Each attempt persists:

- `attemptId` — internal durable attempt identity;
- `reservationId` — the Treasury reservation bound to the attempt;
- `idempotencyKey` — stable key supplied to the payment provider/adapter boundary;
- SHA-256 hash of the canonical payment request;
- recipient, asset, network and amount;
- lifecycle state;
- transaction ID when known;
- last reconciliation/recovery error.

A replay with changed payment fields is rejected rather than silently reusing the same attempt.

## State machine

```text
PREPARED
   ↓ durable transition before external call
SUBMITTING
   ↓ provider returns txId
SUBMITTED
   ↓ independent verifier confirms exact transaction
CONFIRMED
```

`FAILED` and `CANCELLED` are terminal states only when the implementation has evidence that no ambiguous submitted payment remains.

## The important crash rule

`SUBMITTING` with no persisted `txId` is treated as **ambiguous**, not failed.

On restart the flow does **not** call `adapter.submit()` again automatically. It requires provider-side recovery through:

```js
adapter.recoverSubmission({
  attemptId,
  idempotencyKey,
  recipient,
  asset,
  network,
  amount,
})
```

If recovery returns the existing `txId`, the attempt becomes `SUBMITTED` and independent verification continues.

If the provider cannot resolve the submission outcome, the attempt remains recovery-required and the Treasury reservation stays reserved. This intentionally prefers a temporarily locked reservation over a possible duplicate payment.

Only a provider response that explicitly establishes `definitivelyNotSubmitted: true` permits the attempt to fail and the Treasury reservation to be released without a transaction ID.

## Verification rule after submission

Once a transaction ID exists, an inconclusive or mismatched independent-verifier result does **not** release Treasury funds automatically.

The attempt remains `SUBMITTED` and the reservation remains reserved until later reconciliation. This prevents an already-broadcast payment from being followed by a second allocation simply because an indexer or verifier was temporarily unavailable.

## CI evidence

The MongoDB replica-set CI job exercises two separate Node processes:

1. process A creates the Treasury reservation and durable attempt, then persists `SUBMITTING` with no transaction ID;
2. process A exits;
3. process B restarts from MongoDB state;
4. process B must call provider recovery using the same idempotency identity;
5. `adapter.submit()` is asserted to have zero calls in process B;
6. the recovered transaction ID is independently verified;
7. the durable attempt becomes `CONFIRMED` and Treasury becomes `SETTLED` exactly once.

This is a controlled provider-recovery simulation. It proves the application crash/restart invariant but does not prove a particular real payment provider implements compatible idempotency/recovery semantics.

## Required before a real rail

A real payment rail still needs:

- documented provider idempotency semantics;
- provider lookup/recovery by client reference or idempotency key;
- canonical rail-specific amount conversion;
- independent provider/chain verification in a non-production environment;
- callback/event deduplication;
- stale `SUBMITTING` operational alerting and reconciliation policy;
- timeout and provider-partition tests;
- release-candidate end-to-end evidence.

No wallet credentials, provider tokens, database secrets or private keys belong in Git.
