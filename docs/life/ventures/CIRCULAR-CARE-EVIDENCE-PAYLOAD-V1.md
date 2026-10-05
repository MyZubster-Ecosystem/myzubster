# Circular Care Evidence Payload Protocol (v1)

This document specifies the machine-readable **Evidence Payload v1** format connecting verified research packages (such as the **Open Period Care** research contribution by `@khongten124`) to the **MyZubster Circular Care Pilot** and the downstream KPI-MRV pipeline.

---

## 1. Architectural Model & Target Flow

```
Open Period Care Research (PR #1451 / Commit 17cf7ca)
   ↓
Circular Care Lifecycle Event (DESIGN / TEST / COLLECTION / RECOVERY / RECYCLING)
   ↓
Evidence Payload v1 (Canonical JSON)
   ↓
Deterministic SHA-256 Digest
   ↓
Optional Non-Custodial Blockchain Attestation (Ethereum / Base Sepolia)
   ↓
Verifier / Zorgax Navigation → Knowledge Graph / Contributor Passport / KPI-MRV
```

---

## 2. Core Boundary Rules & Evidence Integrity

1. **No Sensitive Health or PII Data:**
   - Payloads strictly enforce `privacyClass: AUDITED_NON_SENSITIVE | PUBLIC_SYNTHETIC | PUBLIC_AGGREGATE`.
   - Never record individual medical history, participant names, private phone numbers or clinical records.
2. **Distinguishing Research from Physical Lifecycle Execution:**
   - **Research Evidence (`DESIGN`, `TEST`):** Proves the mathematical, clinical, or chemical specification was documented and peer-reviewed (e.g., PR #1451).
   - **Physical Evidence (`COLLECTION`, `RECOVERY`, `RECYCLING`):** Requires independent lab certificates, weigh-scale audit receipts, or certified recycling facility logs.
3. **Blockchain Anchoring Scope:**
   - An on-chain attestation proves that a specific payload digest (`payloadSha256`) was published at a given block height. It does **not** substitute for physical proof of recycling.

---

## 3. Deterministic SHA-256 Specification

To ensure machine-readable cross-platform verifiability:
1. Strip `payloadSha256` and `blockchainAnchor` from the payload dictionary.
2. Sort all JSON object keys alphabetically (`sort_keys=True`).
3. Serialize using compact separators (`separators=(",", ":")`).
4. Calculate standard SHA-256 digest over the UTF-8 encoded bytes.

---

## 4. Zorgax Navigation Protocol

Zorgax agents can autonomously navigate the evidence chain using the following schema:
- **Locate Schema:** `docs/schemas/circular-care-evidence-payload.v1.schema.json`
- **Inspect Sample Payloads:** `docs/life/ventures/circular-care-evidence-payload-v1.json`
- **Verify Provenance:** Read `evidenceRefs` to link back to contributor PRs (`#1451`), commits (`17cf7ca`), and issue discussions (`#1486`, `#1474`, `#1450`).
