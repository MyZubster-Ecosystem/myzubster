# MyZubster — Vercel Technical Roadmap

Updated: 2026-09-16

This roadmap tracks the production path for the MyZubster Marketplace evidence pipeline and its deployment on Vercel.

## Current production baseline

- MyZubster application is deployed through Vercel from `MyZubster-Ecosystem/myzubster`.
- Marketplace evidence pipeline is on `main` via PR #1205.
- Completed Marketplace evidence is represented by a canonical payload and SHA-256 hash.
- Blockchain evidence must only be described as immutable/on-chain after a real transaction is submitted and confirmed.
- The blockchain anchor stores only the evidence hash on-chain, not the Marketplace payload, payment credentials, or private user data.

## Phase 1 — Base Sepolia adapter

Status: IN PROGRESS — PR #1206

- [x] Select Base Sepolia as the first test network.
- [x] Add native EVM anchoring adapter.
- [x] Validate Base Sepolia chain ID `84532` before submitting.
- [x] Encode the 32-byte SHA-256 evidence hash as transaction calldata.
- [x] Use a zero-value transaction from a dedicated anchoring wallet.
- [x] Wait for blockchain receipt/confirmation.
- [x] Return TXID, block timestamp, block number and explorer URL.
- [x] Keep the wallet private key outside GitHub.
- [ ] Merge PR #1206 after deployment checks are green.

## Phase 2 — Vercel testnet configuration

Status: BLOCKED ON SECRET CONFIGURATION

Required production/test environment configuration:

- `MARKETPLACE_BLOCKCHAIN_ANCHOR_PROVIDER=base-sepolia`
- `MARKETPLACE_BASE_ANCHOR_PRIVATE_KEY=<dedicated test wallet secret>`
- optional `MARKETPLACE_BASE_RPC_URL=<trusted Base Sepolia RPC>`
- optional `MARKETPLACE_BASE_CONFIRMATIONS=1`
- optional `MARKETPLACE_BASE_EXPLORER_URL=https://sepolia.basescan.org`

The anchoring wallet must be dedicated to MyZubster evidence tests and contain only the small amount of test ETH needed for Base Sepolia gas. Never commit its private key.

## Phase 3 — First end-to-end Marketplace proof

Status: PENDING

1. Complete a real test Marketplace order through the same application path used by users.
2. Generate and persist the canonical evidence payload and SHA-256 hash.
3. Submit the hash to Base Sepolia.
4. Require a successful transaction receipt.
5. Persist `CONFIRMED`, TXID, network, block number, confirmed timestamp and explorer URL.
6. Recalculate the evidence hash and verify it still matches the anchored hash.
7. Inspect Vercel runtime logs for anchoring failures.

Success criterion: a completed test order has a real Base Sepolia TXID that can be independently inspected and whose calldata contains the expected evidence hash.

## Phase 4 — Completion-path reliability

Status: REQUIRED BEFORE CLAIMING END-TO-END AUTOMATION

- [ ] Verify the production `PATCH /api/marketplace/orders/:orderId/status` completion path triggers evidence generation.
- [ ] If completion uses `findOneAndUpdate`/`findByIdAndUpdate`, add query middleware or explicit completion handling so evidence creation cannot be skipped.
- [ ] Add regression tests for the actual completion route.
- [ ] Make anchoring retry-safe/idempotent to avoid duplicate blockchain transactions.

## Phase 5 — Verification API and UI

Status: PLANNED

- [ ] Add an authenticated endpoint exposing evidence state for order participants/admins.
- [ ] Add a privacy-safe public verification endpoint that accepts an evidence hash or proof identifier without exposing Marketplace PII.
- [ ] Add Marketplace UI showing `Not anchored`, `Submitted`, `Confirmed` or `Failed` accurately.
- [ ] Show TXID and explorer link only after a transaction exists.
- [ ] Add a Verify action that recomputes the hash and compares it with the stored proof.

## Phase 6 — Mainnet readiness

Status: NOT STARTED

Base mainnet must not be enabled until testnet proves the full flow.

Before mainnet:

- successful Base Sepolia end-to-end transaction;
- completion-path regression coverage;
- retry/idempotency protection;
- dedicated production wallet and secret management;
- gas/spend limits and monitoring;
- RPC failure handling;
- confirmation policy;
- user-facing verification UI;
- privacy and data-retention review.

Only after these checks should the network be switched from Base Sepolia to Base mainnet.

## Architecture boundary

MyZubster keeps responsibilities separate:

`Marketplace data in MyZubster -> canonical evidence -> SHA-256 -> Base anchor -> TXID/receipt -> verification`

XMR/Monero can remain a payment/privacy rail. Base is used for publicly verifiable evidence anchoring. A blockchain confirmation proves integrity and chronology of the anchored hash; it does not by itself prove that an advertisement is truthful, a contract was fulfilled, an identity is genuine, or a transaction satisfies legal/fiscal requirements.
