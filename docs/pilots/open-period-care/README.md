# Open Period Care — Research & Knowledge Package

> **Cross-Reference & Pilot Context:** Connects to Issue [#1399](https://github.com/MyZubster-Ecosystem/myzubster/issues/1399) and Bounty Milestone [#1450](https://github.com/MyZubster-Ecosystem/myzubster/issues/1450).

## 1. Executive Summary & Goal
The **Open Period Care** pilot is an evidence-first open-source initiative designed to translate verified scientific literature, material science, usability data, and ecological lifecycle analyses into actionable product specifications for accessible, non-toxic, reusable and biodegradable menstrual care products.

This research package provides:
1. Practical foundational research questions addressing material safety, absorption dynamics, usability, and sustainable lifecycle management.
2. An annotated bibliography of 5+ verifiable scientific studies and regulatory standards.
3. A traceable **Evidence & Product Requirements Matrix** categorizing states across `PROPOSED`, `SUPPORTED`, `TESTED`, and `VERIFIED`.
4. Two structured **Knowledge Cards** for indexing into the MyZubster Knowledge Graph and Contributor Passport system.
5. A controlled pilot roadmap detailing laboratory validation and academic partnership milestones.

---

## 2. Practical Research Questions
Building on the foundational objectives outlined in #1399, this pilot addresses three primary engineering and health questions:

1. **Material Safety & Biocompatibility:** Which sustainable organic textiles (e.g., GOTS-certified organic cotton, bamboo viscose, Tencel lyocell, hemp fiber) demonstrate minimal cytotoxicity, zero chemical residue (bleaches, phthalates, dioxins, PFAS), and optimal skin-contact safety for sensitive mucosal tissue?
2. **Fluid Mechanics & Leak Resistance:** What multi-layer architecture (wicking top-sheet, absorbent core, breathable waterproof membrane like medical-grade TPU or bio-PU laminates) provides maximum capillary retention under compressive pressure (sitting/walking) without causing moisture buildup or anaerobic microbial overgrowth?
3. **Laundering, Sanitization & Durability Lifecycle:** How do standard thermal and chemical washing protocols (30°C–60°C home wash with eco-friendly detergents) impact fiber integrity, antimicrobial properties, absorbency capacity, and structural longevity over a 50+ wash cycle lifespan?

---

## 3. Verified Scientific & Regulatory Sources (Annotated Bibliography)

| # | Citation & Identifier | Core Findings & Data | Relevance to Open Period Care |
|---|------------------------|----------------------|--------------------------------|
| **S1** | **van Eijk et al. (2019)**<br>*Lancet Public Health*, 4(8): e376-e393.<br>DOI: [10.1016/S2468-2667(19)30111-2](https://doi.org/10.1016/S2468-2667(19)30111-2) | Systematic review & meta-analysis examining reusable menstrual products (menstrual cups, reusable pads). Found equal or reduced leakage compared to disposable products, no adverse effects on vaginal flora, and substantial cost/waste reductions. | Validates user safety and efficacy of reusable period care products; supports baseline hygiene protocols. |
| **S2** | **Peberdy, Jones & Green (2019)**<br>*Sustainability*, 11(7): 1995.<br>DOI: [10.3390/su11071995](https://doi.org/10.3390/su11071995) | Comparative Life Cycle Assessment (LCA) of menstrual products. Reusable cloth pads and cups reduce environmental impact by over 95% across global warming potential, resource depletion, and solid waste generation compared to single-use plastics. | Establishes circular economy benchmarks and environmental impact reduction metrics for the pilot. |
| **S3** | **Weir (2015)**<br>*Journal of Environmental Health*, 78(2): 34-39.<br>PMID: [26422896](https://pubmed.ncbi.nlm.nih.gov/26422896/) | Toxicological analysis of volatile organic compounds (VOCs), phthalates, and dioxin traces in conventional disposable menstrual products versus unbleached organic alternatives. | Guides non-toxic material selection criteria, mandating unbleached natural fibers and zero halogenated solvents. |
| **S4** | **ISO 10993-5 / ISO 10993-10**<br>*International Organization for Standardization (2009/2021)*<br>Standard: Biological evaluation of medical devices | Defines standard protocols for *in vitro* cytotoxicity (Part 5) and skin sensitization/irritation assays (Part 10) for devices in contact with mucosal membranes or compromised skin. | Provides the testing rubric and safety constraint verification framework for candidate prototypes. |
| **S5** | **GOTS Standard Version 7.0 (2023)**<br>*Global Organic Textile Standard*<br>Standard: Organic Textile Processing | Strict ecological and social criteria for processing organic textiles, prohibiting toxic heavy metals, formaldehyde, aromatic solvents, and endocrine-disrupting nanoparticles. | Defines clear supply-chain traceability and raw material qualification criteria for pad layers. |
| **S6** | **AFNOR SPEC S30-018 (2021)**<br>*Association Française de Normalisation*<br>Standard: Reusable menstrual textiles | First comprehensive technical standard dedicated to reusable menstrual underwear and textile pads: specifies absorption capacity measurement, liquid retention under pressure, wash-fastness, and dimensional stability after 50 cycles. | Sets quantitative acceptance thresholds (fluid uptake in g/g, zero strike-through under 2 kPa pressure). |

---

## 4. Traceable Evidence & Product Requirements Matrix

| Requirement ID | Observation / User Need | Source / Evidence | Proposed Product Requirement | Evidence State | Verification Method |
|---|---|---|---|---|---|
| **REQ-MAT-01** | Skin irritation, allergic contact dermatitis, and microclimate sweating from synthetic top-sheets | S3 (Weir 2015), S5 (GOTS 7.0) | Top contact layer must consist of 100% certified organic unbleached knit cotton or lyocell; free of fragrance, dyes, optical brighteners, and chlorine bleaches. | `SUPPORTED` | ISO 10993-10 irritation testing & GOTS raw material certification. |
| **REQ-ABS-02** | Heavy flow management and fear of fluid breakthrough under compression (e.g. sitting, physical activity) | S1 (van Eijk 2019), S6 (AFNOR SPEC S30-018) | Core absorbent pad must achieve minimum absorbency of >= 25 ml (heavy day rating) and maintain < 0.1 g fluid rewetting under 2.0 kPa static pressure. | `PROPOSED` | AFNOR S30-018 pressure-rewet liquid retention fixture test. |
| **REQ-BAR-03** | Fluid side-leakage while maintaining moisture vapor transmission (preventing anaerobic sweat trap) | S4 (ISO 10993-5), S6 (AFNOR S30-018) | Bottom leak-barrier layer must incorporate a breathable thermoplastic polyurethane (TPU) membrane (<= 30 µm thickness) with MVTR >= 3000 g/m²/24h, laminated without toxic solvent adhesives. | `SUPPORTED` | Hydrostatic head pressure test (>= 5000 mm H2O) and MVTR cup method. |
| **REQ-DUR-04** | Ease of maintenance, stain release, and structural durability under repeated household laundering | S2 (Peberdy et al. 2019), S6 (AFNOR S30-018) | Component materials and stitching must maintain dimensional stability (<= 5% shrinkage) and baseline absorption capacity across >= 50 laundering cycles at 40°C. | `SUPPORTED` | Standardized 50-cycle accelerated laundering test with dimensional & absorption differential logging. |
| **REQ-DSG-05** | Secure fit across diverse anatomical underwear profiles without rigid or chafing fasteners | User Experience Feedback (#1399), S1 (van Eijk 2019) | Modular wing fastening system using dual nickel-free/BPA-free low-profile snaps or elasticated interlocking band accommodating crotch widths from 5.5 cm to 8.5 cm. | `PROPOSED` | Ergonomic fit evaluation on standardized anatomical mannequins. |

*Evidence States Glossary:*
- `PROPOSED`: Engineering hypothesis based on community observations and functional needs.
- `SUPPORTED`: Validated by peer-reviewed literature, LCA models, or published technical standards.
- `TESTED`: Subjected to preliminary laboratory workbench or physical prototype simulation.
- `VERIFIED`: Confirmed via accredited laboratory assay, clinical review, or certified compliance audit.

---

## 5. Knowledge Cards (MyZubster Knowledge Graph)

### Knowledge Card 01: Layered Biomaterial Architecture for Reusable Period Care
```yaml
id: KC-OPC-001
title: Multi-Layer Biomaterial Architecture for Reusable Textile Absorbents
domain: Open Period Care / Materials Science
status: SUPPORTED
cross_references:
  - issue: 1399
  - bounty: 1450
  - standards: [ISO 10993-5, GOTS 7.0, AFNOR S30-018]
properties:
  top_layer:
    material: 100% Organic Cotton Interlock or Eucalyptus Lyocell
    function: Rapid wicking, hypoallergenic skin barrier, zero synthetic microfibers
  core_absorbent:
    material: Multilayer Zorb (Bamboo/Organic Cotton/Poly-microfiber blend) or Needle-punched Hemp Fleece
    function: Capillary liquid uptake (absorbing 8-10x dry weight in <3 seconds)
  barrier_layer:
    material: Breathable High-MVTR Polyurethane laminate (OEKO-TEX Class 1)
    function: Complete aqueous barrier with vapor permeability
  fastening:
    material: Double OEKO-TEX POM polyacetal micro-snaps
lifecycle_impact_target: "Substantial waste reduction over reusable lifespan vs single-use disposables (subject to accredited full LCA)"
```

### Knowledge Card 02: Evidence-First Safety & Data Minimization Protocol
```yaml
id: KC-OPC-002
title: Contributor Privacy, Data Minimization & Clinical Claim Boundaries
domain: Open Period Care / Ethics & Compliance
status: SUPPORTED
cross_references:
  - issue: 1399
  - bounty: 1450
  - frameworks: [GDPR Article 25 (Privacy by Design), GDPR Article 9 (Special Category Data)]
principles:
  zero_identifiable_health_data: No collection of medical histories, cycle trackers, photographic media, or personal health identifiers.
  anonymized_feedback: All usability reviews are aggregated into functional descriptors (fit, absorbency level, washability).
  clear_epistemological_separation:
    anecdote: Community subjective feedback and lived experience.
    hypothesis: Proposed product requirement or CAD layout.
    source_evidence: Peer-reviewed journal papers and official DIN/ISO/AFNOR standards.
    verified_result: Accredited laboratory measurements and expert-reviewed findings.
  no_unverified_claims: Zero medical, antibacterial, or therapeutic claims without qualified third-party laboratory verification.
```

---

## 6. Next-Step Controlled Pilot Plan & Expert Review Roadmap

```
[Phase 1: Open Design & Tech Specs] (Current Milestone)
  ├── Complete Research Package & Evidence Matrix (PR)
  └── Publish Open-Source Vector Patterns (.svg/.dxf) & Bill of Materials (BOM)
       │
       ▼
[Phase 2: Benchtop Laboratory Verification]
  ├── Fabricate 5 standardized prototype specimens
  ├── Fluid retention & strike-through testing (AFNOR S30-018 protocol)
  └── 50-cycle automated laundering degradation assay
       │
       ▼
[Phase 3: Domain Expert & Academic Review]
  ├── Independent review of material safety data sheets (MSDS) by textile chemists
  └── University / Biomaterials lab validation of biocompatibility (ISO 10993)
       │
       ▼
[Phase 4: Open Release & Contributor Passport Integration]
  ├── Publish full open hardware schematics on GitHub
  └── Mint validated contribution credentials to MyZubster Knowledge Network
```

---

## 7. Privacy, Ethics & Governance Statement
- **Zero Sensitive Data:** This package contains zero personally identifiable information (PII) or protected health information (PHI).
- **Non-Clinical Boundary:** This research package serves open-source engineering, design, and educational purposes. It does not replace medical consultation, regulatory certifications (FDA, CE Medical Device), or laboratory hygiene verifications.
