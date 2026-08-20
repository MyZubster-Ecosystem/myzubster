# MYZ Independent Verifier

This service is a **separate read-only trust boundary** for MYZ/Tari payment confirmation. It is intended to be deployed separately from the payment API and must never decide payment validity from the payment API's own transaction response.

## Canonical contract

`POST /verify`

Request:

```json
{
  "txId": "...",
  "recipient": "...",
  "asset": "MYZ",
  "network": "tari-esmeralda",
  "amount": 25
}
```

The verifier reads the Tari Ootle Indexer transaction-result endpoint using only `txId`:

`GET ${MYZ_TARI_INDEXER_URL}/transactions/{txId}/result`

The upstream result must be finalized with `final_decision: "Commit"` and a matching `finalize.transaction_hash`.

For payment verification, the receipt must also contain the configured MYZ transfer event. Configure:

- `MYZ_TARI_RESOURCE_ADDRESS` — authoritative MYZ resource address.
- `MYZ_TARI_EVENT_TOPIC` — exact event topic emitted by the MYZ transfer template.
- `MYZ_TARI_NETWORK` — exact network identifier accepted by the payment API and client.

The verifier extracts recipient and amount from the committed event and compares them with the request. Missing events, mismatched transaction facts, rejected transactions, or non-finalized transactions fail closed.

Successful response:

```json
{
  "verified": true,
  "txId": "...",
  "recipient": "...",
  "asset": "MYZ",
  "network": "tari-esmeralda",
  "amount": 25,
  "transactionStatus": "confirmed",
  "checks": {
    "txId": true,
    "recipient": true,
    "asset": true,
    "network": true,
    "amount": true,
    "transactionStatus": true
  }
}
```

## Important deployment requirement

The MYZ resource address and transfer event topic must be supplied from the deployed MYZ Tari/Ootle contract configuration. Do not guess these values and do not enable production payment confirmation until they are verified against a real MYZ transfer on the target network.

The Indexer transaction-result endpoint is read-only; this service does not sign or submit transactions. In production `MYZ_TARI_INDEXER_URL` must use HTTPS.

## Run

```bash
MYZ_TARI_INDEXER_URL=https://<ootle-indexer> \
MYZ_TARI_NETWORK=tari-esmeralda \
MYZ_TARI_RESOURCE_ADDRESS=<verified-myz-resource-address> \
MYZ_TARI_EVENT_TOPIC=<verified-myz-transfer-topic> \
  node src/index.js
```

Health: `GET /healthz`

Verification: `POST /verify`

Tests:

```bash
npm test
```
