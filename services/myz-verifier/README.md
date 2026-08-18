# MYZ Independent Verifier

This service is a **separate read-only trust boundary** for MYZ/Tari payment confirmation. It is intended to be deployed separately from the payment API and must never decide payment validity from the payment API's own transaction response.

## Contract

`POST /verify`

Request:

```json
{
  "txid": "...",
  "recipient": "...",
  "asset": "MYZ",
  "network": "tari-mainnet",
  "amount": 25
}
```

The verifier sends **only the txid** to the configured upstream read-only Tari/Ootle verification endpoint:

`MYZ_TARI_VERIFIER_RPC_URL`

Expected upstream response:

```json
{
  "txid": "...",
  "recipient": "...",
  "asset": "MYZ",
  "network": "tari-mainnet",
  "amount": 25,
  "transactionStatus": "confirmed"
}
```

The service then independently compares the observed transaction with the expected recipient, asset, network and amount. Any mismatch fails closed.

Successful response:

```json
{
  "verified": true,
  "txid": "...",
  "recipient": "...",
  "asset": "MYZ",
  "network": "tari-mainnet",
  "amount": 25,
  "transactionStatus": "confirmed",
  "checks": {
    "txid": true,
    "recipient": true,
    "asset": true,
    "network": true,
    "amount": true,
    "transactionStatus": true
  }
}
```

## Important deployment requirement

This PR implements the **independent verification boundary and adapter contract**. It does not claim that a Tari/Ootle node is already available in this repository. `MYZ_TARI_VERIFIER_RPC_URL` must point to a separately operated, read-only verifier endpoint backed by the authoritative Tari/Ootle state before production payment confirmation is enabled.

In production the upstream URL must use HTTPS. No wallet signing or payment submission belongs in this service.

## Run

```bash
MYZ_TARI_VERIFIER_RPC_URL=https://verifier.example.internal/transaction \
  node src/index.js
```

Health: `GET /healthz`

Verification: `POST /verify`

Tests:

```bash
npm test
```
