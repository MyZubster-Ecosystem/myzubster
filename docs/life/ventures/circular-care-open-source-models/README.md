# MyZubster Circular Care — Open-Source AHP Reference Models v0.1

Status: **DESIGN_REFERENCE / NOT PRODUCTION-VALIDATED**  
Parent venture: `MZ-VENTURE-AHP-001` — MyZubster Circular Care  
Initial models:

- `MZ-AHP-OS-001` — Circular Baby Diaper Reference Model;
- `MZ-AHP-OS-002` — Circular Menstrual Pad Reference Model.

> These files are open design references for collaborative development. They are **not** certified products, medical claims, manufacturing authorizations, recycling guarantees or evidence of market compliance. Any real product requires qualified material selection, prototype testing, toxicological/skin-contact review where applicable, quality controls, labeling review and jurisdiction-specific market-access assessment before sale or distribution.

## 1. Goal

Create openly documented absorbent-hygiene product architectures that can be improved collaboratively while making circular-economy constraints visible from the beginning.

The target loop is:

```text
open design
   ↓
qualified materials
   ↓
prototype
   ↓
performance + safety validation
   ↓
manufacture / supply
   ↓
use
   ↓
separate collection
   ↓
traceable treatment batch
   ↓
verified recovered fractions
   ↓
verified destination / reuse
   ↓
public circularity evidence
   ↺
next design revision
```

The open-source layer documents the product architecture. MyZubster records provenance, versions, lots, evidence and circularity KPIs. Zorgax can assist with change tracking, test checklists and evidence completeness without converting unverified claims into facts.

## 2. Design principles

Every model should follow these principles:

1. **Material transparency first** — every layer must have an explicit material category, supplier evidence state and intended end-of-life route.
2. **Minimize unnecessary material diversity** — reduce combinations that make separation or recovery harder when performance and safety allow it.
3. **No circularity by assumption** — a material is not called recyclable, compostable or circular unless a real treatment route and output destination are evidenced for the intended geography.
4. **Performance before claims** — absorbency, leakage protection, fit, rewet and mechanical integrity need test evidence before publication as validated performance.
5. **Skin-contact safety gate** — fragrances, lotions, dyes and unnecessary additives are excluded by default from the reference model unless specifically justified and reviewed.
6. **Traceable versions** — each design revision receives a version and material-passport reference.
7. **Collection-aware design** — product, packaging and pilot collection instructions must be designed together.
8. **Evidence boundary** — prototypes, renders and BOMs show design intent; only test reports and traceable operational records establish verified outcomes.

## 3. Common layer architecture

The two initial disposable reference models share a documented layer vocabulary:

| Layer | Function | Circular-design objective |
| --- | --- | --- |
| topsheet | skin-facing liquid transfer | minimize additives; document polymer/fibre composition |
| acquisition/distribution layer | distribute fluid toward absorbent core | simplify composition where feasible |
| absorbent core | retain liquid | record pulp/SAP or alternative composition separately |
| tissue/core wrap | stabilize core | prioritize documented fibre source and treatment compatibility |
| backsheet | leakage barrier | document film/nonwoven composition and recovery route |
| fastening / wings | fit and positioning | minimize mixed-material complexity |
| elastic components | body fit where required | isolate in BOM and quantify mass |
| adhesive | bonding | minimize mass and document chemistry class |
| release liner | protects adhesive where used | prefer separable, clearly identified material |
| packaging | transport and hygiene | mono-material or otherwise demonstrably recoverable route preferred |

No exact material recipe is locked in v0.1. The purpose of this stage is to establish a transparent architecture that manufacturers, researchers and recyclers can refine with evidence.

## 4. Model A — MZ-AHP-OS-001 Circular Baby Diaper

Design intent:

- disposable baby diaper / nappy reference architecture;
- open BOM and material passport;
- fit system with documented elastics and fastening components;
- fragrance-free / lotion-free reference baseline unless a reviewed variant explicitly adds them;
- packaging linked to the same product/batch identifier;
- compatibility testing with the selected AHP collection/treatment route before any recycling claim.

Open design package should evolve to include:

```text
MZ-AHP-OS-001/
├── BOM.csv
├── material-passport.json
├── dimensions.svg
├── layer-stack.svg
├── packaging-spec.md
├── prototype-build-notes.md
├── test-protocol.md
├── circular-flow.json
├── evidence-index.json
└── CHANGELOG.md
```

## 5. Model B — MZ-AHP-OS-002 Circular Menstrual Pad

Design intent:

- disposable menstrual absorbent pad reference architecture;
- open BOM and material passport;
- pad body + optional wings represented as separately documented components;
- fragrance-free reference baseline;
- release liner and individual wrapper explicitly included in the circularity accounting rather than ignored;
- packaging and collection instructions designed as part of the product system;
- treatment compatibility demonstrated before recycling/recovery claims.

Open design package should evolve to include:

```text
MZ-AHP-OS-002/
├── BOM.csv
├── material-passport.json
├── dimensions.svg
├── layer-stack.svg
├── wrapper-and-packaging-spec.md
├── prototype-build-notes.md
├── test-protocol.md
├── circular-flow.json
├── evidence-index.json
└── CHANGELOG.md
```

## 6. Required prototype validation gates

Before a design can move from `DESIGN_REFERENCE` to `PROTOTYPE_VALIDATED`, the repository should contain or reference qualified evidence for the relevant tests.

Candidate gates include:

- dimensional and mass consistency;
- absorbency/capacity test method and result;
- acquisition speed where relevant;
- rewet / surface dryness;
- leakage performance;
- fit and fastening integrity;
- wet and dry structural integrity;
- packaging integrity and shelf/storage conditions;
- skin-contact material review appropriate to the target market;
- restricted-substance / chemical compliance review appropriate to the target market;
- microbiological and hygiene controls appropriate to manufacturing and storage;
- traceable lot identification;
- collection-container compatibility;
- treatment-route acceptance test;
- recovered-fraction evidence and destination evidence for any circularity claim.

A test is not considered passed merely because a design file includes a target value.

## 7. Material passport

Every material/component record should eventually contain at least:

```json
{
  "componentId": "example-component",
  "function": "topsheet",
  "materialFamily": "TO_BE_VALIDATED",
  "massPerUnit_g": null,
  "supplier": null,
  "supplierEvidenceRef": null,
  "skinContact": true,
  "additivesDeclared": [],
  "recoveryRoute": "NOT_VERIFIED",
  "treatmentEvidenceRef": null,
  "destinationEvidenceRef": null
}
```

Unknown values remain `null` or `NOT_VERIFIED`; they must not be guessed.

## 8. Circular-flow evidence model

Each real pilot lot should be able to connect:

```text
DESIGN VERSION
   ↓
PRODUCT LOT
   ↓
UNITS / MASS SUPPLIED
   ↓
AUTHORIZED COLLECTION SITE
   ↓
COLLECTED MASS
   ↓
REJECTED / RESIDUAL MASS
   ↓
TREATED MASS
   ↓
RECOVERED FRACTIONS
   ↓
DESTINATION / REUSE EVIDENCE
```

Core KPIs can then be calculated only where the denominator and evidence exist:

- collection rate;
- treatment yield;
- recovery yield by fraction;
- residual/rejected fraction;
- verified secondary-material output;
- verified destination/use rate;
- evidence completeness rate;
- product and packaging material mass per functional unit;
- cost per unit and per kilogram collected/treated where commercial evidence exists.

## 9. Open-source licensing proposal

Proposed starting model:

- hardware/product design files: **CERN-OHL-P-2.0**;
- documentation and diagrams: **CC BY-SA 4.0**;
- software/data schemas used by MyZubster/Zorgax: use the repository's applicable software license unless a dedicated license is explicitly added.

This is a project licensing proposal, not legal advice. Final licensing should be reviewed before external manufacturing or commercialization.

## 10. Contribution rules

A contribution may propose:

- alternative materials;
- lower-mass structures;
- alternative fastening systems;
- packaging simplification;
- collection improvements;
- treatment-compatible architectures;
- test methods;
- LCA/baseline methods;
- CAD/SVG patterns;
- verified supplier or treatment evidence.

Every PR must distinguish among:

- `DESIGN_IDEA`;
- `PUBLIC_CAPABILITY_EVIDENCED`;
- `PROTOTYPE_BUILT`;
- `TESTED`;
- `PILOT_EVIDENCED`;
- `VERIFIED_CIRCULAR_OUTCOME`.

No contributor should promote a design to a later state without supporting evidence.

## 11. Next build steps

1. choose the first baby-diaper size range and menstrual-pad use case;
2. create first BOM templates with component mass fields;
3. create vector layer-stack and dimension drawings;
4. request material declarations from candidate manufacturers;
5. identify the treatment route against which design-for-recovery will be evaluated;
6. build first non-commercial prototypes;
7. define test protocols before evaluating results;
8. add MyZubster material-passport and batch schemas;
9. publish verified findings and iterate the designs.

This v0.1 establishes the open architecture. It does not yet select a manufacturer, final materials, final dimensions or validated performance targets.