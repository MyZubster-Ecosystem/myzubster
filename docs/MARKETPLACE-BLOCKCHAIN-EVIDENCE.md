# Marketplace blockchain evidence — how it works

MyZubster is building the Marketplace so that a completed Marketplace event can produce **verifiable digital evidence** without publishing the user's private Marketplace data on a blockchain.

```text
MARKETPLACE LISTING / ORDER
          ↓
MARKETPLACE EVENT
          ↓
CANONICAL EVIDENCE RECORD
          ↓
SHA-256 HASH
          ↓
BLOCKCHAIN ANCHOR
          ↓
TXID + BLOCK + TIMESTAMP
          ↓
INDEPENDENT VERIFICATION
```

## What is recorded on-chain?

The blockchain anchor is designed to contain **only the cryptographic evidence hash**. The listing text, private user information, payment credentials and other Marketplace payload data stay off-chain.

If the underlying evidence is changed later, recalculating its SHA-256 hash produces a different value. Comparing the recalculated hash with the confirmed on-chain value therefore provides an integrity check for the evidence that was anchored.

## Current implementation status

| Layer | Status | Meaning |
|---|---|---|
| Marketplace canonical evidence + SHA-256 | **IMPLEMENTED on `main`** | Completed Marketplace evidence can be represented by a canonical payload and hash. |
| Base Sepolia anchoring adapter | **IN VALIDATION** | The EVM adapter is implemented on the current development track, but the first complete end-to-end confirmed Marketplace transaction is still a required validation gate. |
| Base mainnet | **NOT ENABLED** | Mainnet activation requires successful testnet validation, reliability controls, spend limits, monitoring and privacy review. |
| XMR / Monero | **SEPARATE PAYMENT / PRIVACY RAIL** | XMR settlement is a separate boundary and must not be confused with the Base evidence anchor. |

## Why anchor evidence instead of the whole listing?

This design keeps blockchain use small and privacy-aware. MyZubster can retain useful properties of a public blockchain proof — chronology, transaction identifier and independently inspectable evidence — while avoiding publication of unnecessary personal or commercial data.

```text
PRIVATE / APPLICATION DATA
Marketplace payload + user data
          │
          └── stays off-chain

PUBLIC VERIFICATION LAYER
SHA-256 evidence hash
          ↓
Base blockchain anchor
          ↓
TXID / receipt
```

A confirmed blockchain transaction proves that a particular hash was anchored on that network. **It does not by itself prove that an advertisement is truthful, that an identity is genuine, that a contract was fulfilled, that a payment occurred, or that legal/fiscal requirements were satisfied.** Those claims require their own evidence and verification.

See also [`VERCEL-TECHNICAL-ROADMAP.md`](VERCEL-TECHNICAL-ROADMAP.md).
