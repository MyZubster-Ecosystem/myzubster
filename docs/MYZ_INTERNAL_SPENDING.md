# MYZ internal spending

Status: development / internal accounting only.

MYZ is an internal MyZubster reward/accounting credit. It is not represented by this implementation as fiat, cryptocurrency, an exchange product, a redeemable cash balance, or a claim on EUR/BTC/XMR.

## Canonical source of truth

All MYZ balances and spending flows use `src/services/myzLedgerApiService.js`. Legacy Dashboard `balanceMYZ` values are not used for user MYZ balance checks, P2P transfers, or MYZ checkout.

A transfer writes two `RECORDED` entries in one locked, atomic ledger replacement:

```text
payer  -MYZ  ─┐
              ├─ same transfer_id
payee  +MYZ  ─┘
```

The debit is checked before either leg is persisted. A transfer that would make the payer negative is rejected. The idempotency key and semantic reference are bound to the original transfer, so a retry can return the same entries but cannot silently change plan, order, amount, payer, or payee.

## Marketplace

A Seller may publish a listing whose currency is directly `MYZ`. No EUR-to-MYZ or crypto-to-MYZ conversion occurs.

For an accepted MYZ order:

```text
buyer marketplace:user:<buyer>
  -> canonical MYZ transfer
seller marketplace:user:<seller>
  -> order.payment.asset = MYZ
  -> order.payment.network = internal-ledger
  -> order.payment.status = PAID
  -> transferId + debitEntryId + creditEntryId retained on the order
```

The buyer cannot pay the seller's own order, only the authenticated buyer can initiate payment, and a MYZ order cannot be marked `COMPLETED` before `payment.status=PAID`.

## Zorgax

Zorgax MYZ prices are configuration values, not exchange-rate calculations:

```text
ZORGAX_PRO_PRICE_MYZ=<positive MYZ decimal>
ZORGAX_DEVELOPER_PRICE_MYZ=<positive MYZ decimal>
ZORGAX_MYZ_ACCOUNT_ID=zorgax:system:treasury
```

If a MYZ price is missing or invalid, that MYZ checkout option is unavailable. Existing card/BTC rails remain separate.

A successful purchase transfers MYZ from `marketplace:user:<user>` to the configured Zorgax internal account, then grants the existing idempotent Zorgax entitlement. Retrying after a partial application failure reuses the canonical transfer rather than charging the user again.

## Account namespaces

The canonical service authorizes the user, Zorgax internal, and historical contributor account namespaces used by current MYZ flows:

```text
MYZ_LEDGER_ALLOWED_ACCOUNT_PREFIXES=marketplace:user:,zorgax:system:,contributor:
```

A custom `ZORGAX_MYZ_ACCOUNT_ID` must belong to one of the explicitly authorized prefixes.

## Legacy Payment Dashboard

The historical Payment Dashboard used to add MongoDB `myzCredit` rows derived from a default EUR→MYZ rate and subtract MongoDB utility redemptions from the displayed MYZ balance. That shadow balance is no longer spendable or authoritative.

New Stripe verification stores only the external payment record. It does not create MYZ, `MYZ_PER_EUR` is not used as a live pricing policy, and utility purchases now write the debit to the canonical ledger first. MongoDB redemption rows remain only as fulfillment/receipt metadata and keep the canonical `ledgerEntryId`.

Historical conversion/credit rows are exposed as legacy audit data but excluded from the spendable balance. They are not silently migrated because mapping them into canonical MYZ would require an explicit policy decision.

## User-facing balance/history

Authenticated browser clients use:

```text
GET /api/myz/balance
GET /api/myz/history
```

The account is derived from the authenticated user; callers cannot choose another user's account ID. Service-to-service callers continue to use the bearer-protected `/api/v1/myz` canonical ledger API.

## Tests

`tests/myzInternalPayments.test.js` covers:

- buyer -> seller paired transfer and idempotent replay;
- two competing 250 MYZ purchases against a 300 MYZ balance (only one may succeed);
- user -> Zorgax internal-account transfer followed by entitlement grant;
- rejection when the same idempotency key is reused for a different Zorgax plan.
