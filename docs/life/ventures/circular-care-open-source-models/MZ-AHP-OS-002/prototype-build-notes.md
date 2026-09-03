# MZ-AHP-OS-002 — Prototype Build Notes v0.3-draft

Status: `NON-COMMERCIAL PROTOTYPE / NOT HUMAN-USE VALIDATED`

These notes define a traceable first build sequence for bench prototypes. They are not manufacturing instructions for sale or approval for menstrual use.

## Prototype classes

- `P0-STRUCTURAL`: geometry, wings, wrapper/release-liner and layer order; safe surrogate absorbent sheet may be used.
- `P1-FUNCTIONAL`: candidate absorbent/barrier/adhesive materials for bench screening after source documentation is available.
- `P2-QUALIFICATION`: reserved for later controlled builds using reviewed materials and a qualified test plan.

No prototype should be described as safe for human use until the relevant skin-contact, chemical, hygiene, product-safety and regulatory reviews are complete.

## Minimum equipment

- clean cutting surface and templates derived from `dimensions.svg`;
- ruler/caliper;
- balance capable of measuring components and finished specimens;
- specimen labels / QR or lot labels;
- clean storage bags or containers;
- clean fabric coupons for garment-adhesive bench tests;
- manufacturer-recommended tooling for selected adhesives/materials;
- PPE and handling controls required by supplier documentation.

Avoid uncontrolled loose-powder handling in early builds. If loose absorbent powders, adhesives or industrial chemicals are used later, follow supplier SDS/instructions and qualified workplace controls.

## Build record

```text
model: MZ-AHP-OS-002
version: 0.3-draft
prototypeClass: P0-STRUCTURAL | P1-FUNCTIONAL | P2-QUALIFICATION
specimenId: MP-<version>-<lot>-<nnn>
buildDate:
builder:
materialPassportRef:
BOMRef:
actualPadMass_g:
actualReleaseLinerMass_g:
actualWrapperMass_g:
notes:
```

## Assembly sequence

1. Assign the specimen ID before cutting materials.
2. Record source/lot evidence for every material actually used.
3. Cut the barrier backsheet to the draft 240 mm body envelope including the selected wing variant.
4. Prepare the absorbent core inside the nominal 205 × 65 mm envelope. For P0 builds use a clearly marked surrogate sheet if qualified absorbent material is not yet available.
5. Add lower/upper core wraps if present.
6. Add the acquisition/distribution layer.
7. Add the topsheet and document body-facing orientation.
8. Bond the body layers using the minimum practical adhesive for the prototype method; record actual adhesive mass when measurable.
9. Add wings if included in the variant.
10. Apply garment adhesive only on the garment-facing side using the chosen documented pattern.
11. Apply the release liner and verify it covers adhesive areas without exposing tack.
12. Add the individual wrapper for packaging-system prototypes.
13. Measure and record actual pad, liner and wrapper masses separately.
14. Photograph both sides, the layer stack and wrapped state before destructive testing.

## Draft mass objective

The v0.3 BOM carries a **9.70 g total allocated design target**, including 0.60 g release liner, 0.80 g individual wrapper and 0.35 g allocated outer packaging.

This is `DESIGN_TARGET_NOT_VALIDATED`, not a product specification or industry performance benchmark.

## Prototype acceptance for bench testing

A specimen can enter internal screening when:

- specimen ID is unique;
- all actual layers/components are listed;
- actual masses and main dimensions are recorded;
- unverified materials remain marked `NOT_VERIFIED`;
- no claim of human-use safety or menstrual performance is made;
- test protocol and disposal route are recorded.

## Human-use boundary

Do **not** conduct human wear or skin-contact trials from this document. Such testing requires a separate qualified safety, ethics/consent, material and regulatory review appropriate to the jurisdiction and study design.