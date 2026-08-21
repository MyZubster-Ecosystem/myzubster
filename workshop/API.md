# Workshop Module API Contract (proposal)

This is a transport-agnostic contract for a future MyZubster workshop service. It does not imply that a production API is already deployed.

## Proposed endpoints

- `POST /workshops` — register a workshop profile after authorization.
- `GET /workshops/:id` — retrieve public workshop metadata.
- `POST /service-events` — create a service event.
- `GET /service-events/:id` — retrieve an event subject to visibility rules.
- `POST /service-events/:id/checks` — append a performed diagnostic check.
- `POST /service-events/:id/evidence` — attach a hash/reference to non-sensitive evidence.
- `POST /service-events/:id/diagnosis` — record technician diagnosis.
- `POST /service-events/:id/outcome` — record repair outcome.
- `POST /service-events/:id/contributions` — propose reusable knowledge for review.
- `POST /service-events/:id/bounty-link` — connect a contribution to a Bounty Platform Engine record.

## Event requirements

Each service event should validate against `schemas/service-event-v1.schema.json` and preserve an append-only history of material state changes.

## Authorization

Workshop write operations require an authenticated workshop identity. Public reads must expose only fields whose publication has been authorized by the relevant consent record.

## Evidence

Evidence objects should prefer hashes and stable references. Raw customer media should not be public by default. Every evidence item should declare visibility, origin and hash when possible.

## Integrations

### Bounty Engine

A reviewed reusable diagnostic contribution can create or reference a bounty instance. The service event itself does not automatically earn MYZ.

### MYZ Ledger

Only verified bounty/contribution outcomes may generate a ledger reference. The workshop module stores `ledger_entry_id`; it must not duplicate or invent ledger balances.

### Reputation

Reputation events derive from verified outcomes, not from self-declared expertise or volume of unreviewed repairs.

### Metaverse / digital twin

A visual workshop/vehicle representation may resolve a service-event identifier, but the canonical record remains the signed/hashed service data rather than the 3D representation.