# Distributed Onion Discovery

## Goal

Keep MyZubster reachable when individual Onion Service instances become unavailable or overloaded. Nodes are discovered dynamically and treated as untrusted until their identity, capabilities, expiry and health are verified.

## Node advertisement

A node advertises a signed record containing:

- `node_id`: stable logical node identity, distinct from the Onion hostname
- `onion_address`: Tor v3 `.onion` endpoint
- `service`: service/capability name
- `protocol_version`: discovery protocol version
- `expires_at`: short-lived advertisement expiry
- `public_key`: node signing key
- `capabilities`: supported application capabilities
- `sequence`: monotonically increasing record version
- `signature`: signature over the canonical record

Private Onion keys are never part of an advertisement.

## Discovery behavior

Clients should maintain a small local candidate set rather than relying on one endpoint. Candidate records are refreshed before expiry and removed when they fail verification or repeated health checks.

Suggested state machine:

```text
DISCOVERED -> VERIFIED -> HEALTHY
                     \-> DEGRADED
HEALTHY -> DEGRADED -> QUARANTINED
QUARANTINED -> DISCOVERY_REFRESH -> VERIFIED
```

A failed node must not cause an application-wide outage. Clients should use bounded retries with exponential backoff and jitter, and avoid retrying every candidate simultaneously.

## Anti-DDoS principles

Discovery is an availability mechanism, not a traffic amplifier. The implementation must:

1. avoid a single discovery authority;
2. limit candidate refresh and retry rates;
3. prefer healthy, diverse nodes;
4. quarantine repeatedly failing nodes temporarily;
5. avoid exposing unnecessary node metadata;
6. require cryptographic verification before use;
7. keep application state independent from a single Onion endpoint.

Health information should be treated as advisory and never as proof of node trust.

## Initial implementation boundary

The first implementation adds the protocol and data model without changing the existing Onion endpoint. Subsequent work can add a discovery API, signed advertisements, node health reporting and client-side failover.

The existing persistent `onion_data` volume remains the source of truth for each individual Tor v3 identity.
