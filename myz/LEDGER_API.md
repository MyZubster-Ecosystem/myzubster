# MYZ Canonical Ledger Service API

Status: **development / fail-closed**

This API exposes a narrow service-to-service boundary around the canonical MYZ internal reward/accounting ledger. It does **not** make MYZ an on-chain token, fiat-equivalent asset, exchange product or externally settled asset.

## Authentication

All endpoints require a bearer service token:

```text
Authorization: Bearer <MYZ_LEDGER_SERVICE_TOKEN>
```

If `MYZ_LEDGER_SERVICE_TOKEN` is missing, the API returns `503` rather than running unauthenticated.

Authorized account namespaces are controlled by:

```text
MYZ_LEDGER_ALLOWED_ACCOUNT_PREFIXES=marketplace:user:
```

Multiple prefixes may be comma-separated. The default permits only `marketplace:user:` accounts.

## Storage

The canonical document remains `myz/ledger.json` by default. A deployment may override its path with:

```text
MYZ_LEDGER_PATH=/durable/path/ledger.json
```

Production deployment must use durable storage. An ephemeral application filesystem is not sufficient for canonical accounting.

Writes use a process-visible lock file plus atomic rename. A busy ledger fails with `MYZ_LEDGER_BUSY`; callers must retry with the **same idempotency key**.

## Balance

```text
GET /api/v1/myz/accounts/:accountId/balance
```

Response:

```json
{
  "schema": "myzubster-myz-ledger-balance/v1",
  "asset": "MYZ",
  "accountId": "marketplace:user:alice",
  "balanceMyz": "100.5",
  "revision": "<sha256>"
}
```

Balance follows the canonical rule: sum `RECORDED` entries for the account, exclude `REVERSAL` entries themselves, and exclude entries neutralized by a recorded reversal.

MYZ arithmetic uses fixed 18-decimal integer units internally; no JavaScript floating-point arithmetic is used for canonical balance or debit checks.

## Append redemption debit

```text
POST /api/v1/myz/entries
```

This endpoint currently accepts only the Marketplace redemption use-case: an append-only negative `ADJUSTMENT_DEBIT` represented by a decimal string.

Example:

```json
{
  "account_id": "marketplace:user:alice",
  "amount_myz": "-25.5",
  "idempotency_key": "myz-redemption-RED-123",
  "reference": {
    "redemption_id": "RED-123",
    "provider_transaction_id": "external-provider-reference"
  },
  "evidence": ["sha256:settlement-evidence-hash"],
  "note": "Marketplace redemption debit after reconciliation"
}
```

A successful new append returns `201`; an exact idempotent replay returns `200` with the original entry. Reusing an idempotency key for a different account or amount returns `409 MYZ_LEDGER_IDEMPOTENCY_CONFLICT`.

The API refuses debits that would make the canonical balance negative.

## Fail-closed rules

- no bearer service token configuration -> no service access;
- unauthorized account namespace -> no balance read or debit;
- malformed decimal -> no write;
- insufficient canonical balance -> no write;
- concurrent writer lock -> retryable failure, no guessed outcome;
- persistence not re-readable as `RECORDED` -> no success response;
- entry IDs are generated only during a real append attempt and are never used as evidence of external settlement;
- external settlement evidence remains a reference input; this API does not verify a blockchain/payment rail itself.

## Marketplace integration

This API is the canonical accounting side of the Marketplace redemption bridge tracked in `MyZubster-Marketplace` PR #62 and core issue #1095.

Expected sequence:

```text
canonical balance read
-> Marketplace local reservation
-> external settlement
-> provider reconciliation
-> canonical ADJUSTMENT_DEBIT append
-> re-read/verify RECORDED entry
-> Marketplace marks redemption reconciled
```

Configuration is technical enablement only and does not imply legal authorization, CASP status, listing, provider support or regulatory approval.
