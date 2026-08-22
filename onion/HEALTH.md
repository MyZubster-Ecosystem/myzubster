# Distributed Onion Health Model

Health is an observation, not an identity claim. A node can be cryptographically valid while temporarily unreachable from one client network.

## States

- `HEALTHY`: recent successful probe from this vantage point.
- `DEGRADED`: reachable but latency/error budget is deteriorating.
- `UNREACHABLE`: repeated probe failures from this vantage point.
- `QUARANTINED`: temporarily excluded after repeated failures; never treated as globally dead.

## Vantage-point rule

A single client must not globally mark a node dead. Probe results carry an observer/vantage identifier and timestamp. Global status should be derived from independent observations when available.

Recommended observation fields:

```json
{
  "node_id": "node-example",
  "observer_id": "observer-example",
  "observed_at": "2026-08-18T12:00:00Z",
  "result": "success",
  "latency_ms": 120,
  "http_status": 200,
  "error_class": null
}
```

For failed probes, distinguish:

- DNS/captive-portal/local-network failure;
- Tor bootstrap/connectivity failure;
- onion rendezvous/connect failure;
- application timeout;
- application error.

A local network failure must not count as evidence that the Onion node itself is down.

## Scoring

Use bounded scores and decay old observations. A suggested initial weighting is:

- successful application probe: +2
- successful Tor reachability with application failure: 0
- timeout after Tor connection: -1
- repeated onion connection failure: -2
- local/captive network failure: 0

Quarantine is triggered only by repeated node-specific failures, not by one observation. Recovery requires a fresh successful probe.

## Failover safety

- bounded retries;
- exponential backoff;
- jitter;
- candidate diversity;
- no parallel fan-out to every known node;
- refresh discovery when the candidate pool becomes too small.

This model is intentionally conservative: preserving availability is more important than prematurely declaring a healthy Onion Service dead.
