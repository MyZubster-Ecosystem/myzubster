# MZ-AHP-OS-001 — Packaging Specification v0.3-draft

Status: `DESIGN_REFERENCE / NOT PRODUCTION-VALIDATED`

This specification defines the packaging system to be prototyped with the Circular Baby Diaper reference model. It is not a packaging-compliance approval, recycling claim or shelf-life validation.

## Baseline system

The v0.3 baseline uses **no individual wrapper**. Diapers are grouped in a primary flexible pack so unnecessary packaging mass is not added by default.

| Element | Candidate architecture | Draft target | Evidence state |
| --- | --- | ---: | --- |
| Primary flexible pack | PE or PP mono-family flexible film where feasible | 1.0 g allocated per diaper | `DESIGN_TARGET_NOT_VALIDATED` |
| Print / label | minimum practical ink/label area; exact chemistry declared | not fixed | `NOT_VERIFIED` |
| Closure | heat seal or other manufacturer-qualified closure | not fixed | `NOT_VERIFIED` |

The 1.0 g value is an **allocated design target**, calculated per functional unit for circularity accounting. It is not a measured package mass.

## Required package information

A prototype package should expose or encode:

- model ID: `MZ-AHP-OS-001`;
- design version;
- prototype lot ID;
- nominal size / geometry reference;
- material declaration reference;
- manufacturing / assembly evidence reference when available;
- storage conditions supplied by the qualified material or manufacturing source;
- disposal / collection instructions only when a real route has been confirmed;
- QR or equivalent link to the MyZubster material-passport/evidence record where practical.

## Circular-design rules

1. Packaging mass is always counted in the functional-unit material balance.
2. Prefer one declared polymer family when product protection and qualified manufacturing allow it.
3. Do not print a recycling symbol or circularity statement merely because the candidate film is PE or PP.
4. A local collection/recycling instruction requires evidence for the actual geography and waste stream.
5. Inks, coatings, labels, adhesives and closures must be declared rather than treated as mass-free.
6. Package changes require a new version or change record.

## Prototype checks

Before a packaging revision is promoted beyond design reference, record:

- pack mass and mass per contained unit;
- dimensions and count per pack;
- seal integrity screening;
- basic handling/drop observations;
- product cleanliness/protection observations;
- material declaration from the selected packaging supplier;
- confirmed treatment or collection compatibility if any recovery claim is proposed.

## Claim boundary

`packaging-spec.md` describes design intent only. It does not establish food/contact compliance, child safety, shelf life, recyclability, compostability, environmental benefit or market compliance.