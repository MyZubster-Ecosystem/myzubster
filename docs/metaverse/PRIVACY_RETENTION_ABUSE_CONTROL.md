# MyZubster Metaverse privacy, retention and abuse-control baseline

Status: initial production baseline  
Applies to: MyZubster Neon Plaza and the `/api/metaverse/*` routes  
Tracking: Linear MYZ-41

## Principles

MyZubster collects and retains only the data required to operate the shared world safely. The Metaverse must not store credentials, private keys, authorization tokens, permanent movement history or unnecessary personal data.

A public character is not proof of a person's identity. Only characters linked through the authenticated MyZubster account flow may use the `account-linked` identity status.

## Current production behavior

### Presence

Active presence is stored in MongoDB so stateless Vercel instances can share the same world state.

- Presence expires 90 seconds after the last successful activity.
- Each sync or supported action renews the expiry.
- Leaving deletes the active presence record.
- MongoDB has a TTL index for eventual cleanup.
- Movement is represented only by the latest coordinates; the API does not maintain a movement-history feed.

### Chat

Recent public chat is retained for one hour.

- Messages are limited to 280 sanitized characters.
- MongoDB assigns each message an explicit expiry and removes it through a TTL index.
- Sync returns no more than 40 messages.
- Chat content, request bodies and session identifiers are excluded from operational request logs.
- Chat is public within the shared world and must not be treated as a private messaging channel.

### Public character and presence fields

The shared world may expose:

- generated session identifier;
- display and character names;
- archetype and identity status;
- public MyZubster character identifier;
- public GitHub login and profile URL for an account-linked character;
- current coordinates, active emote and join time.

The shared-world response must not expose account database IDs, email addresses, tokens, IP addresses, private profile fields or stored authentication material.

### Operational logs

Metaverse request logs may contain only the HTTP method, route path, response status, rounded duration and a slow-request flag. Error reporting may contain a bounded error name and code.

Logs must not include request bodies, query strings, chat text, authorization headers, tokens, session identifiers or unnecessary personal data.

## Abuse controls currently active

- Server-side allowlists for archetypes and emotes.
- Input sanitization and bounded field lengths.
- Session-based minimum intervals for movement, chat and emotes.
- World-capacity enforcement.
- Authenticated accounts cannot silently fall back to guest identity.
- Account-linked characters are resolved from the authenticated user record; client identity claims are ignored.

These controls reduce accidental flooding but are not a complete distributed moderation system.

## Distributed rate-limit configuration

Production rate-limit subjects are pseudonymized with HMAC-SHA256 before they are stored. Configure a dedicated `METAVERSE_RATE_LIMIT_SECRET`; when it is absent, the backend may reuse `JWT_SECRET`. A connected production database without either secret fails the protected request instead of storing a raw client address or session identifier in the rate-limit collection.

MongoDB counters use fixed, expiring windows shared by all serverless instances. The local in-memory fallback exists only for development and isolated tests without MongoDB.

## Required next controls

Before the Metaverse is promoted beyond the current MVP baseline, implement and test:

1. distributed rate limits for join, sync, chat and emote routes;
2. duplicate-message and burst-spam detection;
3. mute and block controls enforced in all relevant responses;
4. a user-report workflow with a bounded reason and no sensitive attachments by default;
5. authenticated moderator roles, documented actions and minimal audit records;
6. an appeal and correction path;
7. account-linked and guest deletion procedures;
8. an incident-response owner, rollback procedure and evidence checklist.

Until these controls exist, the project must not claim that automated moderation, distributed abuse prevention or private chat is available.

## Deletion and incident handling

Deletion requests must use an authenticated account workflow when an account exists. Guest deletion requires a narrowly scoped, time-limited proof tied to that guest session; public names alone are insufficient authorization.

During a safety incident, operators should preserve only the minimum evidence needed to investigate, restrict access to that evidence, record the reason and retention deadline, and remove it when the deadline expires. Credentials, tokens and private keys must never be requested as evidence.

## Verification checklist

- Confirm the presence and chat TTL indexes exist in production.
- Confirm the health endpoint reports the configured retention values without exposing player or message content.
- Exercise two normal accounts and one synthetic abuse scenario.
- Verify 429 responses for configured limits.
- Verify blocked content is consistently filtered from chat and presence views.
- Inspect production logs for accidental identifiers or message content.
- Record the test date, deployment commit and reviewer in MYZ-41.
