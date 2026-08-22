# P0 MongoDB Treasury Persistence

_Status: persistent integration layer; not production settlement._

This layer replaces the controlled in-memory Treasury store with a MongoDB-backed store for P0 integration work.

## Storage model

Two collections are used:

- `TreasuryAccount`: one account per `asset + network`, with `availableAtomic`, `reservedAtomic` and `settledAtomic` counters;
- `TreasuryReservation`: one globally unique `reservationId`, bound to an account, exact atomic amount and lifecycle state.

Atomic amounts are stored as MongoDB `Decimal128` integer values. The implementation rejects non-integer values and values above 34 integer digits so arithmetic remains exact within Decimal128 precision.

## Transaction boundary

Reserve, settle and release operations use MongoDB multi-document transactions with snapshot reads and majority writes.

The required deployment topology therefore needs transaction support (for example MongoDB Atlas or a replica set). A standalone MongoDB server is not sufficient for this store.

### Reserve

Inside one transaction:

1. check whether the reservation already exists;
2. if it exists with the same account and amount, return an idempotent replay;
3. conditionally decrement `availableAtomic` only when enough balance exists;
4. increment `reservedAtomic`;
5. create the reservation record.

### Settle

Inside one transaction:

1. transition `RESERVED -> SETTLED`;
2. decrement `reservedAtomic`;
3. increment `settledAtomic`.

### Release

Inside one transaction:

1. transition `RESERVED -> RELEASED`;
2. decrement `reservedAtomic`;
3. return the amount to `availableAtomic`.

Final states are replay-safe and contradictory state reversals are rejected.

## Controlled payment flow compatibility

`src/services/controlledPaymentFlow.js` now awaits Treasury operations, so the same flow can use either the synchronous in-memory test store or the asynchronous persistent MongoDB service.

The persistent path is:

```text
TreasuryAccount / TreasuryReservation
        ↓
MongoTreasuryStore
        ↓
createMongoTreasuryService
        ↓
controlledPaymentFlow
        ↓
adapter submit
        ↓
independent verifier
        ↓
MongoDB reconciliation
```

## What this does not prove yet

This change does not complete P0. Before production claims, the project still needs:

- a real non-production Mongo replica-set integration run;
- multi-process concurrent reservation tests against that database;
- crash/restart tests between reserve, submit, verify and reconcile;
- duplicate reservation race tests against the real unique index;
- reconciliation after process restart;
- rail-specific canonical amount conversion;
- real non-production provider/verifier evidence;
- final CI and release-candidate evidence.

No database credentials, wallet credentials, provider tokens or secrets belong in Git.
