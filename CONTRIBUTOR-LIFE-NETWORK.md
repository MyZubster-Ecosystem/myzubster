# MyZubster Contributor ↔ LIFE Network

Status: `WORKING MAP / OPEN FOR REVIEW`

This document connects public GitHub contribution areas with MyZubster technical modules and candidate LIFE pilot needs. It is an operational map, **not** proof of employment, institutional affiliation, partnership, endorsement, or formal LIFE participation.

## Network model

```text
GitHub contributor
      ↓
Issue / PR / technical review
      ↓
MyZubster module
      ↓
Candidate LIFE pilot / real-world use case
      ↓
KPI / MRV / Evidence Layer
      ↓
Domain feedback
      ↓
New issue / PR / reproducible improvement
```

## Coordination hub

Central coordination issue: [#1047 — Contributor Network — collegare GitHub, partner LIFE e pilot MyZubster](https://github.com/MyZubster-Ecosystem/myzubster/issues/1047)

Current open entry points:

- [#1044 — Quantum module: review dei file quantistici e proposta di miglioramento](https://github.com/MyZubster-Ecosystem/myzubster/issues/1044)
- [#1045 — Blockchain AHP: definire schema hash per tracciamento e riciclo](https://github.com/MyZubster-Ecosystem/myzubster/issues/1045)
- [#1046 — LIFE Evidence Layer: review del modello KPI/MRV comune ai pilot](https://github.com/MyZubster-Ecosystem/myzubster/issues/1046)
- [#1048 — Circular Water: micro-schema IoT + KPI/MRV per un pilot acqua](https://github.com/MyZubster-Ecosystem/myzubster/issues/1048)
- [#1049 — Canapa industriale: micro-schema di tracciabilità processo + KPI](https://github.com/MyZubster-Ecosystem/myzubster/issues/1049)
- [#1050 — IoT Evidence Bridge: firmare e verificare eventi fisici](https://github.com/MyZubster-Ecosystem/myzubster/issues/1050)

## Verified public GitHub contributors — initial map

The table below uses only public repository evidence already visible in MyZubster pull requests. The **pilot alignment** column is a proposed technical fit; it does not imply that the contributor belongs to or represents any LIFE partner.

| Contributor | Public contribution evidence | Demonstrated area | Proposed MyZubster / LIFE alignment | Status |
|---|---|---|---|---|
| [`@Aming9303`](https://github.com/Aming9303) | [PR #634 — MyZubster workflow visual guide](https://github.com/MyZubster-Ecosystem/myzubster/pull/634) | documentation, visual architecture, provenance, workflow communication, verification boundaries | Evidence Layer communication, pilot explainability, public documentation, contributor onboarding | `INVITED / NO LIFE AFFILIATION INFERRED` |
| [`@s6pa1rta3n-lab`](https://github.com/s6pa1rta3n-lab) | [PR #844 — workflow visual guide and validation suite](https://github.com/MyZubster-Ecosystem/myzubster/pull/844) | documentation, validation tests, evidence boundaries, reproducible checks | Evidence Layer validation, KPI/MRV documentation tests, technical review of pilot evidence packages | `INVITED / NO LIFE AFFILIATION INFERRED` |

This first version intentionally keeps the contributor list small. New contributors should be added only after checking their public MyZubster PR/issue history.

## MyZubster technical areas ↔ LIFE pilot needs

| Technical area | GitHub entry point | Candidate pilot/use case | Expected contributor output |
|---|---|---|---|
| Quantum / advanced simulation | #1044 | research-oriented review, simulation, cryptography, advanced modelling | code/file review, reproducibility notes, one bounded improvement |
| Blockchain traceability | #1045 | Circular Care / AHP: collection → treatment → recovered materials | event schema, hash/proof model, privacy rules, validation example |
| KPI / MRV / Evidence Layer | #1046 | common layer across Circular Water, AHP, hemp and other pilots | common schema, validation rules, audit checklist, examples |
| Circular Water | #1048 | water treatment / monitoring / circularity pilots | sensor/data schema, 2–3 KPI/MRV, data quality rules, evidence validation |
| Industrial hemp | #1049 | fibre, retting, circular material pilot concepts | process traceability model, KPI mapping, validation boundaries |
| IoT / physical-digital bridge | #1050 | water, care products, hemp, environmental monitoring | signed event model, anti-tampering/replay rules, provenance and confidence |
| Marketplace / circular commerce | existing marketplace/seller issues + new bounded tasks | circular marketplace and economic sustainability | conversion tests, seller flow, auditability, unit-economics review |
| Metaverse / realtime | existing realtime PRs/issues | collaboration, pilot visualization, shared environments | realtime tests, Redis/Vercel reliability, visualization of pilot state |

## LIFE-side roles

The network should distinguish these roles clearly:

- **Domain partner / university / research body** — can define requirements, methods, KPI/MRV rules and scientific validation criteria.
- **Pilot owner** — is responsible for the real-world case, authorized data, operational evidence and consent boundaries.
- **GitHub contributor** — can implement code, tests, schemas, documentation and reviews, but does not become a LIFE partner by contributing.
- **MyZubster** — coordinates modules, traceability, Evidence Layer and links between technical work and pilot needs.
- **Zorgax** — can guide a contributor from interest → issue → documentation → pilot context without inventing affiliations or evidence.

## Contributor onboarding flow

1. Choose one `help wanted` issue.
2. Comment with the area of interest and the smallest useful task you can take.
3. Work on one bounded, testable deliverable.
4. Open a PR or submit a technical review.
5. Link the contribution to the relevant MyZubster module.
6. Only when there is a real pilot need, map the module to that pilot's KPI/MRV/evidence requirements.
7. Feed validated pilot feedback back into GitHub as a new issue or review.

## Evidence and privacy rules

- A GitHub contribution does **not** prove employment, government work, university affiliation, partnership, funding, or endorsement.
- A technical alignment with a LIFE pilot does **not** mean the contributor is a LIFE participant.
- Do not publish health data, private partner data, credentials, contracts, unpublished business information, precise sensitive locations, or personal identifiers.
- Use public sources or explicit consent for every named external relationship.
- Keep these states separate: `PROPOSED`, `IN REVIEW`, `PILOT`, `IMPLEMENTED`, `VERIFIED`.
- Blockchain/hash evidence can help prove integrity of recorded events; it does not make incorrect source data true.
- MRV/Evidence Layer output must preserve uncertainty and evidence quality instead of converting incomplete data into proof.

## How partners can participate without coding

Partners, universities and collaborators can contribute by commenting on issues with:

- required KPI definitions;
- accepted measurement methods;
- validation criteria;
- data quality thresholds;
- minimum evidence needed for a pilot claim;
- privacy/confidentiality constraints;
- replicability requirements;
- false-positive / greenwashing risks to avoid.

A maintainer or GitHub contributor can then translate those requirements into schemas, code, tests and documentation.

## Next network tasks

- [ ] Review historic human PRs and add contributors with verified public evidence.
- [x] Create one small `help wanted` task for Circular Water — #1048.
- [x] Create one small `help wanted` task for industrial hemp — #1049.
- [x] Create one small IoT physical-digital evidence task — #1050.
- [ ] Ask LIFE-side collaborators to review #1046 for KPI/MRV requirements.
- [ ] Add a Zorgax onboarding path that points contributors to #1047 and the current `help wanted` issues.
- [ ] Review this map periodically and remove stale or unsupported associations.

## Join the network

If you have already contributed to MyZubster, or want to contribute now, start from [#1047](https://github.com/MyZubster-Ecosystem/myzubster/issues/1047) and choose one small technical area.

The goal is not to create a list of names. The goal is to make the loop measurable:

**real pilot need → clear GitHub task → reproducible contribution → verified feedback → better open-source infrastructure.**
