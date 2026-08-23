# Visual #022 — Public Ecosystem Status Console

A compact evidence-first public status surface derived only from `../data/evidence.json`.

## Purpose

The console answers a narrow question: **what does the canonical public evidence dataset currently support?** It does not infer operational health, adoption, identity, payment, affiliation or physical-world truth.

The browser view groups canonical records by world state, adoption stage and source type, then exposes every underlying claim with its provenance link and boundary note.

## Semantics

- `PROPOSED` / `IN_REVIEW` describe repository process state, not implementation or deployment.
- `VERIFIED` means the bounded claim recorded in the dataset is supported by its linked source; it is not a global verification badge.
- adoption stages remain capped by their source. Discovery, interest and contribution do not imply integration, deployment or verified adoption.
- source counts are inventory, not popularity or usage metrics.
- a status console is a projection of evidence, not a monitoring system.

## Canonical input

`docs/visual/data/evidence.json`

No second status database is introduced. World State, Adoption Ladder, Chronicle, Character Registry, Mission-to-Chronicle, Evidence Monitor and this console remain projections over the same canonical model.

## Guardrails

```text
ISSUE != IMPLEMENTATION
PR != MERGE
MERGE != DEPLOYMENT
WORKFLOW != SUCCESSFUL RUNTIME
DATABASE/API RECORD != PHYSICAL TRUTH
VISUAL/AI NARRATIVE != EVIDENCE
TOKEN/REWARD != TRUST OR IDENTITY
REPOSITORY RELATIONSHIP != LIVE INTEGRATION
STATUS PROJECTION != SYSTEM HEALTH
```

## Review

Human review remains required before merge. The console performs no writes and no automatic evidence promotion/demotion.