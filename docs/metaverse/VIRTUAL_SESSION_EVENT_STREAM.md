# Virtual Session Event Stream

This document defines the serverless-compatible state-change transport for MYZ-88.

## Endpoint

`GET /api/metaverse/sessions/:id/events?after=<lifecycleVersion>&limit=<1..100>`

The endpoint returns durable MongoDB-backed session events ordered by `sequence`. The `cursor` in each response is the last observed lifecycle version and can be supplied as `after` on the next poll.

## Event types

- `session_created`
- `session_started`
- `participant_joined`
- `participant_left`
- `session_ended`

## Public payload boundary

Events expose only:

- event ID
- session ID
- room ID
- lifecycle sequence
- event type
- authoritative session state
- aggregate participant count
- scene manifest version
- timestamp

The stream does not expose participant user IDs, host user IDs, auth tokens, authorization headers, chat content or movement history.

## Reliability model

The event collection is persistent and shared across serverless instances. Writes use `(sessionId, sequence)` as an idempotency key, so retries do not create duplicate lifecycle events. Consumers resume from a numeric cursor rather than relying on one in-memory connection.

Events are retained for seven days. If MongoDB is unavailable, the endpoint returns an explicit unavailable/degraded response and recommends retry rather than silently falling back to volatile memory.

This is intentionally polling-compatible. WebSockets or SSE may be layered on top later, but they must consume the same authoritative persisted event history rather than becoming a separate source of truth.
