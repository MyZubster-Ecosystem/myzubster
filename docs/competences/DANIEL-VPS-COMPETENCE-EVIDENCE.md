# Daniel — VPS & Infrastructure Competence Evidence

**Contributor:** `danieldirimini-myzubster`  
**Evidence date:** 7 October 2026  
**Knowledge status:** `DOCUMENTED`  
**Competence evidence status:** `RECORDED`  
**Technical checkpoint:** `TESTED`

> This document records bounded technical evidence from real MyZubster VPS configuration, programming and verification work. It is not a professional certification, penetration-test report, security guarantee, employment credential or regulatory approval.

## Canonical provenance

Primary evidence:

- PR #1540 — Contributor Verification VPS hardening evidence
- Merge SHA: `1da9f2df82c7b54d108d84d734de3ac1084ed072`
- PR #1541 — Contribution / Knowledge Graph linkage
- Merge SHA: `da6b73136c474fb071270a61e5841ad927825535`

The competence evidence below is derived only from the bounded work documented and merged in those checkpoints.

## Competence areas

### COMP-VPS-LINUX-001 — Linux / VPS Operations

**Status:** `RECORDED`  
**Evidence status:** `TESTED`

Demonstrated activities:

- inspected active TCP/UDP listeners and process ownership;
- distinguished systemd, PM2, Docker and direct-process runtimes;
- used targeted service restart/reload rather than broad restarts;
- verified service health after changes;
- preserved rollback copies before modifying production startup/configuration;
- avoided destructive Git operations on a dirty live checkout.

### COMP-NET-HARDENING-001 — Network Exposure & Service Hardening

**Status:** `RECORDED`  
**Evidence status:** `TESTED`

Demonstrated activities:

- reduced direct application exposure by binding selected services to localhost;
- differentiated firewall policy from process bind address;
- verified UFW state before changing exposure;
- removed unnecessary direct SMTP exposure by disabling unused Postfix;
- reviewed public versus local service boundaries before changing listeners;
- preserved intentionally networked P2P services when justified.

### COMP-NGINX-REALTIME-001 — Nginx, WebSocket & Socket.IO Integration

**Status:** `RECORDED`  
**Evidence status:** `TESTED`

Demonstrated activities:

- inspected active nginx routing before modification;
- added a dedicated realtime proxy path;
- verified Engine.IO polling through nginx;
- verified HTTP/1.1 `101 Switching Protocols` WebSocket upgrade;
- preserved HTTPS reverse-proxy access while backend services remained localhost-bound;
- separated transport reachability from application authentication.

### COMP-NODE-RUNTIME-001 — Node.js Production Runtime Integration

**Status:** `RECORDED`  
**Evidence status:** `TESTED`

Demonstrated activities:

- traced the production gateway startup path;
- identified that existing Socket.IO code was not attached by the systemd startup script;
- added minimal `attachRealtimeServer(server)` wiring to the production startup path;
- ran `node --check` before restart;
- restarted only the MyZubster gateway service;
- verified runtime behavior after the patch.

### COMP-RUNTIME-ORCH-001 — PM2 / systemd / Docker Runtime Operations

**Status:** `RECORDED`  
**Evidence status:** `TESTED`

Demonstrated activities:

- mapped services to their runtime managers;
- used `pm2 describe`, targeted `pm2 restart <service>` and `pm2 save`;
- inspected systemd unit definitions and startup commands;
- distinguished Docker-published localhost ports from host listeners;
- avoided `pm2 restart all` and broad runtime disruption.

### COMP-AUTH-VERIFY-001 — Realtime Authentication Verification

**Status:** `RECORDED`  
**Evidence status:** `TESTED`

Demonstrated activities:

- verified that unauthenticated Socket.IO clients were rejected;
- observed `unauthorized` at the client boundary;
- verified corresponding `connection_rejected` / JWT error events in system logs;
- treated authentication rejection as a separate checkpoint from WebSocket transport success.

### COMP-P2P-INFRA-001 — P2P Infrastructure Boundary Analysis

**Status:** `RECORDED`  
**Evidence status:** `TESTED`

Demonstrated activities:

- distinguished Monero P2P listener from localhost RPC interfaces;
- verified Monero synchronization and active peer connections;
- distinguished IPFS Swarm/P2P transport from localhost API/gateway interfaces;
- observed established IPFS peer connections;
- avoided mechanically converting legitimate P2P listeners to localhost-only services.

### COMP-EVIDENCE-DEVOPS-001 — Evidence-first Production DevOps

**Status:** `RECORDED`  
**Evidence status:** `TESTED`

Demonstrated activities:

- changed one production component at a time;
- created rollback copies before edits;
- ran syntax/config checks before restart/reload;
- verified listeners, local health and public proxy behavior after changes;
- recorded negative tests and rejection behavior;
- pinned public evidence to merged PRs and immutable commit SHAs;
- kept technical `TESTED` status separate from certification, deployment completeness and payment/bounty status.

## Graph interpretation

The intended MyZubster graph semantics are:

```text
github:danieldirimini-myzubster
    ↓ HAS_EVIDENCE_FOR
COMP-VPS-LINUX-001
COMP-NET-HARDENING-001
COMP-NGINX-REALTIME-001
COMP-NODE-RUNTIME-001
COMP-RUNTIME-ORCH-001
COMP-AUTH-VERIFY-001
COMP-P2P-INFRA-001
COMP-EVIDENCE-DEVOPS-001
    ↓ PROVENANCE
PR #1540 / merge 1da9f2df...
PR #1541 / merge da6b7313...
```

## Explicit non-claims

This competence record does not establish:

- certified DevOps or cybersecurity professional status;
- complete VPS hardening;
- formal penetration testing;
- ISO / NIS2 / regulatory compliance;
- external security endorsement;
- employment or contractor status;
- bounty eligibility, reward amount or payment;
- correctness of services that were not part of the bounded test scope.

Future competence updates should append new immutable evidence rather than silently upgrading existing claims.
