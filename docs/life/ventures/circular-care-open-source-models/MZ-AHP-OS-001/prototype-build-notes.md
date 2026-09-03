# MZ-AHP-OS-001 — Prototype Build Notes v0.3-draft

Status: `NON-COMMERCIAL PROTOTYPE / NOT HUMAN-USE VALIDATED`

These notes define a traceable first build sequence for bench prototypes. They are not manufacturing instructions for sale or human-use approval.

## Prototype classes

- `P0-STRUCTURAL`: geometry, layer order, fastening and assembly only; surrogate absorbent materials are allowed.
- `P1-FUNCTIONAL`: candidate absorbent and barrier materials may be used for bench testing after supplier documentation is available.
- `P2-QUALIFICATION`: reserved for later builds using reviewed materials, controlled assembly and an approved test plan.

No prototype should be described as safe for infant use until the relevant material, chemical, hygiene, fit and product-safety reviews have been completed.

## Minimum equipment

- clean cutting surface and templates derived from `dimensions.svg`;
- ruler/caliper;
- balance capable of recording component and finished-prototype mass;
- specimen labels or QR/lot labels;
- clean storage bags/containers;
- manufacturer-recommended tooling for any selected adhesive or fastening material;
- PPE and handling controls required by supplier documentation.

Avoid loose-powder handling for early prototypes. If loose pulp, SAP, adhesives or other industrial materials are introduced later, follow supplier SDS/instructions and qualified workplace controls.

## Build record

Create one record for every specimen:

```text
model: MZ-AHP-OS-001
version: 0.3-draft
prototypeClass: P0-STRUCTURAL | P1-FUNCTIONAL | P2-QUALIFICATION
specimenId: BD-<version>-<lot>-<nnn>
buildDate:
builder:
materialPassportRef:
BOMRef:
actualTotalMass_g:
notes:
```

## Assembly sequence

1. Assign the specimen ID before cutting materials.
2. Record source/lot evidence for every material actually used; unknown source data remains `NOT_VERIFIED`.
3. Cut the backsheet/barrier and outer nonwoven to the draft envelope.
4. Prepare the absorbent-core assembly inside the nominal core envelope. For P0 builds, a clearly identified surrogate sheet may be used rather than loose absorbent chemistry.
5. Add upper/lower core wraps if present in the chosen variant.
6. Place the acquisition/distribution layer over the core.
7. Add the topsheet and document its skin-facing orientation.
8. Add leg and waist elastic components only if their source, length and mass can be recorded.
9. Add fastening tabs and frontal landing zone.
10. Bond layers using the minimum practical adhesive for the selected prototype method; record actual adhesive mass when measurable.
11. Trim only after all changes are recorded.
12. Weigh the finished dry specimen and compare it with the draft target mass; do not overwrite the target with an estimate.
13. Photograph both sides and a layer-stack reference before destructive testing.
14. Store the specimen with its build record until testing.

## Draft mass objective

The v0.3 BOM carries a **36.0 g total allocated design target**, including 1.0 g of packaging allocation. This number is a design objective only, not a product specification or validated industry benchmark.

Actual prototype mass must be measured and stored separately as evidence.

## Prototype acceptance for bench testing

A specimen can enter internal bench screening when:

- its specimen ID is unique;
- all layers/components actually present are listed;
- actual mass and key dimensions are measured;
- unverified materials are visibly marked as such;
- there is no claim that it is safe for infant wear;
- the intended test protocol and disposal route are recorded.

## Human-use boundary

Do **not** conduct infant wear trials from this document. Human-use testing requires a separate qualified safety, ethics/consent, material and regulatory review appropriate to the jurisdiction and study design.