# Payment Dashboard (issue #306)

A payments dashboard for contributors and admins that exposes the MyZubster
funding flow as **separate, individually auditable layers** instead of
collapsing it into one "paid / not paid" flag.

## Why the layers are separate

The flow is modelled as six independent states:

```text
incoming payment (BTC | Stripe)
  -> confirmed / settled
  -> available balance
  -> conversion pending / completed
  -> bounty approved
  -> XMR payout pending / completed / failed
```

Two rules are enforced by design rather than by convention:

1. **Receiving BTC or a Stripe payment never approves a bounty.** Funding inputs
   are inputs. Approval is a separate, reviewed gate. Every funding-input row
   rendered by the dashboard is labelled `does not approve bounty`.
2. **Stripe does not convert to XMR.** BTC and Stripe are funding rails. The
   BTC/fiat → XMR conversion and the XMR payout live behind separate backend
   integrations (`myz/xmr-settlement-worker.mjs`).

## Unknown is never reported as zero

The dashboard reads canonical on-disk sources:

| Source | Provides |
|---|---|
| `myz/ledger.json` | MYZ internal reward accounting entries |
| `myz/settlement-queue.json` | XMR payout settlement items |
| `myz/settlement-policy.json` | the published state chain and rules |

Anything that cannot be derived from a configured source is returned as `null`
with a `reason`, and the UI renders it as **Unknown**. It is never rendered as
`0`. This is deliberate: `0` is a claim, `null` is an admission.

Concretely, in the current repository state the dashboard reports:

- **MYZ balance** — `80`, derived from the single `RECORDED` ledger entry.
- **XMR treasury balance** — `Unknown`. It lives in the Monero wallet RPC, which
  is not configured here.
- **Available balance, funding inputs, conversion, escrow** — `Unknown` /
  `Not configured`. No funding-input or conversion repository is wired yet, and
  the settlement queue is empty.

The dashboard is therefore honest and largely empty today. That is the correct
output, not a gap to be papered over with sample data.

## Endpoints

All endpoints require `Authorization: Bearer <JWT>`. Treasury-level layers
additionally require `role: "admin"`.

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/api/payment-dashboard/summary` | any | full dashboard payload |
| GET | `/api/payment-dashboard/meta` | any | policy, sources, warnings, integrity |
| GET | `/api/payment-dashboard/balances` | any | MYZ and XMR balances |
| GET | `/api/payment-dashboard/bounties` | any (scoped) | MYZ reward ledger entries |
| GET | `/api/payment-dashboard/payouts` | any (scoped) | XMR settlement items |
| GET | `/api/payment-dashboard/escrow` | any | escrow layer |
| GET | `/api/payment-dashboard/funding-inputs` | admin | BTC / Stripe receipts |
| GET | `/api/payment-dashboard/available-balance` | admin | settled-funds balance |
| GET | `/api/payment-dashboard/conversion` | admin | conversion layer |

Contributor-scoped endpoints narrow results to the caller's own
`contributor:github:<login>` account. A contributor with no entries receives an
empty list — never sample data.

### Filters

`summary`, `bounties` and `payouts` accept:

- `q` — free text across entry id, bounty id, account, program, note, evidence, txid
- `status`
- `program`
- `account` (admin only)
- `from`, `to` — ISO date window

## Idempotency and retries

Each payout row exposes its `idempotency_key` and a computed retry posture:

- `XMR_PAID` — terminal, resubmission refused.
- `XMR_PAYOUT_PENDING` — in flight, **do not resubmit**; the idempotency key
  guards against a duplicate transfer.
- `SETTLEMENT_FAILED` — retryable only once the listed `blockingReasons` are
  cleared (approval, MYZ credit, payout address, atomic amount, evidence).
- `SETTLEMENT_PENDING` — eligible for the next worker run.

## Wiring real sources

The service takes injectable providers, so a real integration can be added
without touching the dashboard:

```js
const { buildDashboard } = require('../src/services/settlementDashboardService');

buildDashboard({
  fundingInputsProvider: () => myBtcAndStripeRepository.snapshot(),
  conversionProvider: () => myConversionService.snapshot(),
  escrowProvider: () => myEscrowRepository.snapshot()
});
```

A provider may return `{ configured: false, reason, items: [] }` to keep the
layer visibly unconfigured. If a provider throws, the failure is recorded in
`warnings` and the layer degrades to unknown.

## Tests

- `tests/settlementDashboardService.test.js` — 23 tests: balance rules,
  reversal semantics, unknown-not-zero, filters, retry posture, unreadable
  sources.
- `tests/paymentDashboard.test.js` — 20 tests: authentication, role separation,
  contributor scoping, filters, empty and error states.

Run with `npx jest tests/settlementDashboardService.test.js tests/paymentDashboard.test.js`.

## Known limitations

- The MYZ ledger balance is an **accounting figure**, not a blockchain balance.
  MYZ remains an internal reward/accounting unit.
- No BTC receipt, Stripe settlement, conversion record or escrow record exists
  in this repository yet, so four of the six layers render as unconfigured.
- External settlement remains dry-run until `MYZ_XMR_LIVE=true` and a Monero
  wallet RPC are configured (see `myz/XMR-SETTLEMENT.md`).
