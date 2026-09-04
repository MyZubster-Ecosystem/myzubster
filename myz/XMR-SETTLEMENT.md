# XMR bounty settlement worker

`myz/xmr-settlement-worker.mjs` processes only bounty settlements that are already approved and already have a canonical MYZ ledger entry.

## Safe default

The worker is **dry-run by default**. It validates queued settlements but sends no XMR unless `MYZ_XMR_LIVE=true` is explicitly configured.

Live mode additionally requires `MONERO_WALLET_RPC_URL`. Optional RPC credentials are read from `MONERO_WALLET_RPC_USER` and `MONERO_WALLET_RPC_PASSWORD`; never commit wallet credentials, private keys or seed phrases.

## Required queue fields

A payable item must have `status: SETTLEMENT_PENDING`, `bounty_approved: true`, `myz_entry_id`, `xmr_address`, a positive integer `amount_atomic`, and approval `evidence`.

The worker derives an idempotency key from the MYZ entry, destination and amount, checks unlocked wallet balance before transfer, persists `XMR_PAYOUT_PENDING` before the RPC transfer, and records the returned `tx_hash` before reporting `XMR_PAID`.

## Funding

Stripe and BTC receipts are funding inputs to treasury/accounting. They do not approve a bounty and Stripe is not an XMR converter. Any BTC/fiat-to-XMR conversion must be handled by a separately configured and reviewed integration. This worker only handles XMR already available in the configured Monero wallet.

## Production activation checklist

Before setting `MYZ_XMR_LIVE=true`, verify the wallet RPC endpoint and authentication, backup/recovery procedures, payout limits, destination validation, retry/reconciliation policy, treasury balance, operational/compliance requirements, and a low-value controlled test transaction.
