# Marketplace — immutable transaction evidence

MyZubster is designed so that a Marketplace listing can be connected to a verifiable digital evidence trail when an online transaction or other supported Marketplace event is recorded.

The goal is not to put the complete advertisement, personal information or payment credentials on a blockchain. Instead, the relevant Marketplace record can be normalized and represented by a cryptographic hash. When blockchain anchoring is enabled and the anchoring transaction is successfully confirmed, that hash can be associated with a blockchain transaction identifier and timestamp.

```text
MARKETPLACE LISTING
        ↓
ONLINE TRANSACTION / SUPPORTED EVENT
        ↓
STRUCTURED EVIDENCE RECORD
        ↓
CRYPTOGRAPHIC HASH
        ↓
BLOCKCHAIN ANCHOR (when enabled and confirmed)
        ↓
TRANSACTION ID + TIMESTAMP
        ↓
LATER INTEGRITY / CHRONOLOGY VERIFICATION
```

## What becomes verifiable

A later verifier can compare the stored Marketplace evidence with its cryptographic hash. If it matches the hash that was successfully anchored, the blockchain record can provide evidence that the corresponding digital fingerprint existed by the recorded point in time and has not been silently changed without changing that fingerprint.

This creates a tamper-evident / immutable anchoring layer for the digital evidence associated with the Marketplace event. It can be useful for listings, requests, agreements, payments or other transaction records when those specific events are connected to the evidence pipeline.

## What the blockchain does not prove

Blockchain anchoring does **not** by itself prove that:

- the contents of an advertisement are true;
- the seller or buyer fulfilled an agreement;
- goods or services have a particular quality;
- a payment is legally or fiscally sufficient documentation;
- an identity is genuine unless separately verified;
- a transaction, contract or listing has a particular legal effect.

It proves the integrity and chronology of the anchored digital fingerprint, subject to the properties and confirmation state of the blockchain used.

## Current implementation status

MyZubster is an MVP under active development. This document describes the evidence model and the behavior expected **when blockchain anchoring is enabled and successfully confirmed**. A Marketplace action must not be presented as blockchain-anchored merely because it occurred online. The application should expose the actual anchoring status, transaction identifier and verification information before an event is described as having immutable blockchain evidence.

This distinction is intentional: **online transaction ≠ automatically confirmed blockchain transaction**.
