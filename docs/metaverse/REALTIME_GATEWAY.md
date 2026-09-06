# MyZubster Realtime Gateway

Tracking: Linear MYZ-78

## Transport

The backend HTTP server mounts a Socket.IO gateway on `/realtime` with WebSocket preferred and HTTP polling fallback. Socket.IO heartbeat is configured with a 25s ping interval and 20s timeout.

## Authentication

Authenticated browser clients obtain a dedicated 5-minute realtime token from:

`POST /api/realtime/token`

The realtime token is separate from the browser JWT and is scoped with purpose `myzubster-realtime`, issuer `myzubster-backend`, audience `myzubster-realtime`, user id, role and a correlation id.

Expired, malformed or wrong-purpose tokens are rejected during the socket handshake.

## Channels

Supported channel names are:

- `user:{id}`
- `community:{id}`
- `session:{id}`

Authorization is evaluated server-side for every subscribe and resume operation.

Current authority boundaries:

- `user:{id}`: owner or admin only.
- `session:{id}`: participant, host or admin only, using the server-authoritative `VirtualSession` state.
- `community:{id}`: fail-closed for normal users until MYZ-80 provides an authoritative community membership model. Admin access is supported for operational moderation.

## Reconnect

Clients can send `realtime.resume` with their previous channel list. Every channel is re-authorized before it is restored. The gateway itself does not mutate presence records, so reconnecting cannot duplicate presence state.

## Observability

The token endpoint and socket handshake share a correlation id. `realtime.ready` returns the connection id, correlation id and heartbeat settings. Connection counters and structured metrics remain follow-up work in MYZ-83.

## Deployment note

This gateway requires a long-lived Node HTTP server capable of WebSocket upgrades. The current Vercel serverless frontend/API deployment is not treated as the authoritative WebSocket host. Production deployment must use a compatible persistent runtime or managed realtime service while preserving this authentication and authorization contract.
