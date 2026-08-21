# P0 Treasury Reservation Contract

_Status: controlled-integration building block; not a production Treasury implementation._

This document defines the accounting semantics required before MyZubster can submit a payment from a funded Treasury.

## Purpose

A payment must not be submitted merely because a bounty is complete. Funds must first be reserved from a defined Treasury account, and the reservation must be reconciled with the independently verified external settlement result.

The first implementation in `src/services/treasuryReservationService.js` deliberately uses a pluggable store and includes an in-memory store for deterministic integration tests. It does **not** claim durable multi-process or production persistence.

## Amount representation

Treasury amounts are represented as positive **atomic-unit integer strings** such as:

```text
"250000000000"
```

The Treasury layer does not use JavaScript floating-point values for accounting. Per-rail code is responsible for converting a canonical human amount to the correct atomic-unit integer before reservation.

## Account identity

A Treasury account is scoped by:

```text
asset + network
```

Examples:

```text
MYZ:Tari
XMR:mainnet
TOKEN:polygon
```

Token contract identity must be added at the rail-specific persistence boundary before any production token settlement is enabled.

## Reservation lifecycle

```text
available
   ↓ reserve
RESERVED
   ├─ independent settlement confirmed → SETTLED
   └─ failed/cancelled settlement       → RELEASED
```

### Reserve

A reservation must:

- have a stable `reservationId`;
- be bound to one Treasury account and one exact atomic amount;
- fail before payment submission if sufficient available funds do not exist;
- reduce `available` and increase `reserved` exactly once;
- treat an identical replay as idempotent;
- reject a replay that reuses the same `reservationId` with a different account or amount.

### Settle

Settlement must:

- be allowed only from `RESERVED`;
- reduce `reserved` and increase `settled` exactly once;
- be replay-safe;
- reject an attempt to settle a reservation already released.

### Release / refund

Release must:

- be allowed only from `RESERVED`;
- return the reserved amount to `available` exactly once;
- be replay-safe;
- reject an attempt to release an already settled reservation.

## Reconciliation

The controlled integration contract maps independently verified external state as follows:

| External state | Treasury action |
|---|---|
| `confirmed` | settle reservation |
| `failed` | release reservation |
| `cancelled` | release reservation |
| `pending` | no accounting transition |
| `unknown` | no accounting transition |

Repeated reconciliation after convergence must not move funds twice.

## Concurrency requirement

For a balance of `100` atomic units, two concurrent reservation attempts of `70` must never both succeed.

The deterministic in-memory test covers the semantic requirement for a single-process controlled environment. A production store must provide an **atomic conditional reservation** at the database/provider boundary so the same invariant holds across multiple processes and hosts.

## Required durable-store follow-up

Before P0 can be considered complete in a deployable environment, replace or back the integration store with a durable implementation that provides:

- atomic conditional decrement of available funds;
- unique/idempotent reservation IDs;
- durable reservation state;
- crash-safe settle/release operations;
- multi-process concurrency guarantees;
- reconciliation after restart;
- audit timestamps and references;
- migration and backup/restore behavior.

## Integration order

```text
bounty accepted
      ↓
canonical rail amount
      ↓
Treasury reserve
      ↓
payment adapter submit
      ↓
independent verifier
      ↓
Treasury reconcile
      ↓
public/internal evidence record
```

No production payment rail should bypass the reservation step.
