# Knowledge Cards — Open Period Care Pilot

> **Knowledge Domain:** Materials Science / Sustainable Health Technologies  
> **Referenced Issues:** [#1399](https://github.com/MyZubster-Ecosystem/myzubster/issues/1399), [#1450](https://github.com/MyZubster-Ecosystem/myzubster/issues/1450)

---

## Knowledge Card 01: Multi-Layer Biomaterial Architecture for Reusable Textile Absorbents

```yaml
id: KC-OPC-001
title: Multi-Layer Biomaterial Architecture for Reusable Textile Absorbents
domain: Open Period Care / Materials Science
status: SUPPORTED
version: 1.0.0
cross_references:
  - issue: 1399
  - bounty: 1450
  - standards:
      - ISO 10993-5 (In Vitro Cytotoxicity Reference)
      - GOTS 7.0 (Global Organic Textile Standard)
      - AFNOR SPEC S30-018 (Reusable Menstrual Textiles Guidelines)
summary: >
  Specification of a hypoallergenic, 3-layer biomaterial composite engineered
  for high-speed capillary absorption, leak protection, and wash durability.
specifications:
  top_contact_layer:
    material: 100% GOTS-certified Organic Cotton Interlock (210 g/m²) or Eucalyptus Lyocell
    purpose: Direct skin contact, rapid fluid wicking, unbleached fiber specification.
    fluid_wicking_rate: "< 1.5 seconds per 5 ml aliquot (target benchtop standard)"
  absorbent_core:
    material: Double-layer 3D Bamboo/Cotton/Polyester Zorb or needle-punched Hemp Fleece
    retention_capacity: ">= 25 ml artificial fluid simulant (design parameter)"
    rewet_under_pressure: "< 0.1 g at 2.0 kPa static load (design guideline)"
  waterproof_barrier:
    material: Breathable Thermoplastic Polyurethane (TPU) membrane (25 µm)
    moisture_vapor_transmission_rate: ">= 3000 g/m²/24h (spec target)"
    hydrostatic_resistance: ">= 5000 mm H2O (spec target)"
  fasteners:
    material: Hypoallergenic OEKO-TEX Standard 100 Class 1 Polyacetal (POM) resin snaps.
circular_economy_metrics:
  lifecycle_impact_target: "Substantial waste reduction over reusable lifespan vs single-use disposables (subject to accredited full LCA)"
  durability_target: ">= 50 domestic wash cycles at 40°C"
```

---

## Knowledge Card 02: Contributor Privacy, Data Minimization & Clinical Boundaries

```yaml
id: KC-OPC-002
title: Contributor Privacy, Data Minimization & Clinical Claim Boundaries
domain: Open Period Care / Ethics & Regulatory Governance
status: SUPPORTED
version: 1.0.0
cross_references:
  - issue: 1399
  - bounty: 1450
  - frameworks:
      - GDPR Article 25 (Privacy by Design and by Default)
      - GDPR Article 9 (Processing of Special Categories of Personal Data)
summary: >
  Governance and ethical protocol ensuring absolute protection of contributor
  health data, anonymization of feedback, and clear boundaries separating open
  engineering from clinical/medical claims.
governance_rules:
  prohibited_data_collection:
    - Menstrual history / clinical diagnoses
    - Medication / hormonal therapy records
    - Intimate or photographic anatomical media
    - Personal names, IPs, or location metadata
  epistemological_classification:
    anecdote: "Subjective user experience / qualitative comfort feedback"
    hypothesis: "Proposed engineering tolerance or vector pattern design"
    source_evidence: "Documented literature and published technical reference standards"
    verified_result: "Accredited laboratory measurements and certified assay data"
  claim_boundaries:
    medical_claims: "STRICTLY PROHIBITED (Not a medical device / no clinical claims)"
    antibacterial_claims: "PROHIBITED without certified ISO 20743 challenge assays"
    scope_limitation: "Research documentation, open-source material patterns, and educational LCA analysis only"
```
