# Independent payment verifier — integration contract

## Goal

Provide a fail-closed, independently configured verifier boundary for MyZubster payment confirmation without bundling a wallet/RPC implementation or enabling production settlement by default.

## Configuration

The application may create an independent verifier only when `PAYMENT_VERIFIER_URL` is configured.

Optional environment values:

- `PAYMENT_VERIFIER_BEARER_TOKEN` — secret bearer token supplied only at runtime; never commit it.
- `PAYMENT_VERIFIER_TIMEOUT_MS` — request timeout, default `10000` ms.

If `PAYMENT_VERIFIER_URL` is absent, the verifier remains unconfigured and the existing payment lifecycle must continue to fail closed before gateway submission.

## Request contract

The verifier receives a POST request with the transaction evidence that must be checked independently:

```json
{
  "txId": "provider-transaction-id",
  "recipient": "expected-recipient",
  "asset": "MYZ",
  "network": "Tari",
  "amount": 25,
  "issueNumber": 289,
  "prNumber": 300
}
```

## Response contract

A valid confirmation response must bind the verification to the exact request fields and include explicit field checks:

```json
{
  "valid": true,
  "txId": "provider-transaction-id",
  "recipient": "expected-recipient",
  "asset": "MYZ",
  "network": "Tari",
  "amount": 25,
  "transactionStatus": "confirmed",
  "checks": {
    "recipient": true,
    "asset": true,
    "network": true,
    "amount": true,
    "transactionStatus": true
  },
  "provider": "integration-verifier"
}
```

The existing payment lifecycle independently compares these fields against the payment request. `valid: true` alone is insufficient.

## Failure behavior

Network failures, malformed responses and negative provider results are converted into a negative verification result. They must never be interpreted as confirmation.

## Scope boundary

This contract is integration infrastructure only. It does not establish that a specific MYZ, XMR or token rail is production-ready. Each real rail still requires a provider capable of independently checking canonical chain/provider evidence for the exact recipient, asset/network, amount and transaction state.
