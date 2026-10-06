# Realtime Presence Contract

Tracking: Linear MYZ-79

## Purpose

Presence is ephemeral operational state for connected users. It is not permanent user history and must not be treated as durable activity tracking.

## Protocol

Authenticated realtime clients can use:

- `presence.join` with an authorized `user:*`, `community:*`, or `session:*` channel
- `presence.heartbeat` to refresh membership TTL
- `presence.leave` to explicitly leave
- `realtime.resume` with `presenceChannels` to restore presence after reconnect

Presence expires after 90 seconds without refresh.

## Redis-backed production mode

Set `REDIS_URL` for distributed presence across realtime workers.

Redis stores connection-level membership with TTL and channel-scoped sorted sets. Multiple tabs/devices for the same user collapse into one logical channel membership. A logical `presence.leave` is emitted only after the user's final active connection for that channel disappears.

When `REDIS_URL` is configured but Redis is unavailable, presence operations fail closed. The gateway does not silently switch to process-local state because that would create inconsistent cross-worker membership.

## Local development fallback

When `REDIS_URL` is not configured, the service uses an explicitly reported `local-fallback` mode. This is suitable for single-process development and tests only; it is not a distributed production presence store.

The current presence mode is included in `realtime.ready` and presence join acknowledgements.

## Privacy and moderation

Presence snapshots are filtered through the existing interaction policy. Users blocked or muted under that policy are suppressed from the viewer's returned presence snapshot.

No movement history, chat content, auth tokens, or permanent session history are stored by the presence service.

## Failure and cleanup

Connection records carry a 90-second TTL. If a worker dies before an explicit disconnect can be processed, Redis expiry removes stale connection membership. Channel indexes are pruned against expiration timestamps on presence operations.
