# Visual #018 — Evidence Provenance Inspector

This interactive view reads the canonical `docs/visual/data/evidence.json` dataset and lets reviewers trace each visual claim to its public source.

## Provenance fields

Each rendered record exposes:

- record ID and date;
- evidence type;
- World State;
- Adoption stage;
- optional Character state;
- bounded claim text;
- public evidence label and URL;
- interpretation limit / guardrail.

## Rule

A source proves only what that source can support. An issue can prove that a proposal or invitation was published. An open PR can prove that code or documentation was submitted. A workflow file can prove that deployment logic exists. None of those facts automatically proves merge, runtime health, physical deployment, settlement, affiliation or adoption.

The inspector is therefore a provenance viewer, not a certification engine.
