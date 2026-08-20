# MYZ independent payment verifier

The bounty payment lifecycle must remain fail-closed: the gateway must never mark a MYZ bounty `PAID` from its own submission response alone.

## Canonical contract

`processPayment()` submits the payment through the gateway adapter and then calls an independent verifier. The verifier must obtain transaction state from a read-only Tari/Ootle source of truth.

Request fields:

- `txId`
- `recipient`
- `asset: MYZ`
- exact configured `network`
- `amount`
- optional `issueNumber` and `prNumber`

A successful response contains at least:

- `verified: true`
- exact `txId`
- exact `recipient`
- exact `asset: MYZ`
- exact `network`
- exact `amount`
- `transactionStatus: confirmed`
- all individual checks, including `checks.txId`, set to `true`

A missing verifier, timeout, malformed response, mismatched transaction facts, or unconfirmed transaction must keep the bounty out of `PAID`.

## Configuration

Set `MYZ_VERIFIER_URL` to the dedicated verifier `/verify` endpoint and optionally `MYZ_VERIFIER_TIMEOUT_MS` (default `5000`). Do not point this at the same mutable process that submits the payment.

The payment flow must pass the same network identifier configured on the independent verifier (for example `tari-esmeralda`); the client does not hard-code a generic `Tari` network value.

The verifier service should use a read-only Tari/Ootle indexer interface. It must be isolated from payment submission credentials and must not expose transfer or signing methods to MyZubster.

## Production rule

Do not use a mock, local-only response, client-supplied verification flag, or the payment adapter response as proof of settlement. The independent verifier must be able to reject a forged or replayed payment independently of the gateway process.
