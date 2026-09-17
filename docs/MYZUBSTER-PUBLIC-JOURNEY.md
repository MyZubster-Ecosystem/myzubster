# MyZubster — Public Connected Journey

This page connects the currently evidenced MyZubster journey from community discovery to Marketplace exchange, payment boundaries, kefir handover evidence, public knowledge, research and visual storytelling.

<p align="center">
  <a href="https://www.myzubster.com/fumetto"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/main/public/comics/community/MyZubster-Community-Zorgax-Guide.jpg" alt="MyZubster Community and Zorgax visual guide" width="92%"></a>
</p>

## One connected flow

```text
PERSON / COMMUNITY NEED
        ↓
MYZUBSTER + ZORGAX
        ↓
MARKETPLACE OFFER / REQUEST
        ↓
FREE EXCHANGE ───────────────┐
        │                    │
        └── or PAYMENT ──────┤
             provider check  │
             MYZ accounting  │
                             ↓
                     REAL-WORLD HANDOVER
                             ↓
                    RECEIVED → RECORDED
                             ↓
                  CANONICAL SHA-256 RECORD
                             ↓
                 OPTIONAL ON-CHAIN ANCHOR
                             ↓
                    INDEPENDENT VERIFIER
                             ↓
                    KNOWLEDGE / FEEDBACK
                             ↓
                 RESEARCH / REPRODUCTION
                             ↓
                       SHARE AGAIN
```

The knowledge loop is `SHARE → TRY → OBSERVE → IMPROVE → SHARE`.

## Marketplace and payments

The Marketplace connects offers and requests for skills, local resources, community services and pilot exchanges. A `FREE` exchange bypasses payment; paid flows are a separate evidence layer. MYZ is an internal utility/accounting credit and must not be presented as proof of external crypto settlement. Payment evidence proves payment state only; it does not prove delivery, learning, safety or successful service fulfillment.

- Production: https://www.myzubster.com/
- Marketplace: https://www.myzubster.com/community-marketplace.html
- Marketplace repository: https://github.com/DanielIoni-creator/MyZubster-Marketplace
- Core implementation: https://github.com/MyZubster-Ecosystem/myzubster

<p align="center">
  <img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/main/frontend/public/images/marketplace/demo/produce-kefir.png" alt="MyZubster kefir Marketplace visual" width="72%">
</p>

## Nicola kefir pilot — real recorded handover + public commitment

The Nicola/N4K48 kefir pilot is the first concrete bridge between a Marketplace handover and the MyZubster Knowledge Protocol.

**Public KF-006 evidence page:** https://www.myzubster.com/knowledge-kf-006.html

Application evidence:

- Listing: `6aa9ee1b821964be0b43ff6e`
- Handover: `6aab8faca70ce84f926d0b41`
- Method: `HAND_DELIVERY`
- Payment required: `false`
- State: `RECORDED`
- `handedOverAt`: `2026-09-17T07:28:24.874Z`
- `receivedAt`: `2026-09-17T07:45:03.261Z`
- `recordedAt`: `2026-09-17T07:46:09.606Z`

Blockchain commitment evidence:

- Schema: `myzubster.marketplace-handover.v1`
- SHA-256: `ba9973f08ce86d16a3611c3cccbb9cc2cc779b9ea1cb6fd87a2e5864e557b6b9`
- Network: Base Sepolia
- Chain ID: `84532`
- Transaction: `0x998a98b1733312e248f74a1387319dae30aab8123a6115c517e4ffe0ef9584bf`
- Block: `46933575`
- Confirmed: `2026-09-17T08:57:18.000Z`
- Explorer: https://sepolia.basescan.org/tx/0x998a98b1733312e248f74a1387319dae30aab8123a6115c517e4ffe0ef9584bf

The independent verifier in the core repository reproduced the exact v1 commitment from the handover record and matched it against transaction calldata `MZ-HANDOVER-V1:<hash>` with `VERIFY_EXIT=0`.

Important boundary: the blockchain proves integrity/timestamp evidence for the commitment. It does **not** independently prove the physical event, participant identity, food safety, microbiology, health effects, successful fermentation, learning or scientific validity.

- Kefir repository: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir
- KF-006 evidence: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir/blob/main/knowledge/KF-006-NICOLA-PILOT.md
- Nicola profile: https://github.com/DanielIoni-creator/Nicola
- Verifier source: https://github.com/MyZubster-Ecosystem/myzubster/blob/main/scripts/verify-handover-commitment.js

## Public Knowledge Explorer

The kefir repository is also the first concrete dataset for the broader MyZubster Knowledge Protocol. Evidence classes remain distinct: `PERSONAL_PRACTICE`, `TRADITIONAL_PRACTICE`, `OBSERVATION`, `EXTERNAL_SOURCE`, `VERIFIED_GUIDANCE`. Community repetition never silently upgrades a claim to verified guidance.

- KF-006 public evidence page: https://www.myzubster.com/knowledge-kf-006.html
- Knowledge Explorer: https://myzubster-knowledge.vercel.app/knowledge.html
- Read-only summary API: https://myzubster-knowledge.vercel.app/api/knowledge?action=summary
- Knowledge Protocol: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir/blob/main/MYZUBSTER-KNOWLEDGE-PROTOCOL.md

## University and reproducible research

Research is a separate layer: `Question → protocol → consent/evidence plan → GitHub work → Zorgax support → measurements → review/reproduction → conclusions with limitations`.

- KF-006 public evidence page: https://www.myzubster.com/knowledge-kf-006.html
- University & Research: https://github.com/DanielIoni-creator/myzubster-university-research
- Research Lab: https://github.com/DanielIoni-creator/Myzubster-research-lab
- Student Profiles: https://github.com/DanielIoni-creator/Myzubster-student-profile
- Developer Support: https://github.com/DanielIoni-creator/Myzubster-developer-support

No README, visual, issue or pilot record by itself establishes a formal university partnership, scientific validation, funding or institutional endorsement.

## Visual and comic layer

<p align="center">
  <a href="https://www.myzubster.com/fumetto"><img src="https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/main/public/comics/community/N4K48_Nicola_MyZubster_Comic.png" alt="Nicola N4K48 MyZubster comic" width="82%"></a>
</p>

The Comic Universe is the narrative navigation layer around the evidence system. Visuals explain how components connect; they are not evidence that an event, payment, partnership or scientific result occurred.

- KF-006 public evidence page: https://www.myzubster.com/knowledge-kf-006.html
- Interactive comic: https://www.myzubster.com/fumetto
- Visual repository: https://github.com/MyZubster-Ecosystem/MyZubster-Visual
- Nicola: https://github.com/DanielIoni-creator/Nicola
- Kefir: https://github.com/DanielIoni-creator/Myzubster-fermentation-kefir
- Marketplace: https://github.com/DanielIoni-creator/MyZubster-Marketplace
- University & Research: https://github.com/DanielIoni-creator/myzubster-university-research

## Evidence rule

MyZubster deliberately keeps these layers separate:

`LISTING ≠ PAYMENT ≠ HANDOVER ≠ RECEIPT ≠ RECORDED APP STATE ≠ ON-CHAIN COMMITMENT ≠ KNOWLEDGE VALIDATION ≠ SCIENTIFIC VALIDATION`.

They can be connected by identifiers and provenance, but one state never silently proves the next.
