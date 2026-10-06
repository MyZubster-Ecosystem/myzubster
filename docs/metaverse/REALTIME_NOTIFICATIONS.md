# Realtime Notifications

Linear: MYZ-81

## Contract

Notifications are durable MongoDB state first and realtime delivery second.

Supported notification types:
- `follow`
- `community`
- `message`
- `session`

Supported categories:
- `social`
- `community`
- `message`
- `session`

Each notification contains an internal `deepLink` beginning with `/` and a per-user `dedupeKey`.

## Realtime events

Connected users receive notifications on their existing `user:{id}` realtime channel.

- `notification.created`
- `notification.read`

Reconnect does not create new durable notification rows. Clients reload canonical state from `GET /api/notifications` and use realtime only for incremental delivery.

## API

- `GET /api/notifications`
- `GET /api/notifications?unreadOnly=true`
- `POST /api/notifications/:notificationId/read`
- `PUT /api/notifications/preferences/:category`

## Message notifications

A newly persisted chat message creates notifications only for recipients allowed by block/mute delivery policy. The dedupe key is derived from the persisted message ID, so retrying a client message cannot create another durable notification.

## Preferences

Category preferences are hooks for in-product delivery. Categories default to enabled until a user explicitly disables one.

## Safety and privacy

Notification payloads should contain routing/context identifiers needed by the product surface, not auth tokens, private keys, raw credentials or message bodies. Deep links are restricted to internal product paths.
