# MyZubster Circular Care — Prototype Pack v0.3-draft

Status: `DESIGN_REFERENCE / NON-COMMERCIAL / NOT HUMAN-USE VALIDATED`

This pack advances the two open-source AHP reference models from geometry/material architecture toward a reproducible **bench-prototype workflow** while preserving evidence boundaries.

## Models

- `MZ-AHP-OS-001` — Circular Baby Diaper Reference Model
- `MZ-AHP-OS-002` — Circular Menstrual Pad Reference Model

## Complete v0.3 file set

Each model now contains:

```text
BOM.csv
material-passport.json
dimensions.svg
layer-stack.svg
packaging-spec.md OR wrapper-and-packaging-spec.md
prototype-build-notes.md
test-protocol.md
circular-flow.json
evidence-index.json
CHANGELOG.md
```

## Draft mass targets

These are **design targets only**, not measured masses, performance specifications or industry benchmarks.

| Model | Draft allocated target | Included packaging |
| --- | ---: | --- |
| Baby diaper | 36.00 g / functional unit | 1.00 g allocated primary packaging |
| Menstrual pad | 9.70 g / functional unit | 0.60 g release liner + 0.80 g wrapper + 0.35 g allocated outer packaging |

Actual measured component and prototype masses remain stored separately and must replace estimates in evidence records when physical specimens exist.

## Bench test package

The internal protocols define repeatable early screening for:

- dimensions and dry mass;
- comparative absorbency;
- acquisition time;
- rewet;
- visible leakage;
- wet structural integrity;
- diaper fastening integrity;
- pad garment-adhesive / wing integrity;
- wrapper/packaging observations;
- evidence gates for collection and treatment compatibility.

The screening fluid and loading conditions are project-specific draft methods. They are **not certification standards** and do not establish human-use safety or regulatory compliance.

## Prototype state machine

```text
DESIGN_REFERENCE
      ↓
P0-STRUCTURAL prototype
      ↓
P1-FUNCTIONAL bench prototype
      ↓
qualified evidence review
      ↓
PROTOTYPE_BUILT
      ↓
TESTED
      ↓
confirmed pilot scope
      ↓
PILOT_EVIDENCED
      ↓
verified treatment + outputs + destination
      ↓
VERIFIED_CIRCULAR_OUTCOME
```

No state transition is automatic. GitHub files, draft targets, diagrams and prototype intent are not sufficient evidence for later states.

## What still requires external / physical evidence

- selected material grades and supplier declarations;
- measured component masses;
- physical prototypes;
- qualified skin-contact / restricted-substance review;
- applicable hygiene / product-safety review;
- validated fit, comfort, leakage and performance methods;
- manufacturing feasibility and tolerances;
- confirmed collection route;
- treatment-operator acceptance;
- recovered-fraction measurement and quality;
- verified material destination/reuse;
- jurisdiction-specific labeling and market-access review;
- licensing/legal review before commercialization.

## Circularity boundary

The circular-flow schemas are designed to capture:

`design → product lot → supply → collection → transport → treatment → recovered fractions → verified destination`

A model must not be called recyclable or circular merely because its materials look theoretically recoverable. MyZubster records the evidence chain; circularity claims require real operational evidence.