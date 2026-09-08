# Realtime observability and reliability baseline

This runbook covers the authenticated Socket.IO gateway at `/realtime`. It complements `METAVERSE_OBSERVABILITY.md`, which covers the legacy Neon Plaza HTTP/SSE surface.

The realtime system persists chat messages and in-product notifications in MongoDB before attempting live fan-out. Redis is used for distributed presence when configured. Operational metrics are aggregate-only and structured log references are irreversible 12-character SHA-256 prefixes; tokens, message bodies, usernames, user IDs and raw socket/session/message identifiers are not logged.

## Metrics endpoint

Administrators can query:

```text
GET /api/realtime/metrics
Authorization: Bearer <admin access token>
```

The endpoint is non-cacheable and exposes:

- connection attempts, successes, authorization rejections, recoveries and disconnects;
- resume attempts, successes and failures;
- message attempts, durable writes, duplicates, failures and live fan-out attempts;
- notification attempts, durable writes, duplicates, preference skips, live emits and failures;
- Redis failures and bounded-queue admissions/rejections;
- active connections, operations in flight and queue depth;
- p50, p95, p99, maximum and average processing/queue durations;
- SLO evaluations and alert candidates.

The counters are process-local and reset when the worker restarts. A production monitor must scrape and aggregate them outside the worker before using them for longer reporting windows.

## Vercel Fluid Compute runtime

The public deployment routes `/realtime` and `/api/realtime/*` to `api/realtime.js`. That entrypoint exports a Node HTTP server, attaches Socket.IO once per warm Vercel Function instance and waits for MongoDB readiness before accepting HTTP or WebSocket work.

Verify the unauthenticated runtime without exposing operational metrics:

```text
GET /api/realtime/health
```

The health response reports the Socket.IO path and configured presence mode. It does not expose counters, identifiers or latency samples. `/api/realtime/metrics` remains restricted to administrators.

Vercel Functions can create multiple instances and future connections are not guaranteed to reach the same instance. Configure `REDIS_URL` before treating presence as distributed, and add the Socket.IO Redis adapter before treating room fan-out as cross-worker. Connections are also bounded by the Vercel Function maximum duration, so clients must reconnect and call `realtime.resume`.

## Initial SLOs

| Path                      | Default target | Environment override                    |
| ------------------------- | -------------: | --------------------------------------- |
| Socket connection success |       >= 99.5% | `REALTIME_SLO_CONNECTION_SUCCESS`       |
| Resume processing success |       >= 99.0% | `REALTIME_SLO_RESUME_SUCCESS`           |
| Message persistence       |       >= 99.9% | `REALTIME_SLO_MESSAGE_PERSISTENCE`      |
| Notification persistence  |       >= 99.9% | `REALTIME_SLO_NOTIFICATION_PERSISTENCE` |
| Message processing p95    |      <= 500 ms | `REALTIME_SLO_MESSAGE_P95_MS`           |

An evaluation remains `null`, rather than passing, until the process has observed at least one relevant attempt. Any failed SLO, Redis failure or rejected queue admission appears in the `alerts` array.

## Backpressure

Durable chat operations and subscription resume work pass through a process-local bounded gate:

- concurrent operations: `REALTIME_MAX_CONCURRENT_OPERATIONS` (default `64`);
- waiting operations: `REALTIME_MAX_QUEUED_OPERATIONS` (default `256`);
- notification write batch: `REALTIME_NOTIFICATION_BATCH_SIZE` (default `20`).

When the queue is full, the gateway returns `realtime_backpressure`, HTTP-equivalent status `503` and `retryable: true` in the Socket.IO acknowledgement. Clients should retry with exponential backoff and jitter while keeping the same `clientMessageId` so the durable idempotency check can suppress duplicates.

## Reproducible load baseline

The CI integration test opens 12 real Socket.IO clients, resumes all 12 sessions and sends a burst of 48 synthetic messages through a mocked persistence boundary. It verifies the gateway, authentication, acknowledgements, bounded queue and metrics instrumentation. This is a regression baseline, not a production capacity claim.

Repeated local verification on 8 September 2026: 12/12 connections succeeded in 72–106 ms, all 48/48 message acknowledgements succeeded in 185–211 ms bursts, message-processing p95 was 177–207 ms, 44 operations were queued per run and zero were rejected. Timings are machine-specific; the pass/fail invariants and absence of rejected work are the portable evidence.

Run it with:

```bash
npx jest backend/src/realtime/socketServer.load.test.js --runInBand
```

For an environment backed by the real database, mint short-lived socket tokens for dedicated test accounts and run:

```bash
REALTIME_LOAD_BASE_URL=https://backend.example \
REALTIME_LOAD_SOCKET_TOKENS=token1,token2 \
REALTIME_LOAD_CONNECTIONS=25 \
REALTIME_LOAD_MESSAGES_PER_CONNECTION=4 \
REALTIME_LOAD_CHANNEL_ID=<dedicated-test-channel> \
REALTIME_LOAD_ADMIN_ACCESS_TOKEN=<admin-access-token> \
npm run metaverse:load-baseline
```

Use only dedicated test accounts and channels. Never place tokens in source files, command history shared with others, issue comments or test artifacts. Save the JSON result in the restricted operational evidence store after removing the target URL if it is private.

## Redis interruption drill

1. Record `/api/realtime/metrics` and the current deployment identifier.
2. Stop or block the dedicated test Redis instance.
3. Join and heartbeat a dedicated test presence channel.
4. Confirm the request remains available in `local-fallback` mode and `redisFailures` increases.
5. Confirm the alert collector detects the `redisFailures` alert.
6. Restore Redis and reconnect the clients so their presence is rebuilt in Redis.
7. Repeat the multi-client presence check before closing the incident.

Local fallback preserves single-worker availability but is not shared across workers. Do not treat it as a distributed-consistency guarantee.

## Worker restart drill

1. Send a message with a unique `clientMessageId` and verify that the acknowledgement reports success.
2. Verify the corresponding `ChatMessage` and recipient `Notification` records exist in MongoDB.
3. Restart one realtime worker.
4. Reconnect and call `realtime.resume` with the authorized channels.
5. Fetch messages and notifications over their HTTP APIs and verify the durable records remain available.
6. Retry the original message with the same `clientMessageId`; verify it is reported as a duplicate and is not persisted or fanned out twice.
7. Confirm process-local counters restarted and the external monitor preserved the pre-restart time series.

## Known scaling limits

- Socket.IO fan-out and the bounded operation gate are process-local. A Redis Socket.IO adapter is still required for cross-worker fan-out.
- Redis presence falls back locally during an outage, so different workers can temporarily report different presence sets.
- Metrics need an external scraper/time-series backend for durable dashboards and paging.
- Notifications are persisted before live emit, but there is no durable transactional outbox yet. A process failure between the message write and notification writes can require reconciliation.
- The synthetic CI baseline does not exercise network latency, MongoDB capacity, Redis capacity or real multi-region traffic.

These limits must be included in any capacity or production-readiness statement.
