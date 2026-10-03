# Nicola as the first independent MyZubster local-node pilot — REVIEW PROPOSAL

**Date:** 2026-10-02  
**Status:** architecture proposal only, pending Nicola's review and agreement. No live bridge is claimed, configured or authorized by this document.  
**Reference implementations:** [Nicola's local MVP](https://github.com/nicolaususnicola-lgtm/myzubster-mvp), [local comics adapter contract](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/ZORGAX.md), [MyZubster coordination issue #1176](https://github.com/MyZubster-Ecosystem/myzubster/issues/1176), [joint crypto roadmap](DANIEL-NICOLA-CRYPTO-MONERO-PGP-ROADMAP.md).

## Goal and terminology

Pilot a first **independent operational node**: Nicola maintains MyZubster, its data and optional AI services on his own machine, while MyZubster's service can exchange a small, explicitly approved set of data and requests over a secure bridge. Initially this is a **federated/interconnected pilot**, not proof of a fully decentralized or trustless system. A home device must not be exposed directly to the public Internet.

## Existing foundation versus proposed new work

**Inspected:** Nicola's `docker-compose.yml` runs an API container on port 5000, Qdrant published on loopback, and Open WebUI published on loopback. The API currently publishes `5000:5000`, which binds to all host interfaces unless host firewall policy narrows access; for the pilot, restrict to `127.0.0.1:5000:5000` where compatible and review any dependencies. The Ollama reference goes through `host.docker.internal`; no assumption that all local services are running on Nicola's specific device. The [comics adapter](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/ZORGAX.md) is read-only and supports `GET /api/comics`, `GET /api/comics/{id}`, `POST /api/zorgax/ask` actions `gallery`, `detail`, `candidate`, `next_steps`. [Local test report](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/main/docs/nicola-comics/TEST-REPORT-2026-09-15.md) describes manual HTTP PASS; the public Zorgax connection remains PENDING.

**Proposed, not implemented:** local connector agent, public bridge ingress with authentication, node registration, queued responses, centralized routing from Zorgax, cross-node audit and offline resilience.

## Minimal pilot architecture

```text
Nicola's PC                                  MyZubster service
┌─────────────────────────┐                  ┌─────────────────────────┐
│ MyZubster MVP / Docker  │                  │ Authorized bridge API   │
│ Local API :5000         │                  │ Node registry          │
│ Comics read-only adapter│                  │ Zorgax request adapter │
│ Local AI/Qdrant optional│                  │ Sanitized audit log    │
│ Connector agent         │ -- outbound --> │ Limited broker         │
└─────────────────────────┘  HTTPS / mTLS*  └─────────────────────────┘
```

* Choose **one** mutually authenticated channel after threat modeling; possibilities include HTTPS with short-lived per-node credentials and request signatures, or mTLS. Do not treat ordinary TLS alone as node authentication. No reverse port forwarding or exposing Nicola's machine by default. A broker may use short polling or an authenticated WebSocket initiated **from Nicola's device**; design with strict timeouts, allowlists and backpressure.

The first exchange should be an authenticated node health/capability snapshot and a **read-only** `gallery` response with predefined, non-sensitive test data. Avoid transferring user data, private observations, raw AI prompts, secrets, keys, private Qdrant documents or personal network identifiers.

## Work packages and acceptance gates

| Gate | Technical work | Evidence to collect | Completion condition |
|---|---|---|---|
| N0 — Consent and security boundaries | Nicola approves pilot; both parties agree which machine, branch, public data and tests are in scope. Draw threat model and data-flow diagram. | Written confirmation, versioned scope, sanitized test environment inventory. | Consent and threat model approved; no public connectivity until then. |
| N1 — Reproducible independent local node | Run `docker compose config` with secrets excluded; restrict API host bind, review firewall; run manual and automated read-only tests. Verify behavior with internet disconnected if supported by dependencies. | Test log, versioned commit and precise dependency list; successful local health/catalog checks and restart persistence. | Local operation demonstrated independently of MyZubster's central website for the chosen core features. |
| N2 — Authenticated outbound bridge prototype | Build local connector with outbound-only authenticated requests to a staging broker. Broker associates a node ID with least-privilege scoped credentials; enforce request IDs, timestamps, expiry, replay protection and explicit allowlisted actions. | Static config example with placeholders; unit/integration tests for valid/invalid credentials, replay, timeouts, duplicates and disconnected host. | No unauthenticated action and no inbound public ports; secure connection to staging demonstrated. |
| N3 — First cross-node API exchange | From the authorized MyZubster staging service, request Nicola's read-only `gallery`, then `detail`; connector calls local APIs and sanitizes the response. Zorgax integration only after API tests. | Versioned end-to-end test with request IDs, both sides' sanitized logs, exact commit SHAs and HTTP outcomes. | Reproducible two-node round trip, proper errors while Nicola's node is offline; read-only access only. |
| N4 — Resilience and security tests | Kill/restart either side; expired/revoked credential, unauthorized action, unexpected data, malformed payload, injection attempt, repeated message, rate limit and rollback. Do not let Zorgax prompts authorize arbitrary shell or wallet operations. | CI test matrix plus supervised manual security checks, no secrets in logs. | Failure cases are safe; explicit restart/revoke procedures work. |
| N5 — Cryptographic proof and controlled publication | Freeze approved, non-sensitive connector test report with exact software revisions; compute canonical SHA-256 and optionally sign with **test** PGP keys to pilot source authenticity. Reuse existing read-only Base/Ethereum Sepolia evidence checks to understand anchoring; optional **new** testnet anchor only with separate owner consent. | Source links, signatures and verified digest; clarify exact claims and reviewer approval. | Daniel and Nicola separately approve the test report and any Knowledge Card describing the pilot. |
| N6 — Future Monero/PGP/onion research | Only after N0–N4: PGP challenge/rotation proof-of-concept, Monero test/staging wallet **read-only** RPC with private network/least privilege, and optional Tor onion reachability experiment in dedicated infrastructure. | Isolated threat models, reproducible negative tests, independent reviews. | These remain separate milestones, not prerequisites for the first simple bridge, and are never silently enabled in production. |

## API contract proposal (not existing endpoints)

The following are future broker-side designs, not currently available API routes:

```text
POST /pilot/nodes/register   # authenticated, one-time/reviewed enrollment
POST /pilot/nodes/heartbeat  # authenticated capability/health data only
POST /pilot/nodes/response   # correlated read-only result, request ID
GET  /pilot/nodes/requests   # authenticated long-poll/poll request queue
```

Never trust a client-supplied `nodeId` alone: bind node authorization to server-side credentials and scopes. Reject arbitrary URL fetching, local file paths and open-ended command execution; the connector may only dispatch known read-only actions. Do not implement these endpoints inside the public instance until approved staging tests and security review.

## Safeguards

- No public router port forwarding, direct home device IP, exposed Ollama/Qdrant, public unauthenticated Tor/Monero Wallet RPC, seed phrases or PGP private keys. Rotate/revoke per-node credentials; store with restrictive file permissions outside Git.
- For `docker-compose.yml`, the API's current `5000:5000` setting needs inspection and deliberate loopback binding/firewall policy **before** a network pilot.
- Staging broker rather than unrestricted direct access to Nicola's local PC. Clear outbound-only topology and consent required.
- No financial transactions, NFT mint or real user data in this pilot. Nicola Comics candidate remains `TO_VERIFY` for rights.
- If the operator switches off the local connector, central MyZubster must show `OFFLINE` and stop dispatching requests; no continuous connectivity guarantee.
- Automated health/error checks and versioned logs should establish observable results. A git commit documents code, not successful operation; a blockchain hash documents integrity of a particular report, not global security or contributor competence.

## First joint session checklist

1. Nicola confirms pilot scope, selects a source revision and reports his local system's sanitized Docker versions/health.
2. Together review API port binding and firewall before any cross-host test.
3. Run `GET /api/comics` and the predefined `gallery` action **locally** with a test payload.
4. Agree the staging bridge deployment and its authentication mechanism; create a separate issue/PR for N2 implementation.
5. Only after approval, connect local outbound agent to staging and record a reproducible read-only request/response.

**Documentation principle:** This file is an architecture proposal and acceptance checklist. No operational interconnection, remote access, independent node deployment, Tor routing or public Zorgax end-to-end verification has been asserted yet.

## Implementation progress — VPS staging prototype (2026-10-02)

A separate portable Docker staging prototype was prepared during this session (archive delivered to Daniel through the conversation): a Python-standard-library single-process broker, a future opt-in outbound-only agent for Nicola, Dockerfile, loopback-bound Docker Compose, private environment template, README and local tests. The prototype is **not yet deployed to Daniel's VPS**, **not yet committed to an enduring GitHub implementation branch**, and **not connected to Nicola's computer**. Docker Engine was unavailable in the test workspace; container build and runtime remain untested.

Three local Python tests passed: admin/node credential separation; rejection of prohibited actions, invalid inputs and duplicate results; queued read-only request/result exchange; future agent output restricted to sanitized catalog titles. These results do not certify Internet security, TLS proxy, production readiness or distributed availability. Queue state is ephemeral and single-replica, and the two random bearer tokens require a secured TLS proxy, restricted operator access, rate limits and further security review before Internet-facing staging.

**Deployment gate:** upload and review the archive as a separate source branch, then obtain authorized VPS access for a separate staging host; generate two unrelated random secrets outside Git, bind container host-side to 127.0.0.1:8092, configure TLS proxy/access policy/firewall and run the actual Docker health and negative tests. Nicola's machine stays disconnected until he explicitly consents to the local-agent pilot.

## Workstation and connector-source discovery (2026-10-03)

Nicola reports that Git, Docker and Docker Compose work on his Windows PC. He repeated the unauthenticated request to `https://bridge.myzubster.com/node/next` and received the expected HTTP 401. These are participant-reported workstation and runtime results; exact tool versions and sanitized command output remain to be captured.

Nicola identified the local main-repository revision as branch `pilot/n4k48-local-node-clean` at commit `ba026ffd9c87f15f0cd8eca63827f43c35f64a8c`, and reported uncommitted modifications in his local MVP repository. The commit exists, is attributed to `nicolaususnicola-lgtm`, and changes documentation only; it does not contain the Node Bridge connector. The named branch was not found in either remotely connected repository, and searches of the current default branch found no connector source for `BRIDGE_NODE_TOKEN` or `/node/next`.

Connector source location, version and startup procedure therefore remain **BLOCKED_SOURCE_NOT_PUBLISHED**. Before authenticated testing:

1. identify the exact source currently deployed on the VPS;
2. publish and review it in a scoped branch without secrets, or provide a verified immutable source archive;
3. record its exact commit/version and startup instructions;
4. preserve Nicola's uncommitted MVP changes;
5. rotate the VPS token and configure it privately outside Git and email;
6. run authenticated and end-to-end tests with sanitized output.

No connector installation on Nicola's PC, authenticated success or end-to-end completion is claimed.

