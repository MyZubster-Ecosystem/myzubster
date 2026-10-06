# MyZubster Kefir Circular Pilot v0.1

Status: **CANDIDATE / EXPLORATORY — NOT AN AUTHORIZED FOOD OPERATION**  
Pilot ID: `MZ-KEFIR-PILOT-001`  
Venture ID: `MZ-VENTURE-KEFIR-001`  
Parent ecosystem: **MyZubster / Zorgax**

> This charter defines a proposed micro-pilot. It does not prove food-business authorization, product safety, health benefits, LIFE funding, a confirmed site or an external partnership.

## 1. Purpose

Test MyZubster as a digital evidence layer for a small kefir supply loop, reducing single-use packaging and making batch, culture and container movements auditable.

`qualified input → registered culture → controlled fermentation → quality release → reusable container → distribution → return → sanitation → reuse`

Kefir grains may be propagated through a controlled culture registry. Provenance does not certify microbiological identity or safety.

## 2. Pilot boundaries

The initial scope requires:

- one explicitly authorized food operator and one controlled site;
- one kefir product, recipe/SOP version and culture lineage;
- validated shelf-life and cold-chain procedures;
- one reusable-container format and a limited participant group;
- no therapeutic, preventive or medical claims;
- no sale or distribution before applicable food-law, hygiene, labeling and local-authority checks.

Home preparation may be studied as research but is not an authorized commercial site unless all requirements are satisfied.

## 3. Circular loops

| Loop | Pilot action | Evidence |
|---|---|---|
| Packaging | Deposit/return glass container | issue, return, inspection, wash and reuse |
| Culture | Controlled propagation of grains | culture ID, parent, transfer and acceptance |
| Food loss | Measure rejected/surplus batches | mass, reason and authorized destination |
| Local supply | Record qualified ingredient origin | supplier and lot evidence |
| Operations | Measure cold-chain, energy and wash water | method, period, unit and source |
| Knowledge | Share validated procedures | versioned SOP and training record |

Benefits remain hypotheses until measured against a documented baseline.

## 4. MyZubster integration

MyZubster provides evidence, provenance, KPI reporting and audit trails. Zorgax may guide capture, flag gaps and prepare reports, but cannot release food or replace qualified human decisions.

### Identifiers

- `cultureId`, `productLotId`, `containerId`, `siteId`, `evidenceId`, `anchorBatchId`;
- identifiers must not contain names, emails, household addresses or health data.

### Event vocabulary

| Event | Minimum evidence |
|---|---|
| `KEFIR_PROCESS_VERSION_PUBLISHED` | recipe/SOP version and document hash |
| `KEFIR_CULTURE_REGISTERED` | lineage, custodian role and acceptance |
| `KEFIR_BATCH_CREATED` | ingredient lots, culture ID, quantity and time |
| `FERMENTATION_RECORDED` | controlled measurements and method |
| `QUALITY_CHECK_RECORDED` | applicable checks and evidence |
| `BATCH_RELEASED` | authorized release and shelf-life reference |
| `CONTAINER_DISTRIBUTED` | batch/container link |
| `CONTAINER_RETURNED` | point, condition and timestamp |
| `CONTAINER_SANITIZED` | validated procedure and result |
| `CONTAINER_REUSED` | new batch link and cycle count |
| `SURPLUS_DESTINATION_RECORDED` | quantity and authorized destination |
| `CORRECTION_ISSUED` | superseded event and reason |
| `ANCHOR_PUBLISHED` | Merkle root and blockchain receipt |

Events are signed and append-only; corrections create new events.

## 5. Evidence and blockchain boundary

Keep recipes, process logs, laboratory reports, supplier/participant contacts, HACCP records, complaints, incidents and consent records off-chain under controlled access.

MyZubster may canonicalize public-safe event envelopes, hash them with SHA-256, batch hashes into a Merkle tree and anchor only the minimal Merkle root and receipt. An anchor proves digest integrity and timing, not the truth or safety of a physical claim.

## 6. Roles

- food operator: food-safety controls and batch release;
- pilot administrator: scope, identifiers and authorization;
- quality/laboratory role: applicable checks;
- distribution/collection point: custody and returns;
- sanitation operator: cleaning and inspection;
- independent verifier: evidence and Merkle-proof reproduction;
- Zorgax: assistance only.

Batch release, incident closure and public environmental claims require authorized human approval.

## 7. KPIs

- traceability and quality-check completeness;
- batch rejection rate;
- container return rate and mean reuse cycles;
- single-use packaging avoided against baseline;
- wash water per accepted reuse;
- processing/refrigeration energy per litre;
- product loss/surplus mass and destination;
- accepted/rejected culture transfers;
- signature and anchor verification rate;
- incidents, corrections and evidence gaps.

Each KPI needs a method, unit, baseline and evidence source before use.

## 8. Phases

1. **Authorization and design:** operator, site, HACCP ownership, labeling/allergen rules, data boundary, baseline and KPIs.
2. **Digital sandbox:** synthetic batches, culture lineage, container events, signatures and dashboards; no food distribution.
3. **Controlled micro-pilot:** one bounded physical loop under the confirmed operator.
4. **Verification and anchor:** reconcile records, generate Merkle proofs and publish a minimal non-personal testnet anchor.
5. **Evaluation:** publish results as `MEASURED`, `VERIFIED`, `ESTIMATED` or `UNKNOWN`; stop, redesign or scale.

## 9. Acceptance criteria

The micro-pilot is complete only when:

1. operator and site authorization are documented;
2. one process version, culture and lot are registered;
3. safety controls and release responsibility are explicit;
4. one issue-return-sanitation-reuse cycle is evidenced;
5. batch/container records reconcile;
6. off-chain access and retention are tested;
7. signed events and Merkle inclusion are independently verified;
8. no personal or health data is on-chain;
9. a rejection, correction or failed-return scenario is tested;
10. the report separates evidence from assumptions and makes no health claims.

## 10. Regulatory starting points

A qualified food-safety professional must review the concrete pilot. Initial EU references:

- [Regulation (EC) No 178/2002](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32002R0178) — general food-law principles and traceability;
- [Regulation (EC) No 852/2004](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32004R0852) — food hygiene and HACCP-based procedures;
- [Regulation (EC) No 2073/2005](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32005R2073) — microbiological criteria;
- [Regulation (EU) No 1169/2011](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1169) — consumer information, allergens and labeling.

National registration, dairy, temperature, shelf-life, packaging and waste requirements must also be confirmed.

## 11. Next actions

- [ ] Identify authorized operator and site.
- [ ] Appoint the food-safety/HACCP lead.
- [ ] Choose dairy kefir or water kefir; do not mix scopes.
- [ ] Define process, culture, batch and container identifiers.
- [ ] Approve baseline and KPI plan.
- [ ] Map events to the existing MyZubster evidence service.
- [ ] Build the synthetic end-to-end demo.
- [ ] Review privacy, labeling, allergens and claims.
- [ ] Approve the physical micro-pilot.
- [ ] Anchor the first verified, non-personal Merkle batch.
