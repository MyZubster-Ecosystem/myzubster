# AHP Blockchain Traceability v0.1

Status: **TECHNICAL SPECIFICATION / NOT YET IMPLEMENTED**  
Scope: absorbent hygiene products (AHP): baby diapers, menstrual absorbent products and adult-incontinence products.  
Parent venture: `MZ-VENTURE-AHP-001` — MyZubster Circular Care.

> This specification defines an evidence and blockchain-anchoring model. It does not certify a product, prove recycling, authorize processing of health data, or establish a confirmed commercial/LIFE partnership.

## 1. Objective

Create an auditable chain of custody connecting:

```text
DESIGN VERSION → PRODUCT LOT → SUPPLY → COLLECTION → TRANSPORT
→ TREATMENT → RECOVERED FRACTIONS → DESTINATION / REUSE → REPORT
```

The blockchain is an integrity and timestamp layer, not the database of operational or personal data.

## 2. Architecture decision

Use a **hybrid evidence ledger**:

1. canonical event records and evidence files remain off-chain in controlled storage;
2. each record is canonicalized and hashed with SHA-256;
3. related hashes are grouped in a Merkle tree;
4. only the Merkle root, manifest hash, schema version and anchoring receipt are published on-chain;
5. authorized verifiers can later recompute hashes and prove inclusion without exposing the underlying files.

The first implementation must remain chain-agnostic. A pilot network is selected only after comparing cost, finality, energy profile, public verifiability, SDK support, retention and governance. No chain is considered selected by this document.

## 3. Identifiers

Required identifiers:

- `ventureId`
- `pilotId`
- `designModelId`
- `designVersion`
- `productLotId`
- `eventId`
- `actorId` (pseudonymous public identifier)
- `siteId` (public or pseudonymous according to authorization)
- `evidenceId`
- `anchorBatchId`

Identifiers must not embed names, email addresses, health data or precise household locations.

## 4. Event vocabulary

| Event | Minimum evidence |
|---|---|
| `DESIGN_VERSION_PUBLISHED` | model/version and material-passport hash |
| `LOT_CREATED` | lot, design version, unit count or mass |
| `LOT_SUPPLIED` | sender/receiver roles, quantity, date |
| `COLLECTION_RECORDED` | authorized site, mass, method, timestamp |
| `TRANSPORT_TRANSFERRED` | custody transfer and quantity |
| `TREATMENT_ACCEPTED` | operator receipt and accepted/rejected mass |
| `TREATMENT_COMPLETED` | process reference and output masses |
| `FRACTION_RECOVERED` | fraction type, measured mass and method |
| `DESTINATION_CONFIRMED` | recipient/use and evidence reference |
| `CORRECTION_ISSUED` | superseded event and reason |
| `ANCHOR_PUBLISHED` | Merkle root and blockchain receipt |

Events are append-only. Errors are corrected by a new signed event; historical records are never silently overwritten.

## 5. Event envelope

Every event follows `ahp-trace-event.schema.json` and includes:

- schema/version;
- event and pilot identifiers;
- event type and timestamp;
- subject references;
- actor role and pseudonymous identifier;
- measurements with unit and method;
- evidence hashes;
- previous-event references;
- authorization and verification states;
- digital signature metadata;
- optional blockchain-anchor receipt.

## 6. Evidence hashing and Merkle batches

- Canonical event serialization: RFC 8785 JSON Canonicalization Scheme.
- Digest: SHA-256.
- Evidence files: hash original bytes; record MIME type and byte length.
- Batch manifest: ordered event hashes, schema version and creation timestamp.
- Merkle leaves: domain-separated hash of each canonical event hash.
- Anchor receipt: network, chain ID, transaction ID, block reference, root and confirmation state.

Changing one field produces a different digest. An on-chain receipt proves that a digest existed no later than the anchor time; it does not prove that the underlying real-world claim is true.

## 7. Identity and signatures

Actor roles may include producer, supplier, collection site, transporter, treatment operator, recovered-material recipient, auditor and pilot administrator.

Each event must be signed by an authorized key. The registry maps public actor IDs to current keys and roles. Key rotation and revocation are recorded without deleting prior signatures. High-impact events should support dual confirmation by the operator and an independent verifier.

## 8. QR/NFC physical linkage

A QR or NFC identifier may point to a public verification URL containing only a random lot token. It must not expose consumer identity or health information.

Controls:

- tamper-evident or controlled label process;
- duplicate-scan detection;
- lot-to-container aggregation records;
- custody transfer scan at each controlled hand-off;
- offline capture with signed upload time and synchronization time;
- explicit status when a label is damaged, replaced or unverifiable.

Unit-level tracking is optional. Post-consumer pilots should normally aggregate at container or batch level to reduce privacy and operational risk.

## 9. Privacy and data boundaries

Never write on-chain:

- names, emails, phone numbers or addresses;
- medical, menstrual, continence or disability information;
- household-level usage histories;
- precise vulnerable-person locations;
- photographs or documents containing personal data;
- consent records in readable form.

Consent and legal-basis records remain off-chain. Only a non-reversible evidence hash and policy version may be referenced. Retention, deletion and access rules apply to off-chain records. Because public blockchain data is difficult to erase, the on-chain payload must remain non-personal and minimal.

## 10. Verification states

- `DRAFT`
- `SUBMITTED`
- `SIGNED`
- `HUMAN_VERIFIED`
- `ANCHOR_PENDING`
- `ANCHORED`
- `DISPUTED`
- `SUPERSEDED`
- `REVOKED_KEY`

`ANCHORED` means integrity/timestamp evidence exists. It must never be displayed as equivalent to recycled, compliant, safe or independently certified.

## 11. Corrections and disputes

A correction event must reference the prior `eventId`, preserve both hashes, explain the reason and identify the authorizing role. Disputes do not remove the original event; they add a visible status and resolution trail.

## 12. Pilot acceptance criteria

An end-to-end pilot is complete only when:

1. one design version and material passport are hashed;
2. one product lot receives a QR/NFC identifier;
3. supply, collection, transport, treatment and destination events are signed;
4. measured input, rejected mass and recovered fractions reconcile within a declared tolerance;
5. evidence files are stored off-chain with controlled access;
6. event hashes are batched and anchored;
7. an independent verifier can reproduce the Merkle inclusion proof;
8. corrections, key rotation and failed-anchor recovery are tested;
9. no personal or health data is present on-chain;
10. a public report distinguishes measured, verified, estimated and unknown values.

## 13. Implementation phases

### Phase 1 — Local evidence ledger
Schema validation, canonical JSON, SHA-256, signatures and append-only storage.

### Phase 2 — Physical pilot linkage
QR/NFC, custody transfers, offline capture and duplicate detection.

### Phase 3 — Blockchain anchor adapter
Chain-neutral interface, testnet adapter, receipt verification and retry handling.

### Phase 4 — Audit and reporting
Merkle proof verifier, reconciliation checks, KPI report and public evidence page.

## 14. Security baseline

- least-privilege role access;
- encrypted off-chain storage and transport;
- managed secrets; no keys in Git;
- hardware-backed keys for production actors where feasible;
- replay protection and unique event IDs;
- timestamp and quantity anomaly detection;
- dependency and smart-contract review before production;
- incident response and key-compromise procedure.

## 15. Claim boundary

Blockchain anchoring can support integrity, ordering and timestamp verification. It cannot independently prove who physically handled a batch, whether measurements are accurate, whether a material is safe, or whether recycling occurred. Those claims require signed operational evidence, qualified measurement and independent review.
