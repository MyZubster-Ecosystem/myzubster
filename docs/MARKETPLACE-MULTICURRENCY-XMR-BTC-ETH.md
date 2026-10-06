# Marketplace multi-currency payments: XMR, BTC and ETH

Status: **implementation specification / not yet production settlement**

## Goal

MyZubster Marketplace should allow a Seller to choose which supported crypto-assets they accept:

- XMR (Monero)
- BTC (Bitcoin)
- ETH (Ethereum)

A Seller can also choose a preferred settlement asset. The first preferred settlement target is XMR.

The checkout must clearly distinguish:

1. **direct payment** — buyer pays an asset accepted directly by the Seller;
2. **conversion quote** — buyer pays BTC or ETH while Seller prefers XMR;
3. **settlement** — funds are considered paid only after independent network verification.

No UI state alone may mark an order as paid.

## Seller payment preferences

Suggested model:

```json
{
  "acceptedAssets": ["XMR", "BTC", "ETH"],
  "preferredSettlementAsset": "XMR",
  "autoConversionEnabled": false
}
```

Rules:

- `acceptedAssets` must contain only assets enabled by the server.
- `preferredSettlementAsset` must be one of the supported assets.
- `autoConversionEnabled` defaults to `false`.
- Enabling a UI option must not activate custody, swapping or mainnet transfers unless an approved conversion provider/backend exists.

## Checkout flow

```text
LISTING
   ↓
SELLER ACCEPTED ASSETS
   ↓
BUYER CHOOSES XMR / BTC / ETH
   ↓
SERVER CREATES ORDER
   ↓
DIRECT PAYMENT OR CONVERSION QUOTE
   ↓
NETWORK PAYMENT
   ↓
INDEPENDENT VERIFICATION
   ↓
SETTLEMENT
   ↓
MARKETPLACE COMMISSION
   ↓
ORDER PAID
```

### Direct settlement

If the Seller accepts the Buyer's chosen asset and wants settlement in that same asset, no conversion is required.

Example:

```text
Buyer pays BTC → verified BTC payment → Seller BTC settlement
```

### Conversion to XMR

If the Buyer chooses BTC or ETH and the Seller requests XMR, MyZubster may present a conversion quote when an approved conversion backend is available.

```text
Buyer BTC/ETH
    ↓
Conversion quote
    ↓
Displayed exchange rate
    ↓
Displayed network/provider costs
    ↓
Displayed MyZubster conversion fee
    ↓
Buyer confirmation
    ↓
Verified input payment
    ↓
Conversion provider/backend
    ↓
Verified XMR settlement
    ↓
Seller receives XMR
```

Until that backend is approved and integrated, this flow must remain `UNAVAILABLE` or `QUOTE_ONLY`; it must never simulate a completed conversion.

## Fees

The existing Marketplace design targets a **2% platform commission** on eligible paid Marketplace transactions.

Conversion is a separate service and therefore must have a separate, transparent fee field.

Suggested quote structure:

```json
{
  "inputAsset": "BTC",
  "outputAsset": "XMR",
  "inputAmount": "...",
  "estimatedOutputAmount": "...",
  "marketplaceFeePercent": "2.00",
  "conversionFeePercent": "...",
  "networkFee": "...",
  "providerFee": "...",
  "rate": "...",
  "rateExpiresAt": "..."
}
```

The server, not the browser, must calculate authoritative fees and order totals.

The user must see the total cost and expected settlement amount before confirming.

## Order/payment state machine

Recommended states:

```text
CREATED
PAYMENT_METHOD_SELECTED
QUOTE_CREATED
AWAITING_PAYMENT
PAYMENT_DETECTED
PAYMENT_CONFIRMING
INPUT_CONFIRMED
CONVERSION_PENDING
CONVERSION_COMPLETED
SETTLEMENT_CONFIRMING
PAID
FAILED
EXPIRED
REFUND_REVIEW
```

For direct payments, conversion states are skipped.

`PAID` requires verified settlement evidence. A transaction hash supplied by the browser is not sufficient.

## Payment evidence

Each payment should retain privacy-safe evidence such as:

- order ID;
- input asset and network;
- expected amount;
- verified transaction identifier where appropriate;
- confirmation state;
- settlement asset;
- conversion quote ID when applicable;
- fee breakdown;
- timestamps;
- verifier result.

Sensitive wallet secrets, seed phrases and private keys must never be stored in Marketplace records or exposed to the frontend.

## Network safety

Development and production must be explicitly separated.

Recommended initial development networks:

- XMR: stagenet
- BTC: testnet/signet
- ETH: Sepolia

Mainnet activation for each asset requires an explicit configuration gate and separate security/reconciliation review.

## API shape

Suggested endpoints:

```text
GET  /api/marketplace/payment/assets
GET  /api/marketplace/seller/payment-preferences
PUT  /api/marketplace/seller/payment-preferences
POST /api/marketplace/orders/:id/payment-method
POST /api/marketplace/orders/:id/conversion-quote
GET  /api/marketplace/orders/:id/payment-status
```

The conversion endpoint should return `503 CONVERSION_NOT_AVAILABLE` until a real approved conversion backend is configured.

## Security requirements

- Never accept price, fee or final paid state from the client as authoritative.
- Validate asset, network, recipient, amount and confirmations server-side.
- Use idempotency for payment/order mutations.
- Protect against replay and duplicate transaction use.
- Keep signing/custody secrets outside the application database and source repository.
- Maintain an auditable reconciliation trail.
- Fail closed when verification is unavailable.

## Compliance boundary

Supporting direct wallet-to-wallet payment is architecturally different from MyZubster receiving, controlling, exchanging or forwarding crypto-assets for users.

Before enabling automatic BTC/ETH → XMR conversion with real funds, the project must complete the applicable legal/compliance assessment, including custody, AML/KYC and crypto-asset service requirements for the jurisdictions in which the service operates.

This document does **not** represent that such approval has already been obtained.

## Implementation phases

### Phase 1 — multi-asset Marketplace UI/API

- add XMR/BTC/ETH to supported asset enum;
- add Seller `acceptedAssets`;
- add Seller `preferredSettlementAsset`;
- add payment-method selector to checkout;
- preserve XMR as default;
- add server-side validation;
- add test-network configuration.

### Phase 2 — independent chain verification

- XMR stagenet verifier;
- BTC testnet/signet verifier;
- ETH Sepolia verifier;
- normalized payment evidence;
- confirmation policy per chain.

### Phase 3 — conversion quote

- introduce provider abstraction;
- BTC → XMR and ETH → XMR quote support;
- explicit rate expiry;
- transparent conversion fee;
- quote remains non-custodial/disabled unless backend permits execution.

### Phase 4 — production conversion

Only after security, custody, reconciliation and legal/compliance gates are satisfied:

- enable approved production provider;
- activate mainnet per asset independently;
- enable conversion execution;
- monitor settlement failures and reconciliation;
- expose complete fee breakdown and receipts.

## Acceptance criteria for Phase 1

A Phase 1 implementation is complete when:

1. Seller can save any valid subset of XMR/BTC/ETH as accepted assets.
2. Seller can select a preferred settlement asset.
3. Buyer sees only payment methods allowed for the order.
4. XMR remains the safe default for existing Sellers.
5. Unsupported assets are rejected server-side.
6. Conversion cannot be marked completed without a configured backend and verified settlement.
7. Existing 2% Marketplace commission logic remains separate from any future conversion fee.
8. Tests cover invalid assets, empty preferences, duplicate assets and conversion-disabled behavior.
