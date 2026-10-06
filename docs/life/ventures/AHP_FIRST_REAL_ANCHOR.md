# AHP Traceability — First Real Base Sepolia Anchor

Date: 2026-09-09

MyZubster completed its first real end-to-end AHP traceability anchor.

## Recorded pilot event

- Venture: `MZ-VENTURE-AHP-001`
- Pilot: `MZ-AHP-PILOT-001`
- Event: `LOT_CREATED`
- Product lot: `MZ-AHP-LOT-20260909-001`
- Event sequence: `1`
- Event hash: `3a595b8fe886bc1c551831f1c42b93b6ad807f09254ed287cd18ab1eb7f53d0b`

The event was signed with an authorized Ed25519 key and persisted in MongoDB. No names, emails, addresses, medical data, health data, or household-level information were placed on-chain.

## Blockchain anchor

- Network: Base Sepolia
- Chain ID: `84532`
- Confirmation state: `CONFIRMED`
- Block: `46577137`
- Merkle root: `5e02cd7fdf95a484942d4cd88666b043b24b5018e73491c48cdd078eafed27d3`
- Transaction: [View on Base Sepolia](https://sepolia.basescan.org/tx/0x6dcf39faac6d1eabbaf0e6857ae329d41a1de74cf8320f8f9f048a2dca7ce649)

## Claim boundary

This anchor proves that the recorded event digest existed no later than the confirmed transaction. It does not independently prove the physical accuracy of measurements, recycling performance, safety, compliance, or certification.

The next pilot phase will add signed supply, collection, transport, treatment, recovery, and destination events, together with off-chain evidence and Merkle inclusion-proof verification.
