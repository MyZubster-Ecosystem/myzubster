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
  "network": "tari-esmeralda",
  "amount": 25
}
```

The verifier now reads the **real Tari Ootle Indexer transaction-result endpoint** using the txid only:

`GET ${MYZ_TARI_INDEXER_URL}/transactions/{txid}/result`

The upstream endpoint is the Indexer API documented by Tari Ootle. The result contains a pending/finalized/rejected transaction result; a finalized result must have `final_decision: "Commit"` and a matching `finalize.transaction_hash`. citeturn71file0turn75file0

For payment verification, the receipt must also contain the configured MYZ transfer event. Configure both:

- `MYZ_TARI_RESOURCE_ADDRESS` — the authoritative MYZ resource address.
- `MYZ_TARI_EVENT_TOPIC` — the exact event topic emitted by the MYZ transfer template.
- `MYZ_TARI_NETWORK` — the network name accepted by the payment API.

The verifier extracts the recipient and amount from that committed event and compares them with the payment request. Any missing event, resource mismatch, recipient mismatch, amount mismatch, network mismatch, rejected transaction or non-finalized transaction fails closed.

Successful response:

```json
{
  "verified": true,
  "txid": "...",
  "recipient": "...",
  "asset": "MYZ",
  "network": "tari-esmeralda",
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

This service is now wired to the actual Ootle Indexer API shape, but **the MYZ resource address and transfer event topic must still be supplied from the deployed MYZ Tari/Ootle contract configuration**. Do not guess these values and do not enable production payment confirmation until they are verified against a real MYZ transfer on the target network.

The Indexer transaction-result endpoint is read-only; this service does not sign or submit transactions. In production `MYZ_TARI_INDEXER_URL` must use HTTPS. Tari's current Ootle documentation describes the Indexer as the source used by wallets to read transactions and other on-chain state. citeturn1search3turn1search0

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
