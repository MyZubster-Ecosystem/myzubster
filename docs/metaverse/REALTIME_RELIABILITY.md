# Realtime reliability, observability and load baseline

This document defines the Phase B realtime reliability boundary for MyZubster.

## Authoritative state

MongoDB remains authoritative for durable chat messages and notifications. Redis is authoritative only for ephemeral distributed presence when `REDIS_URL` is configured. Socket.IO is a delivery transport, not the durable source of truth.

## Metrics

The admin-only `GET /api/realtime/metrics` snapshot exposes counters, gauges and latency aggregates for:

- connection authentication and successful connections
- active connections and disconnect reasons
- channel subscription success/denial/failure
- presence join/heartbeat/leave
- message persistence, duplicate suppression and realtime emission
- reconnect/resume outcome and latency
- notification persistence and realtime emission

Structured JSON logs carry bounded correlation fields (`connectionId`, `correlationId`, `channel`, `messageId`, `notificationId`, outcome/reason/latency) and intentionally exclude auth tokens, chat bodies and private session credentials.

## MVP SLO targets

- connection success: >= 99%
- durable message persistence success: >= 99%
- durable notification persistence success: >= 99%
- reconnect restore success: >= 98%

These are initial MVP targets, not claims about internet-scale capacity.

## Load harness

Run against a persistent Node realtime deployment:

```bash
REALTIME_BASE_URL=http://localhost:3009 \
REALTIME_TEST_TOKEN=<short-lived-realtime-token> \
REALTIME_LOAD_CLIENTS=25 \
REALTIME_LOAD_HOLD_MS=5000 \
npm run test:realtime-load
```

The harness opens concurrent WebSocket connections, waits for `realtime.ready`, reports p50/p95/max ready latency, and exits non-zero if connection success is below 99%.

Baseline tiers to record per environment:

| Tier | Concurrent connections | Purpose |
| --- | ---: | --- |
| smoke | 25 | CI/dev regression |
| small-room | 100 | expected early community/session room |
| scale-probe | 500 | infrastructure capacity probe only |

A tier is considered established only when the actual run output is retained with environment/runtime details. This repository does not claim a measured 100/500-client production result until those runs are executed on the production realtime host.

## Backpressure and burst behavior

Chat persistence already enforces 12 messages per 10 seconds per sender. Duplicate `clientMessageId` retries are idempotent and do not consume a second durable write. A rate-limit response is an intentional backpressure signal, not a delivery failure.

## Failure model

### Realtime worker restart
Durable messages and notifications survive because persistence happens before realtime emission. Clients reconnect with a fresh short-lived token and call `realtime.resume`; subscriptions are re-authorized rather than blindly restored.

### Redis unavailable
When Redis is configured for presence but unavailable, presence operations fail closed. Existing presence keys expire by TTL. Durable chat/notification state is unaffected.

### Worker dies before disconnect cleanup
Redis TTL removes stale distributed presence after the configured 90-second window. Local-fallback mode is explicitly single-process development behavior and is not a multi-worker guarantee.

### Realtime emission unavailable
Notification/message durable state remains queryable through HTTP APIs. The metric `realtime_notification_delivery_total{outcome=no_gateway}` identifies durable-but-not-emitted notification delivery.

## Known scaling limits

- Socket.IO requires a persistent Node-compatible runtime; Vercel serverless is not the production WebSocket host.
- Redis presence provides shared ephemeral membership, but multi-worker Socket.IO fan-out still requires a production adapter/broker when horizontally scaling the gateway.
- The in-process metrics registry resets on worker restart. Production dashboards should scrape/export these counters to an external metrics system.
- The load harness measures connection readiness; application-level message throughput and cross-region latency should be added when the production realtime topology is fixed.
