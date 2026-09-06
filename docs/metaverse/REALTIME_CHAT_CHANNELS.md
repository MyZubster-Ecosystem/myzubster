# Realtime Chat Channels

Tracking: Linear MYZ-80

## Data authority

Persistent MongoDB records are authoritative for channels and messages. Socket.IO is a delivery transport, not the source of truth.

Models:
- `ChatChannel`: direct or community channel metadata
- `ChatMessage`: persisted text messages with unique `(channelId, clientMessageId)` deduplication
- `CommunityMembership`: authoritative active membership used by HTTP and realtime authorization

## HTTP API

- `POST /api/chat/channels/direct`
- `POST /api/chat/channels/community`
- `POST /api/chat/channels/:channelId/messages`
- `GET /api/chat/channels/:channelId/messages?after=<timestamp>&limit=<n>`

All routes require the existing authenticated browser JWT.

## Realtime

Clients exchange the browser JWT through `POST /api/realtime/token`, connect to Socket.IO at `/realtime`, and subscribe to their own `user:{id}` channel. Active community members may also subscribe to `community:{id}`.

Message send event:

`chat.send { channelId, clientMessageId, body }`

Delivery event:

`chat.message { id, clientMessageId, channelId, senderUserId, body, createdAt }`

The server persists first and emits second. Reusing a `clientMessageId` for the same channel returns the existing message and does not emit it again.

## Moderation boundary

Every recipient is evaluated through `deliveryDecision()` before realtime emission. A block prevents a direct message from being persisted/delivered. Recipient mute suppresses delivery. Community messages can still persist for authorized senders while blocked/muted recipients are excluded from delivery.

## Attachment policy

This slice is text-only. Attachment delivery remains fail-closed until an explicit attachment-policy implementation exists.

## Deployment

The persistent HTTP state works in serverless environments. The `/realtime` Socket.IO transport still requires a long-lived Node runtime or compatible managed realtime service as documented in `REALTIME_GATEWAY.md`.
