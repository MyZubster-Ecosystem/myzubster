# Circular Care Evidence Payload Protocol (v1)

This document specifies the machine-readable **Evidence Payload v1** format connecting verified research packages (such as the **Open Period Care** research contribution by `@khongten124`) to the **MyZubster Circular Care Pilot** and downstream KPI-MRV data structures.

---

## 1. Architectural Model & Target Flow

```
Open Period Care Research (PR #1451 / Commit 17cf7ca)
   ↓
Circular Care Lifecycle Event (DESIGN / TEST / COLLECTION / RECOVERY / RECYCLING)
   ↓
Evidence Payload v1 (Canonical JSON)
   ↓
Deterministic SHA-256 Digest (df0dde40acbef8750dc8e025a922b1f8ea18118e0927f46519fc14c3afb6d89c)
   ↓
Optional Non-Custodial Blockchain Attestation (Base Sepolia / EVM Testnet)
   ↓
Verifier / Zorgax Navigation → Knowledge Graph / Contributor Passport / KPI-MRV
```

---

## 2. Core Boundary Rules & Evidence Integrity

1. **No Sensitive Health or PII Data:**
   - Payloads strictly enforce `privacyClass: AUDITED_NON_SENSITIVE | PUBLIC_SYNTHETIC | PUBLIC_AGGREGATE`.
   - Never record individual medical history, participant names, private phone numbers or clinical records.
2. **Distinguishing Research from Physical Lifecycle Execution:**
   - **Research Evidence (`DESIGN`, `TEST`):** Proves the technical, material, or design specification was documented and structured in repository history (e.g., PR #1451). Uses `evidenceState: SUPPORTED` unless external independent laboratory verification is provided.
   - **Physical Evidence (`COLLECTION`, `RECOVERY`, `RECYCLING`):** Requires independent weigh-scale receipts, facility logs, or third-party audit certificates before claiming verification.
3. **Neutral Method & Standard References:**
   - Reference standards (such as `ISO-11948-1-REFERENCE`) denote the methodological framework consulted; they do not claim certified compliance without formal audit certificates.
4. **Blockchain Anchoring Scope:**
   - An on-chain attestation proves that a specific payload digest (`payloadSha256`) was published at a given block height. It does **not** substitute for physical proof of recycling, medical certification, or commercial rights.

---

## 3. Deterministic SHA-256 Specification

To ensure machine-readable cross-platform verifiability:
1. Strip `payloadSha256` and `blockchainAnchor` from the payload object.
2. Sort all JSON object keys alphabetically (`sort_keys=True`).
3. Serialize using compact separators (`separators=(",", ":")`).
4. Calculate standard SHA-256 digest over the UTF-8 encoded bytes.

---

## 4. Zorgax Navigation Protocol

Zorgax agents can autonomously navigate the evidence chain using the following schema:
- **Locate Schema:** `docs/schemas/circular-care-evidence-payload.v1.schema.json`
- **Inspect Sample Payloads:** `docs/life/ventures/circular-care-evidence-payload-v1.json`
- **Verify Provenance:** Read `evidenceRefs` to link back to contributor PRs (`#1451`), commits (`17cf7ca`), and issue discussions (`#1486`, `#1474`, `#1450`).
