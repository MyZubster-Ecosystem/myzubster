# Contributor Verification VPS Hardening — Technical Evidence Checkpoint

**Date:** 7 October 2026  
**Scope:** MyZubster contributor-verification VPS runtime hardening and service-exposure review  
**Evidence owner / operator:** Daniel / MyZubster maintainer workflow  
**Knowledge status:** `DOCUMENTED`  
**Competence evidence status:** `RECORDED`  
**Technical checkpoint:** `TESTED`

> `TESTED` here means a bounded technical checkpoint verified through runtime inspection and targeted service tests. It is not a security certification, penetration-test report, regulatory approval, employment credential, or guarantee that the VPS is fully hardened.

## 1. Purpose

This checkpoint records practical infrastructure work performed on the MyZubster contributor-verification VPS while preserving production availability.

The objective was to reduce unnecessary network exposure, distinguish intentionally public peer-to-peer listeners from administrative/application interfaces, and verify that changes were reversible before persisting them.

## 2. Operating method

The work followed a conservative production-change pattern:

1. inspect the live listener and owning process;
2. identify the runtime manager (systemd, PM2, Docker or direct process);
3. inspect reverse-proxy and application dependencies;
4. create a local rollback copy before editing;
5. change one service at a time;
6. run syntax/configuration checks before restart or reload;
7. restart only the affected service;
8. verify local health and public proxy behaviour;
9. persist the process state only after the checkpoint passed.

Broad restarts, repository resets and secret inspection were intentionally avoided.

## 3. Tested checkpoints

### Application bind hardening

The following application services were verified after moving their direct listeners to localhost-only operation:

| Service | Result | Technical boundary |
|---|---|---|
| MyZubsterWeb | `TESTED` | direct application listener restricted to localhost; public access remains reverse-proxied |
| UrbanLab / I-ECO | `TESTED` | direct application listener restricted to localhost; dependent proxy behaviour checked |
| MyZubster-Social | `TESTED` | listener restricted to `127.0.0.1:5005`; local `/health` returned HTTP 200 |

For MyZubster-Social, no current nginx route or active external webhook dependency was identified during the bounded review. The service was therefore kept active while removing direct network exposure.

### Realtime gateway

The existing MyZubster Socket.IO implementation was found in the backend but was not attached by the production systemd startup path.

A minimal startup wiring change was applied and tested.

Observed checkpoint:

- gateway remained bound to localhost;
- Engine.IO polling on `/realtime/` returned HTTP 200;
- nginx proxied the realtime path;
- HTTP/1.1 WebSocket negotiation returned `101 Switching Protocols`;
- a Socket.IO client without a valid token was rejected with `unauthorized`;
- the application journal recorded the rejected connection.

This establishes the bounded technical result:

```text
HTTPS nginx
    ↓
/realtime/
    ↓
MyZubster gateway
    ↓
Socket.IO
    ↓
token-gated application connection
```

This checkpoint does **not** establish that every frontend feature consumes the realtime channel correctly.

### Postfix / SMTP exposure

The host Postfix service was observed listening on port 25 with `inet_interfaces = all`.

During the review:

- no recent mail activity was identified;
- MyZubster email-related code inspected in verifier artifacts used explicit external SMTP configuration rather than depending on local port 25;
- Postfix was disabled;
- port 25 was verified closed.

Postfix was left installed so the change remains reversible if a documented mail-server requirement appears later.

### Monero boundary

The Monero daemon was inspected without changing its runtime configuration.

Observed boundary:

- RPC interfaces were localhost-bound;
- the node was synchronized;
- peer connections were active;
- the P2P listener remained distinct from RPC/admin interfaces.

No claim is made here that Monero exposure policy is final. The checkpoint records the distinction between a P2P network listener and sensitive RPC interfaces.

### IPFS boundary

IPFS was inspected as a P2P service rather than treated as an ordinary web application.

Observed boundary:

- API and gateway interfaces remained localhost-only;
- swarm configuration used port 4001 for P2P transports;
- established peer connections were observed on the swarm listener.

For that reason, port 4001 was **not** mechanically converted to localhost-only. The review treated an intentionally networked P2P listener differently from an administrative API.

## 4. Knowledge extracted

This work produced reusable project knowledge:

- a public listener is not automatically an error; first classify its function;
- administrative APIs, dashboards and internal bridges should default to least exposure;
- P2P listeners require a different decision process from application/admin ports;
- firewall policy and process bind address are separate controls;
- reverse-proxy reachability must be tested after bind changes;
- PM2, systemd and Docker must be mapped before restarting services;
- WebSocket transport success and application authentication are separate checkpoints;
- rollback evidence should exist before modifying a live startup path;
- an inactive or unused service should not remain internet-facing by default.

## 5. Competence evidence represented

The bounded work provides public evidence relevant to these technical competence areas:

- Linux/VPS service hardening;
- listener and network-exposure analysis;
- nginx reverse proxy configuration;
- WebSocket / Socket.IO runtime verification;
- PM2 and systemd runtime mapping;
- staged production changes and rollback discipline;
- firewall-versus-bind reasoning;
- P2P-versus-administrative service classification;
- evidence-first operational verification.

These are **evidence-backed capability signals**, not formal certifications.

## 6. Explicit non-claims

This record does not claim:

- complete VPS security;
- successful penetration testing;
- ISO, NIS2 or other compliance certification;
- third-party security endorsement;
- clinical, scientific or laboratory validation;
- automatic bounty, payment or employment status;
- that every MyZubster service has been reviewed;
- that every observed configuration is the final production architecture.

## 7. MyZubster graph mapping

After repository review/merge, this checkpoint can be represented in the Contribution / Knowledge Graph as:

```text
Person / maintainer
    ↓
technical activity
    ↓
versioned GitHub evidence
    ├── Knowledge: VPS hardening & runtime boundaries
    └── Competence evidence:
          - Linux/VPS operations
          - nginx/realtime deployment
          - service isolation
          - production-safe verification
    ↓
project: MyZubster Contributor Verification Node
```

Graph publication should reference the immutable merged Git commit or PR evidence. Merge or graph linkage must not silently upgrade `RECORDED` competence evidence into certification.

## 8. Follow-up

Remaining infrastructure reviews should continue using the same bounded method: identify ownership, classify the listener, verify actual dependencies, change only when justified, test, and preserve rollback.

TAZ/event-specific functionality is intentionally outside this checkpoint because the Riccione event/project has been postponed and its incomplete application paths are not required for this VPS-hardening evidence record.
