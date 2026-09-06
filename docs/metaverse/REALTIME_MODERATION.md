# Realtime moderation contract

MYZ-82 completes the realtime enforcement layer on top of MYZ-78 (authenticated realtime gateway) and MYZ-80 (persistent DM/community messaging).

## Immediate block/mute enforcement

Every non-duplicate message is evaluated against `deliveryDecision()` immediately before persistence/delivery. Because interaction controls are read from MongoDB for each send, a block or mute takes effect on the next delivery attempt without requiring a socket reconnect.

User control changes emit `moderation.control_changed` to `user:{ownerUserId}` and `user:{targetUserId}` so connected clients can refresh UI state immediately.

## Moderator actions

`POST /api/moderation/actions` remains server-authoritative and requires `admin` or `moderator`. Successful privileged actions are written to `ModerationEvent` and, when a target user exists, the affected realtime user channel receives:

```text
moderation.action
```

The realtime payload contains only the action, bounded context identifiers, audit event id and timestamp. The audit store remains authoritative; the socket event is delivery only.

## Abuse controls

Messaging uses a MongoDB-backed burst limit of 12 persisted messages per 10-second rolling window per sender. Duplicate retries identified by `(channelId, clientMessageId)` are returned idempotently before rate-limit evaluation.

Reports retain the existing burst limit of 5 reports per 60 seconds per reporter.

## Safety properties

- persistent MongoDB state is authoritative;
- Socket.IO is not a source of truth;
- block/mute policy is checked on every delivery attempt;
- moderator actions require server-side role checks;
- privileged actions are audit logged;
- realtime events contain no tokens or private authentication material;
- attachment delivery remains outside this slice and fail-closed.
