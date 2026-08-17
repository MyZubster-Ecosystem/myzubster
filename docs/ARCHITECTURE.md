# MyZubster Architecture & Economic Rules

## Purpose

This document defines the ownership boundaries and invariants for Market revenue, Treasury funds, Bounties, Gateway settlement, verification, and Robot execution.

## Components

### MyZubster Core
Owns product orchestration, bounty lifecycle, contributor interactions, and business rules. It does not act as the source of truth for Treasury balances or blockchain transaction confirmation.

### Market
Generates revenue and records the economic event that makes funds eligible for Treasury credit. Market revenue is not itself a bounty payment.

### Treasury
Owns available/reserved balances and funding provenance. Treasury is the source of truth for whether funds are available for allocation.

Treasury responsibilities:
- credit revenue from Market;
- maintain available and reserved balances;
- reserve/release funds atomically;
- prevent concurrent overspending;
- record source/reference for allocations;
- expose auditable balance and reservation state.

Treasury must never mark a bounty `PAID`.

### Bounty
Owns reward configuration and bounty state.

A bounty may select:
- `MYZ` — immediately available through the existing verified payment path;
- `XMR` — may be selected before XMR Treasury/payment launch, but remains `XMR_PENDING` until that path is online;
- `MYZ + XMR` — explicit split reward components.

MYZ and XMR are explicit assets. No silent conversion is allowed.

### Contributor Wallet
For every selected payment asset, the contributor supplies the destination wallet. That wallet is the sole recipient for the payment attempt. There is no silent platform/default-wallet fallback.

Once settlement begins, the submitted wallet is immutable for that payment attempt. Corrections require an explicit cancellation/reissue flow and audit event.

Missing or invalid wallet data blocks settlement.

### Gateway / Settlement
Owns payment submission and settlement state. It does not determine Treasury availability and does not trust an adapter response as proof of payment.

### Independent Verifier
Owns the authoritative verification decision for an external payment. Before `CONFIRMED`/`PAID`, it must verify at minimum:
- recipient;
- asset;
- network;
- amount;
- transaction ID;
- transaction status/confirmation requirements.

### Robot
Owns automation/execution workflows and may coordinate actions, but cannot bypass Treasury or independent payment verification.

## Canonical economic flow

```text
Market revenue
    |
    v
Treasury credit
    |
    v
Bounty allocation / reservation
    |
    v
Contributor wallet captured + validated
    |
    v
Payment submission
    |
    v
Independent verification
    |
    v
CONFIRMED
    |
    v
PAID
```

For XMR:

```text
Market -> XMR Treasury -> XMR bounty allocation -> XMR payment -> independent verification -> PAID
```

## State ownership

| State/data | Source of truth |
|---|---|
| Market revenue event | Market |
| Treasury available balance | Treasury |
| Treasury reservation | Treasury |
| Bounty reward selection | Bounty/Core |
| Contributor payment wallet | Bounty/Settlement record |
| Payment submission | Gateway |
| External transaction truth | Independent Verifier |
| Final bounty paid state | Bounty, only after verified settlement |

## Non-negotiable invariants

1. Treasury allocation does not imply payment.
2. Payment submission does not imply payment confirmation.
3. An adapter response alone can never transition a bounty to `PAID`.
4. Treasury cannot be overspent, including under concurrent allocations.
5. A contributor-provided wallet is the sole payment recipient for that attempt.
6. Invalid or missing wallet data blocks settlement.
7. XMR rewards remain non-payable until the XMR Treasury/payment path is online and independently verified.
8. MYZ-only bounties remain backward compatible.
9. Every Treasury credit, reservation, allocation, submission, verification, release/refund, and reissue is auditable.
10. Failed, expired, cancelled, or unverifiable payments must not silently become `PAID`.

## Bounty reward states

Recommended state semantics:

- `MYZ_READY` — MYZ reward can enter the normal verified settlement flow.
- `XMR_PENDING` — XMR selected but XMR Treasury/payment path is not live.
- `ALLOCATED` — Treasury funds reserved for the bounty.
- `SUBMITTED` — payment submitted to the external payment system.
- `CONFIRMED` — independently verified external transaction.
- `PAID` — final bounty state after verification.
- `FAILED` — payment attempt failed and requires defined retry/release behavior.
- `CANCELLED` — allocation/payment attempt explicitly cancelled with audit trail.

## Implementation rule

New bounty/settlement code must preserve these boundaries. Changes that move Treasury accounting into the Gateway, bypass independent verification, introduce a default recipient wallet, or allow an adapter-only `PAID` transition require explicit architectural review.