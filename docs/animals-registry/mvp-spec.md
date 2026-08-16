# Animals Registry — MVP Specification

## Purpose
Define a synthetic-data MVP for a digital, auditable animal registry.

## Data model

### Animal
- `id`: application UUID
- `species`: controlled string
- `breed`: optional string
- `sex`: controlled value
- `birthDate`: optional ISO date
- `status`: `active | missing | found | deceased | archived`
- `microchipId`: optional unique identifier
- `createdAt`, `updatedAt`: timestamps

### Keeper
- `id`: application UUID
- `displayName`: synthetic label only in MVP
- `contactRef`: synthetic reference, never raw personal data

### AnimalEvent
- `id`: event UUID
- `animalId`
- `type`: `registered | transferred | reported_missing | reported_found | deceased | updated`
- `actorId`
- `occurredAt`
- `metadata`: non-sensitive event metadata

## Roles
- `operator`: create/update permitted registry fields and report events.
- `reviewer`: verify sensitive state transitions and close review workflows.
- `admin`: manage configuration and access; administrative actions are audited.

## Audit
Every create, update, transfer, status change, and permission-sensitive action must create an append-only audit event. The pilot must expose an integrity verification endpoint or equivalent test.

## Privacy
The MVP uses synthetic data only. Do not store real owner names, addresses, phone numbers, veterinary records, or government identifiers. Any future real-data integration requires a separate legal, security, data-minimization, retention, and access-control review.

## API outline
- `POST /animals`
- `GET /animals`
- `GET /animals/:id`
- `PATCH /animals/:id`
- `POST /animals/:id/events`
- `GET /animals/:id/events`
- `GET /audit/verify`

## Test scenarios
1. Register an animal with synthetic data.
2. Reject duplicate microchip identifiers.
3. Search/filter animals by species and status.
4. Record missing/found transitions.
5. Enforce operator/reviewer permissions.
6. Verify audit integrity after mutations.
7. Confirm no real personal data appears in fixtures.
