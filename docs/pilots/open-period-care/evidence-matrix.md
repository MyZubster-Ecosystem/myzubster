# Evidence Matrix — Open Period Care Pilot

> **Pilot Reference:** [#1399](https://github.com/MyZubster-Ecosystem/myzubster/issues/1399) · **Bounty Reference:** [#1450](https://github.com/MyZubster-Ecosystem/myzubster/issues/1450)

## Overview & Methodology
This matrix establishes an empirical, traceable link between user observations, verifiable scientific literature / technical standards, and derived product engineering requirements.

Each requirement is categorized into an explicit **Evidence State**:
- `PROPOSED`: Functional hypothesis formulated from user observation.
- `SUPPORTED`: Validated by peer-reviewed research or published engineering standards.
- `TESTED`: Subjected to preliminary simulation or empirical workbench testing.
- `VERIFIED`: Formally confirmed through accredited third-party laboratory assay or domain expert review.

---

## Traceability Table

| Requirement ID | Observation / User Need | Empirical Source / Standard | Derived Technical Requirement | Evidence State | Verification & Testing Method | Safety & Privacy Impact |
|---|---|---|---|---|---|---|
| **REQ-MAT-01** | Contact dermatitis and sweating from synthetic topsheets | S3: Weir (2015) / S5: GOTS v7.0 | Top wicking layer must use 100% certified organic unbleached cotton or eucalyptus lyocell with zero bleaches, optical brighteners, or artificial fragrance. | `SUPPORTED` | GOTS transaction certificate audit + ISO 10993-10 irritation/sensitization testing. | Eliminates VOC/dioxin exposure risks on mucosal skin surfaces. |
| **REQ-ABS-02** | Leakage during heavy flow and fluid compression strike-through | S1: van Eijk et al. (2019) / S6: AFNOR S30-018 | Absorbent core must provide >= 25 ml liquid uptake capacity and maintain < 0.1 g rewet under 2.0 kPa static compressive pressure. | `PROPOSED` | AFNOR SPEC S30-018 liquid retention workbench rig with artificial menstrual test fluid. | Prevents sudden fluid breakthrough under active movement. |
| **REQ-BAR-03** | Fluid side-seepage while avoiding moisture entrapment & odor | S4: ISO 10993-5 / S6: AFNOR S30-018 | Outer leakproof barrier must utilize medical-grade breathable TPU film (<= 30 µm) with MVTR >= 3000 g/m²/24h laminated with solvent-free hot-melt adhesive. | `SUPPORTED` | Hydrostatic head water column (>= 5000 mm) & ASTM E96 water vapor transmission testing. | Maintains aerobic microclimate; prevents bacterial proliferation. |
| **REQ-DUR-04** | Degradation, delamination, and stiffness after repetitive domestic washings | S2: Peberdy et al. (2019) / S6: AFNOR S30-018 | Textile assembly and structural flatlock stitching must retain dimensional stability (<= 5% shrinkage) and baseline absorbency over >= 50 laundering cycles at 40°C. | `SUPPORTED` | Accelerated 50-cycle home laundering test protocol with pre/post dimensional and mass balance tracking. | Ensures circular economy lifespan and cost-effectiveness. |
| **REQ-DSG-05** | Pad shifting and bulkiness across varying anatomical underwear styles | Community Survey Feedback (#1399) / S1: van Eijk et al. (2019) | Dual-snap modular wing fastening system with hypoallergenic OEKO-TEX POM polyacetal snaps accommodating gusset widths from 5.5 cm to 8.5 cm. | `PROPOSED` | Anatomical mannequin fit assessment across multiple standardized posture profiles. | Zero metallic skin contact; prevents chafing. |

---

## Epistemological Demarcation

1. **Anecdotes & Community Feedback:** Captured exclusively as functional desires (e.g. "softer feel", "no side leaks").
2. **Scientific Evidence:** Derived exclusively from peer-reviewed journals (Lancet, Sustainability, J. Environ Health) and international standards (ISO, GOTS, AFNOR).
3. **Engineering Requirements:** Quantifiable engineering tolerances (e.g. MVTR >= 3000, absorbency >= 25 ml, pressure retention at 2.0 kPa).
4. **Safety & Privacy Safeguards:** Complete exclusion of participant health records or personal identifiers.
