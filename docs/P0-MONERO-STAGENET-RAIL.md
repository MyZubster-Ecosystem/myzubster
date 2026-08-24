# P0 Monero Stagenet Rail

_Status: selected non-production rail; code-level integration complete, live stagenet settlement still gated._

For the next P0 payment-rail exercise, MyZubster uses **Monero stagenet via `monero-wallet-rpc`** rather than a mainnet wallet or a third-party custodial provider.

## Why this rail

The Monero wallet RPC exposes the exact primitives needed for a crash-safe staged submission:

1. `transfer` with `do_not_relay: true` and `get_tx_metadata: true` creates a transaction without broadcasting it;
2. MyZubster persists the returned transaction hash and relay metadata under the durable payment idempotency key;
3. `relay_tx` broadcasts that exact prepared transaction;
4. recovery can look up the known transaction hash with `get_transfer_by_txid` and, if required, relay the same saved metadata rather than creating a new payment;
5. `get_tx_proof` produces evidence for the recipient;
6. an independent verifier process checks that proof with `check_tx_proof` and enforces recipient, amount and confirmation depth.

Official reference:
- https://docs.getmonero.org/interacting/monero-wallet-rpc-reference/
- https://docs.getmonero.org/rpc-library/wallet-rpc/

## Safety guards

The adapter deliberately refuses production use:

- asset must be `XMR`;
- network must be exactly `stagenet`;
- wallet RPC is loopback-only by default;
- relay is disabled unless explicitly enabled by the caller;
- no wallet passwords, seeds, spend keys, RPC credentials or database credentials are committed;
- prepared `tx_metadata` is treated as sensitive runtime state and is removed from the Mongo record after relay;
- the verifier is a separate HTTP process and can require a bearer token;
- confirmation remains fail-closed until the independent proof check succeeds.

## Crash boundaries

### Before durable preparation

If the process fails before the `do_not_relay` result is persisted, no transaction has been intentionally broadcast by this adapter. A later attempt may create a new unrelayed transaction, but it must still pass the same durable persistence boundary before relay.

### After durable preparation, before relay

The Mongo record contains the exact `txId` and `tx_metadata`. Recovery relays that exact transaction; it does not call `transfer` again.

### During relay

If `relay_tx` returns an ambiguous error, the adapter checks the known `txId`. If the wallet already sees it as outgoing/pending/pool, the durable record is marked relayed. Otherwise the record remains `PREPARED` so recovery can retry the same metadata.

### After relay, before proof persistence

The `txId` remains durable. Proof generation is retried on recovery. Treasury funds remain reserved until the independent verifier confirms the proof.

## Independent verification

`scripts/p0-monero-stagenet-verifier.js` exposes a loopback HTTP `/verify` endpoint compatible with the existing `PAYMENT_VERIFIER_URL` client. It reads the durable proof evidence and calls `check_tx_proof` through a separately configured verifier RPC.

The verifier requires:

- proof signature valid for the requested `txId` and recipient;
- `received` amount equal to the exact expected atomic amount;
- XMR / stagenet binding;
- transaction outside the pool;
- configured minimum confirmation depth.

## Remaining live P0 exercise

The repository still needs one explicitly controlled stagenet run using disposable test funds:

`reserve -> PREPARED -> relay -> process restart/recovery -> tx proof -> independent verify -> settle`

That live run must be executed only after a stagenet wallet, a separate verifier RPC and test-only MongoDB are configured outside Git. Mainnet must remain disabled.
