# MyZubster Workshop Module v1

This module turns assisted technical diagnostics into auditable service events that can later connect to bounties, MYZ accounting, contributor reputation and optional metaverse/digital-twin views.

## Core workflow

`INTAKE -> DIAGNOSING -> DIAGNOSED -> REPAIRING -> VERIFIED -> CLOSED`

A workshop records facts and measurements. AI may suggest a diagnostic sequence, but AI output is advisory and is not itself proof that a component failed.

## Main objects

- **Workshop profile**: public metadata for a participating repair shop or technician node.
- **Service event**: vehicle/device, symptom, checks, measurements, outcome and evidence hashes.
- **Diagnostic checklist**: ordered tests for a model/symptom combination.
- **Contribution**: reusable repair knowledge submitted for review.
- **Bounty link**: optional connection to the MyZubster Bounty Platform Engine.
- **MYZ link**: only after a verified contribution produces a canonical internal ledger entry.
- **Reputation link**: only from reviewed, auditable events.

## Privacy and safety

Public service records should minimize personal data. Do not publish customer names, addresses, phone numbers, government ID, private keys, passwords, battery-pack secrets or unnecessary serial numbers. Lithium battery packs should only be opened by qualified personnel using appropriate procedures.

## Truth boundaries

A workshop is not considered a MyZubster partner, verifier or node merely because it appears in a demonstration. Participation status must be explicitly authorized. Likewise, `MYZ_RECORDED` is accounting evidence, not proof of fiat or blockchain settlement.

## Files

- `registry.json` — workshop/service-event bootstrap registry.
- `diagnostic-checklists.json` — reusable checklist bootstrap.
- `dashboard.html` — local/static prototype UI.
- `API.md` — future API contract.

The generic service-event schema is located at `schemas/service-event-v1.schema.json`.