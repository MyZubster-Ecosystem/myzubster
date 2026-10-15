# Nicola / N4K48 ↔ Open Period Care / Circular Care Evidence Bridge

## Purpose

This document links two independently evidenced MyZubster contribution tracks without collapsing their roles:

- **Nicola / N4K48**: independent-node / Docker / evidence-verification / knowledge-anchor path.
- **khongten124**: Open Period Care research / Circular Care evidence-model / Evidence Payload v1 path.

The goal is to make these tracks interoperable through **Zorgax**, the **Knowledge Graph**, and the **Contributor Passport**, while preserving strict evidence boundaries.

---

## 1. Nicola / N4K48 — verified technical pattern

Public evidence already available in MyZubster includes:

- independent contributor repository: https://github.com/nicolaususnicola-lgtm/myzubster-mvp
- N4K48 knowledge anchor verifier:
  https://www.myzubster.com/knowledge-anchor-n4k48
- Base Sepolia transaction:
  `0xff3c108275625673ad22a886da2df7120ae81b8f0106ec833613513b03c7bc31`
- chainId: `84532`
- public receipt files:
  - `docs/evidence/knowledge-transfers/KNOWLEDGE-N4K48-2026-09-18-001.receipt.md`
  - `docs/evidence/knowledge-transfers/KNOWLEDGE-N4K48-2026-09-18-001.receipt.json`

This demonstrates a reusable technical pattern:

```text
independent contributor node / repository
→ local evidence
→ canonical payload
→ deterministic hash
→ optional testnet anchor
→ verifier result
→ MyZubster Knowledge Graph / Contributor Passport
```

This pattern proves evidence integrity / provenance when the verifier matches the committed payload. It does not prove unrelated scientific, medical, legal, recycling, ownership, payment, or institutional claims.

---

## 2. khongten124 — Open Period Care / Circular Care evidence track

Current public evidence includes:

- Open Period Care research package: PR #1451
- canonical contributor linkage: `docs/contributions/khongten124-canonical-project-link.md`
- Circular Care Evidence Payload v1: PR #1489, merged into `main`
- schema:
  `docs/schemas/circular-care-evidence-payload.v1.schema.json`
- canonical sample:
  `docs/life/ventures/circular-care-evidence-payload-v1.json`
- protocol:
  `docs/life/ventures/CIRCULAR-CARE-EVIDENCE-PAYLOAD-V1.md`

The current role is evidence-backed as:

**Materials Science / Sustainable Health Technologies / Technical Documentation & Evidence Analysis**

The current evidence status is research/documentation-oriented. It does not establish physical recycling, wastewater compatibility, medical certification, or independent scientific validation.

---

## 3. Interoperability bridge

The two tracks can be connected as follows:

```text
NICOLA / N4K48
independent node + Docker + verifier pattern
        │
        │ reusable technical evidence pattern
        ▼
MYZUBSTER RESEARCH / EVIDENCE BRIDGE
        ▲
        │
        │ Open Period Care / Circular Care evidence payload
        │
KHONGTEN124
research + evidence matrix + Evidence Payload v1
```

Unified MyZubster flow:

```text
Contributor A or B
→ own repo / fork / node
→ sanitized canonical evidence
→ deterministic SHA-256
→ read-only bridge / verifier
→ Zorgax evidence navigation
→ Knowledge Graph
→ Contributor Passport
→ optional Base Sepolia attestation
```

---

## 4. How this applies to the absorbent-product pilot

Nicola's contribution is **not** treated as absorbent-product research.

Instead, Nicola's verified work provides a **technical provenance and independent-node pattern** that can be reused by the Open Period Care / Circular Care track.

Example future flow:

```text
Open Period Care research
→ Circular Care lifecycle event
→ Evidence Payload v1
→ local Docker validation by contributor
→ deterministic SHA-256
→ MyZubster read-only verification bridge
→ Knowledge Graph / Contributor Passport
→ optional Base Sepolia anchor
```

A future Circular Water extension may reuse the same pattern for sanitized research evidence, while keeping wastewater-treatment claims at `PROPOSED` or `SUPPORTED` until independently tested or verified.

---

## 5. Zorgax role

Zorgax may use this bridge to:

- trace the source repository, PR, commit, payload and verifier;
- distinguish contributor roles;
- connect evidence to Knowledge Cards and Contributor Passports;
- compare evidence-state transitions:
  `PROPOSED → SUPPORTED → TESTED → VERIFIED`;
- identify when a claim has only repository support versus independent physical/lab evidence;
- navigate between Nicola's verifier pattern and khongten124's Circular Care payload model.

Zorgax must not infer that:

- Nicola performed Open Period Care research;
- khongten124 already operates a decentralized node;
- a blockchain anchor proves physical recycling or wastewater safety;
- a research payload proves clinical or product certification.

---

## 6. Next interoperability milestone

A future contributor-node test can reuse Nicola's architectural pattern for khongten124:

```text
khongten124 fork
→ local Docker
→ sanitized Open Period Care / Circular Care payload
→ schema validation
→ deterministic SHA-256
→ read-only MyZubster bridge
→ verification response
→ public non-sensitive evidence
→ optional Base Sepolia anchor
```

This would create an evidence-backed connection between the two contribution tracks without centralizing the contributor environments or overstating scientific verification.
