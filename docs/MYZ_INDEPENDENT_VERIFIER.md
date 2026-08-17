# MYZ independent payment verifier

The bounty payment lifecycle must remain fail-closed: the gateway must never mark a MYZ bounty `PAID` from its own submission response alone.

## Required trust boundary

`processPayment()` submits the payment through the gateway adapter and then calls an independent verifier. The verifier must obtain transaction state from a read-only Tari/Ootle source of truth and return a structured result containing at least:

- `valid: true`
- exact `txId`
- exact `recipient`
- exact `asset: MYZ`
- exact `network`
- exact `amount`
- `transactionStatus: confirmed`
- all individual checks set to `true`

A missing verifier, timeout, malformed response, mismatched transaction facts, or unconfirmed transaction must keep the bounty out of `PAID`.

## Configuration

Set `MYZ_VERIFIER_URL` to the dedicated verifier endpoint and optionally `MYZ_VERIFIER_TIMEOUT_MS` (default `5000`). Do not point this at the same mutable process that submits the payment.

The verifier service should use a read-only Tari/Ootle wallet/indexer interface. Tari's current Ootle wallet daemon exposes an RPC service and connects to an indexer that provides on-chain transaction and balance state. The service should be isolated from the payment submission credentials and should not expose transfer/signing methods to MyZubster.

## Production rule

Do not use a mock, local-only response, client-supplied `valid` flag, or the payment adapter response as proof of settlement. The independent verifier must be able to reject a forged or replayed payment independently of the gateway process.
