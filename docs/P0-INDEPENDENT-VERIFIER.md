# P0 independent payment verifier

This branch adds an optional, fail-closed HTTP verifier client for controlled integration testing.

## Runtime configuration

- `PAYMENT_VERIFIER_URL` — required to enable the verifier client.
- `PAYMENT_VERIFIER_BEARER_TOKEN` — optional runtime secret; never commit it.
- `PAYMENT_VERIFIER_TIMEOUT_MS` — optional positive timeout in milliseconds; default `10000`.

When `PAYMENT_VERIFIER_URL` is absent, no verifier is created and the existing payment lifecycle continues to fail closed before gateway submission.

## Verification contract

The verifier receives the exact submitted transaction evidence (`txId`, recipient, asset, network, amount, issue/pr references) and must return explicit confirmation plus field-level checks. The payment lifecycle still compares the response against the expected payment request; `valid: true` alone is not enough.

Network failures, malformed responses, wrong transaction IDs, wrong recipient/asset/network/amount, non-confirmed transaction status, or false checks must not produce `CONFIRMED`.

## Scope

This does not enable a production payment rail and does not bundle a wallet/RPC provider. A real MYZ/XMR/token verifier still needs to be configured in a non-production environment and validated against canonical provider/chain evidence before P0 can be considered complete.
