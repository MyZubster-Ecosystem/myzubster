# Visual #007 — World State / Evidence Ledger

This package defines the evidence-first state layer for MyZubster GitHub Visual.

## State vocabulary

- `PROPOSED` — idea, issue, submitted character or planned change.
- `IN_REVIEW` — open PR or review process; not accepted yet.
- `VERIFIED` — the linked public source supports the specific claim shown.
- `DEPLOYED` — requires separate runtime/deployment evidence; merge alone is insufficient.
- `NOT_VERIFIED` — evidence is missing, insufficient or contradictory.

## Canonical rule

A visual state may never be stronger than its evidence source.

Examples:

- issue opened → `PROPOSED`, not completed;
- draft PR → `IN_REVIEW`, not accepted;
- merged code → verifies merge, not external payment or production deployment;
- AI-generated illustration → narrative asset, never evidence;
- runtime deployment → `DEPLOYED` only when a public runtime/deployment source supports it.

## Files

- `index.html` — interactive ledger UI
- `ledger.json` — static evidence records
- `script.js` — search/filter rendering
- `styles.css` — cyberpunk visual layer

The initial ledger records only facts that were directly checked against public GitHub sources on 2026-08-22. It is intentionally conservative and can be expanded by Zorgax as evidence is verified.
