# Visual #021 — Evidence Freshness / Contradiction Monitor

This view audits the canonical `../data/evidence.json` without upgrading any claim. It surfaces record age, source type, current evidence-bounded state, and possible internal contradictions that require human review.

## What it can prove

The monitor can prove only what is present in the canonical dataset and whether records disagree with each other under explicit deterministic checks.

It does **not** prove that an external URL is still live, that a PR merged, that a deployment is healthy, that a payment settled, or that a physical-world event occurred. Those transitions require fresh source verification before the canonical record is changed.

## Freshness semantics

Freshness is a review signal, not a truth score:

- `CURRENT` — record date is within 7 days of the dataset generation date.
- `AGING` — 8–30 days old.
- `STALE` — more than 30 days old.
- `UNKNOWN` — missing or unparsable date.

A stale record may remain historically true. It simply deserves re-verification before being used for a current-state claim.

## Contradiction checks

The browser performs conservative internal checks only:

- duplicate record IDs;
- missing evidence URL/label;
- state values outside the canonical vocabulary;
- `DEPLOYED` / `DEPLOYMENT` / `VERIFIED_ADOPTION` claims sourced only by an issue or pull request;
- records whose notes explicitly say `not merged` while their world state is stronger than `IN_REVIEW`;
- Chronicle records missing a public evidence URL.

A flagged contradiction is a **review requirement**, not an automatic correction.

## Guardrails

`fresh != true` · `stale != false` · `issue != implementation` · `PR != merge` · `workflow != runtime` · `API/database record != physical truth` · `visual/AI narrative != evidence` · `token/reward != trust or identity` · `repository relationship != live integration`.

## Provenance

Canonical input: `docs/visual/data/evidence.json` on this branch. Human review remains required before changing evidence state or merging the Visual Hub.