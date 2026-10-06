# MyZubster Wallet + Blockchain Marketplace Roadmap

Status: **public technical roadmap**  
Last updated: 2026-09-16

## Goal

Connect a user's wallet to their MyZubster Marketplace identity so a buyer can cryptographically sign a listing request without requiring an on-chain transaction or gas fee for every request.

Blockchain should be used where permanent evidence adds value, not as mandatory friction for ordinary Marketplace interaction.

Core rule:

> **Connected wallet != verified identity != payment account != paid transaction != on-chain evidence**

## Existing foundation

The current MyZubster codebase already contains Marketplace orders, evidence generation, ethers-based Base integration, Base Sepolia configuration and a server-side Marketplace evidence anchoring service.

The current order lifecycle includes:

```text
REQUESTED -> ACCEPTED / REJECTED -> COMPLETED / CANCELLED
```

Completed Marketplace orders can generate structured evidence and an evidence hash. When the configured blockchain anchor provider is Base Sepolia, MyZubster can submit that evidence hash through the dedicated server-side anchoring wallet.

The dedicated server anchoring wallet must remain separate from user wallets.

## Target architecture

```text
MyZubster account
      |
      v
Connect wallet
      |
      v
Request one-time challenge / nonce
      |
      v
User signs challenge
      |
      v
Server verifies signature
      |
      v
Wallet linked to authenticated MyZubster account
      |
      v
Marketplace listing
      |
      v
Create request
      |
      v
User signs request payload
      |
      v
Server verifies signature + nonce + expiry
      |
      v
MarketplaceOrder: REQUESTED
      |
      v
Seller ACCEPTED
      |
      +--------------------------+
      |                          |
      v                          v
Off-platform/free flow     Future payment flow
      |                          |
      +------------+-------------+
                   |
                   v
               COMPLETED
                   |
                   v
           Structured evidence
                   |
                   v
              SHA-256 hash
                   |
                   v
       Optional blockchain anchor
                   |
                   v
        Base / transaction evidence
```

## Phase 1 — Wallet connection

Add a clear **Connect wallet** action to the Marketplace experience, reusing the existing wallet UI/components where practical rather than creating an unrelated second wallet system.

For EVM wallets, the frontend should obtain the public wallet address through the user's wallet provider.

MyZubster must never request or store a user's private key or seed phrase.

Target wallet states:

```text
WALLET_NOT_CONNECTED
WALLET_CONNECTED
WALLET_CHALLENGE_PENDING
WALLET_VERIFIED
WALLET_DISCONNECTED
```

`WALLET_CONNECTED` means the browser has exposed an address. It does not prove that the authenticated MyZubster account controls that address until a challenge has been signed and verified.

## Phase 2 — Challenge / signature verification

Implement a server-generated one-time challenge.

Suggested API shape:

```text
POST /api/wallet/challenge
POST /api/wallet/verify
GET  /api/wallet/me
DELETE /api/wallet/disconnect
```

A challenge should contain or bind to:

- authenticated MyZubster account;
- requested wallet address;
- random cryptographic nonce;
- domain/application identifier;
- issue timestamp;
- expiry timestamp;
- intended action such as `LINK_WALLET`.

The nonce must be single-use and short-lived.

The frontend asks the wallet to sign the challenge. The backend recovers/verifies the signer and only records the wallet relationship if the recovered address matches the requested address and all challenge checks pass.

Recommended state:

```text
accountId
walletAddress
walletType: EVM
verifiedAt
lastVerifiedAt
status
```

Do not store private keys.

## Phase 3 — Signed Marketplace request

After wallet verification, allow the buyer to sign the intent to create a Marketplace request.

The request signature should be **off-chain** for the initial implementation. Creating a normal request should not require a Base transaction or gas.

Canonical signed payload should bind at minimum:

```text
schema
intent: MARKETPLACE_REQUEST
listingId
quantity
buyerAccountReference
walletAddress
nonce
issuedAt
expiresAt
```

Where relevant, a stable snapshot/hash of economically important listing fields can also be included so the signature clearly refers to the terms displayed to the buyer.

The server must construct or independently validate the canonical payload. It must not blindly trust arbitrary client-provided signed fields.

Suggested request flow:

```text
POST /api/marketplace/orders/challenge
        ↓
server returns canonical request payload + nonce
        ↓
wallet signs payload
        ↓
POST /api/marketplace/orders
        ↓
server verifies signature
        ↓
MarketplaceOrder created as REQUESTED
```

## Phase 4 — MarketplaceOrder wallet evidence

Extend MarketplaceOrder with wallet-signature evidence without treating it as payment evidence.

Suggested structure:

```text
walletEvidence: {
  status: 'NOT_REQUIRED' | 'SIGNED' | 'VERIFIED' | 'FAILED',
  walletAddress,
  networkFamily: 'EVM',
  signature,
  payloadHash,
  nonceReference,
  signedAt,
  verifiedAt
}
```

Raw signatures should be handled as security-relevant evidence and should not automatically be exposed through public Marketplace APIs.

Important distinction:

```text
REQUEST_SIGNED != REQUEST_ACCEPTED
REQUEST_ACCEPTED != PAYMENT_AUTHORIZED
PAYMENT_AUTHORIZED != PAID
PAID != SETTLED
```

## Phase 5 — Seller acceptance

The existing Marketplace state transition remains authoritative:

```text
REQUESTED -> ACCEPTED
```

Wallet verification proves control of the signing wallet at signing time. It does not prove that the Seller accepted the request, that stock exists outside MyZubster, that a payment occurred or that the exchange completed.

Acceptance remains a separate Marketplace event.

## Phase 6 — Payments

Payment capability should remain separate from basic wallet linking.

A user may therefore be:

```text
membership: SELLER_FREE
wallet: WALLET_VERIFIED
payment: PAYMENT_NOT_CONFIGURED
```

Wallet connection must not silently activate Stripe, a subscription, a token transfer or any other payment rail.

When MyZubster later introduces real platform-managed payments, payment intent and payment evidence should have their own state model and explicit user confirmation.

Possible future rails may include regulated payment providers and explicitly supported blockchain assets, but this roadmap does not declare any asset or payment rail production-ready merely because wallet connection exists.

## Phase 7 — Blockchain evidence

Do not write every listing request to Base by default.

For the first implementation:

```text
Create request -> signed off-chain
Accept request -> Marketplace state
Complete exchange -> evidence generated
Evidence hash -> optional blockchain anchor
```

This reduces cost and friction while preserving the ability to create permanent evidence for meaningful lifecycle events.

The existing Base Marketplace anchoring service uses a dedicated server-side wallet and must stay isolated from the user's connected wallet.

Never expose a server anchoring private key to frontend code.

## Phase 8 — Optional future user-signed on-chain actions

After the off-chain signature flow is stable, MyZubster may evaluate optional user-signed blockchain actions for cases where an on-chain state transition has a concrete purpose.

Examples to evaluate separately:

- escrow funding;
- token/NFT transfer;
- ownership/passport transfer;
- payment settlement evidence;
- high-value agreement anchoring.

Every on-chain action should clearly show network, asset, destination, amount, estimated cost and intended action before the wallet requests confirmation.

A wallet signature must never be presented as a payment if it only signs a message.

## Security requirements

Before production use:

- use cryptographically random nonces;
- make challenges single-use;
- expire challenges quickly;
- bind signatures to MyZubster domain/application context;
- bind request signatures to the authenticated session/account;
- verify recovered signer server-side;
- normalize EVM addresses consistently;
- protect challenge endpoints with rate limiting;
- prevent replay across listings, users, environments and actions;
- never accept a client assertion such as `walletVerified: true` without server verification;
- never request private keys or seed phrases;
- never log wallet secrets;
- keep server-side anchor keys outside source code and frontend bundles;
- record security/audit events for link, unlink and signature verification;
- define wallet-change and compromised-wallet recovery behavior.

For EVM production interoperability, evaluate a standard Sign-In with Ethereum style message/challenge rather than inventing an unnecessarily incompatible authentication format.

## Privacy requirements

A public blockchain address is pseudonymous but can become linkable to activity.

The product should explain when a wallet address will become public, when it remains account metadata and when a transaction will be visible on a public blockchain explorer.

Do not publish the relationship between a MyZubster identity and wallet address more broadly than the product requires without clear user-facing disclosure.

## Zorgax integration

Zorgax can help explain wallet and request states without becoming the source of truth.

Examples:

```text
User: Is my wallet connected?
Zorgax: The wallet is connected and the ownership challenge is verified.
```

```text
User: Did I pay for this request?
Zorgax: The Marketplace request is signed, but there is no confirmed payment evidence.
```

Zorgax must preserve evidence distinctions:

```text
CONNECTED != VERIFIED
SIGNED != PAID
REQUESTED != ACCEPTED
CONFIRMED_ON_CHAIN != PHYSICAL_EVENT_VERIFIED
```

## Implementation order

### NOW

1. Audit/reuse existing WalletHub UI.
2. Add persistent wallet-link model for MyZubster accounts.
3. Implement challenge creation and verification APIs.
4. Add Connect / Verify / Disconnect wallet UX.
5. Add automated replay, expiry and wrong-signer tests.

### NEXT

1. Add Marketplace request challenge endpoint.
2. Define canonical `MARKETPLACE_REQUEST` signed payload.
3. Add `walletEvidence` to MarketplaceOrder.
4. Verify request signature before creating wallet-signed orders.
5. Display `Wallet verified` and `Request signed` as distinct states.
6. Add Zorgax explanations for those states.
7. Test desktop and mobile wallet flows.

### AFTER THAT

1. Connect completed Marketplace orders to the existing evidence pipeline.
2. Verify Base Sepolia anchoring end-to-end in the deployed environment.
3. Add explorer references only after confirmed transactions.
4. Design payment intent separately from request signing.
5. Add sandbox payment flow.
6. Evaluate optional user-signed on-chain Marketplace actions only where they add real value.

## MVP acceptance criteria

The first wallet Marketplace milestone is complete when:

```text
Authenticated user
  -> connects EVM wallet
  -> signs one-time challenge
  -> server verifies wallet ownership
  -> opens a Marketplace listing
  -> requests canonical MARKETPLACE_REQUEST payload
  -> signs it without spending gas
  -> server verifies it
  -> MarketplaceOrder is created as REQUESTED
  -> Seller can accept/reject normally
  -> UI and Zorgax never describe the signature as a payment
```

No production payment is required to complete this milestone.

## Product principle

> **Use the wallet to prove intent. Use Marketplace state to represent agreement. Use payment evidence to prove payment. Use blockchain when permanent evidence adds value. Do not collapse those states into one.**

This document describes intended implementation direction. A roadmap item must not be represented as live or production-ready until its code, deployment, configuration and end-to-end behavior have been verified.