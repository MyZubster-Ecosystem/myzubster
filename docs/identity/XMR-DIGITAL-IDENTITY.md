# MyZubster XMR Digital Identity Artifact

This document defines the safe, verifiable workflow for anchoring a MyZubster digital identity artifact to Monero.

## What this is

`MYZ-XMR-ID-001` is a **Monero-anchored provenance artifact**. It is not an NFT, not a legal identity certificate, not a qualified electronic signature and not proof of partnership, funding or institutional endorsement.

The canonical machine-readable record is [`XMR-DIGITAL-IDENTITY.json`](XMR-DIGITAL-IDENTITY.json).

## Why Monero is handled differently

Monero does not provide native ERC-721/ERC-1155-style NFT semantics. For MyZubster, Monero is therefore used as an **external anchoring / settlement reference** while content integrity is established through hashes and optional IPFS CIDs.

## Current status

```text
PREPARED_NOT_ANCHORED
```

The record is intentionally configured for **stagenet first**. Do not mark it as anchored until an actual Monero transaction exists and can be independently verified.

## Evidence chain

```text
visual / identity proof
        ↓
SHA-256 hashes
        ↓
optional IPFS CIDs
        ↓
XMR-DIGITAL-IDENTITY.json
        ↓
Monero transaction
        ↓
independent verification
        ↓
ANCHORED / VERIFIED
```

## Safe anchoring procedure

1. Verify the image and identity-proof SHA-256 values against the local/source files.
2. Optionally publish the public artifact files to IPFS and record the returned CIDs.
3. Use a wallet you control on **Monero stagenet** for the first test.
4. Send a deliberately small test transaction using funds you control.
5. Record only the public verification fields that are appropriate to disclose:
   - network;
   - transaction ID;
   - block height when confirmed;
   - amount only if you intentionally want it public;
   - destination address only if you intentionally want it public;
   - public/limited transaction proof material where appropriate.
6. Never commit a seed, private spend key, private view key, wallet password or other secret material.
7. Independently verify the transaction using a wallet/node or an appropriate transaction-proof workflow.
8. Only after successful verification change:

```json
"status": "anchored_verified"
```

and:

```json
"verification_state": "VERIFIED"
```

## Verification states

- `NOT_ANCHORED` — no Monero transaction has been recorded.
- `ANCHOR_SUBMITTED` — a txid has been recorded but confirmation/verification is incomplete.
- `CONFIRMED_UNVERIFIED` — chain confirmation exists but the artifact-to-transaction relationship has not been independently verified.
- `VERIFIED` — the transaction and the declared artifact reference have passed the defined verification procedure.
- `REJECTED` — the evidence was invalid, inconsistent or could not be verified.

## Privacy model

Do not place a home address, personal phone number, personal email, wallet seed, private key or private view key into immutable/public artifact metadata. Keep changeable contact details in a separately controlled public profile/document.

The canonical JSON explicitly defaults these publication flags to `false`.

## Mainnet promotion

A stagenet test does not prove a mainnet anchor. If a mainnet anchor is later desired, create a new version or update the record with explicit evidence and preserve the stagenet history. Do not silently replace a testnet/stagenet record with a mainnet claim.

## Terminology

Preferred public label:

**MyZubster XMR Digital Identity Artifact #001**

Acceptable technical description:

**Monero-anchored MyZubster digital identity/provenance artifact**

Avoid:

- `Monero NFT`;
- `on-chain legal identity`;
- `digital signature certificate`;
- `verified partnership proof`;
- any wording that implies a payment or settlement before independent verification.
