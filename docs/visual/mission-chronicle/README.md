# Visual #020 — Mission-to-Chronicle Renderer

This package turns canonical public evidence records into a bounded mission narrative without inventing progress between evidence states.

## Model

`MISSION / ISSUE → CONTRIBUTION / PR → REVIEW / MERGE EVIDENCE → RUNTIME EVIDENCE → CHRONICLE`

The renderer does **not** infer missing transitions. An issue is a mission proposal, a PR is a submitted contribution, a merge is repository acceptance, and runtime/deployment require separate evidence. Chronicle eligibility only means a record is suitable for evidence-linked storytelling; it does not upgrade its state.

## Canonical source

The view reads `../data/evidence.json`, the same dataset used by World State, Adoption Ladder and Chronicle. Records are grouped by evidence type and rendered with their existing `world_state`, `adoption_stage`, evidence link and note.

## Guardrails

- issue != implementation;
- PR != merge;
- merge != deployment;
- workflow definition != successful runtime;
- database/API record != physical truth;
- AI/narrative visual != evidence;
- token/reward != trust or identity;
- repository relationship != live integration;
- missing evidence is rendered as a gap, never filled by narrative inference.

## Provenance

Created 2026-08-23 on `zorgax/visual-hub` for Draft PR #616. Derived from the canonical Visual Hub evidence model and public GitHub links stored in `docs/visual/data/evidence.json`. This is `DOCUMENTATION_VISUAL`, not operational evidence.