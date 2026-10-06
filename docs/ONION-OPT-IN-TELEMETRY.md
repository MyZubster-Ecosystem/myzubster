# Onion opt-in telemetry

## Goal

Measure how many self-hosted MyZubster Onion installations are actually running without collecting Onion hostnames, IP addresses, user identities, private keys, or other persistent identifiers.

## Privacy model

Telemetry MUST be disabled by default. An operator explicitly enables it with `ONION_TELEMETRY_ENABLED=true`.

When enabled, an installation may send a coarse heartbeat to the public MyZubster telemetry endpoint. The payload MUST contain only:

- `schema`: telemetry schema version
- `kind`: `onion_instance_heartbeat`
- `release`: MyZubster release/version when available
- `runtime`: a coarse value such as `docker`
- `bucket`: a short-lived random identifier rotated at least every 24 hours

The client MUST NOT send:

- `.onion` hostname
- IP address as an application field
- Tor private/public keys
- account, email, username or device name
- Docker/container ID
- hardware fingerprint
- stable installation UUID

The receiver MUST NOT persist request IP addresses or user-agent strings for this endpoint and MUST apply retention limits to aggregate telemetry.

## Counting

`active_onion_instances_24h` is the approximate count of distinct short-lived `bucket` values observed during a rolling 24-hour window. Because buckets rotate and networking can retry, this is an operational estimate, not a count of people.

Only aggregate counts should be exposed publicly.

## Proposed opt-in configuration

```env
ONION_TELEMETRY_ENABLED=false
ONION_TELEMETRY_ENDPOINT=https://myzubster.com/api/telemetry/onion/heartbeat
```

## Implementation gate

Do not enable telemetry merely by cloning or running `docker compose up`. Before shipping the heartbeat client, implement the receiving endpoint with payload validation, rate limiting, explicit log redaction, bounded retention, and tests proving forbidden identifiers are not accepted or stored.
