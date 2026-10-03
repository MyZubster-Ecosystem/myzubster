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

The latest local inspection supersedes the earlier provisional working-tree note:

- Windows main-repository baseline: branch `pilot/n4k48-local-node-clean`, commit `ba026ffd9c87f15f0cd8eca63827f43c35f64a8c`, working tree reported clean, zero commits behind and two ahead of `upstream/main`.
- Ubuntu WSL MVP baseline: branch `main`, commit `e57261a325625057350aa059ca142f1eb84b30c2`, working tree reported clean.

Both commits exist on GitHub. Commit `ba026ffd` is attributed to `nicolaususnicola-lgtm` and changes documentation only; it does not contain the Node Bridge connector. Commit `e57261a` exists in `nicolaususnicola-lgtm/myzubster-mvp` and finalizes Proof v3 evidence sources; it also does not establish the connector. The named Windows branch was not found in the remotely connected main repository, so the local two-commit divergence cannot yet be independently reviewed. Exact default-branch code searches in `MyZubster-Ecosystem/MyZubsterGateway` also returned no matches for `bridge.myzubster.com`, `BRIDGE_NODE_TOKEN` or `/node/next`. Its README and package configuration describe a general API/order/payment gateway on port 10000, not a confirmed Node Bridge connector. It must not be substituted for the missing connector without a versioned implementation and review.

Connector source location, version and startup procedure therefore remain **BLOCKED_SOURCE_NOT_PUBLISHED**. Before authenticated testing:

1. identify the exact source currently deployed on the VPS;
2. publish and review it in a scoped branch without secrets, or provide a verified immutable source archive;
3. record its exact commit/version and startup instructions;
4. publish or otherwise review the two local commits ahead of `upstream/main` without overwriting either clean baseline;
5. rotate the VPS token and configure it privately outside Git and email;
6. run authenticated and end-to-end tests with sanitized output.

No connector installation on Nicola's PC, authenticated success or end-to-end completion is claimed.


## Participant-reported local acceptance evidence (2026-10-03)

Nicola reports completing an additional local, credential-free acceptance run on the Ubuntu WSL MVP baseline. The Docker stack and API were healthy; the Nicola Comics catalog returned three items; and `POST /api/zorgax/ask` succeeded for the four documented read-only actions `gallery`, `detail`, `candidate` and `next_steps`. He also reports a negative allowlist test in which the unsupported `delete` action was rejected and the response exposed only the supported actions.

Nicola further reports restarting only the API container and observing that the service returned healthy, the same three **local test events** remained in the local ledger, and the Comics catalog stayed available. Repository inspection at commit [`e57261a`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/e57261a325625057350aa059ca142f1eb84b30c2) confirms that Docker Compose mounts the named volume `observations-data` at `/data` and points the observation and ledger files there. The documented Comics contract independently confirms the three-item catalog, the four-action allowlist and read-only boundary. The reported runtime outputs and restart result have not been independently reproduced or backed by sanitized logs in this PR.

Evidence boundaries remain explicit:

- the three retained ledger entries are synthetic/local test events, not a real balance, revenue, payment or substitute for the canonical MYZ ledger;
- `n4k48-comic-001` remains `NFT_CANDIDATE / PROPOSED_FOR_REVIEW`, with `rights_status: TO_VERIFY` and no verified `token_id` or `transaction_hash`; no mint is claimed;
- no local service was exposed to the Internet, no onion configuration was changed, no `BRIDGE_NODE_TOKEN` was used and no authenticated or public end-to-end bridge test was run.

This advances the local N1/N4 evidence only. The bridge remains `BLOCKED_SOURCE_NOT_PUBLISHED` until the exact VPS-deployed source/version and startup procedure are identified and reviewed; credentials must then be rotated and configured privately before authenticated and end-to-end tests with sanitized evidence.


## Participant-reported tested checkpoint and Comics provenance (2026-10-03)

Nicola has now published the evidence branch [`pilot/n4k48-tested-checkpoint`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/tree/pilot/n4k48-tested-checkpoint), superseding the earlier local-only availability note. The public [checkpoint `305d89e`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/305d89ee6444210d52a1af27cbce54fc844ad51b) includes the loopback API binding `127.0.0.1:5000:5000`, a versioned PowerShell Pilot Node test script, its [sanitized evidence record](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/pilot/n4k48-tested-checkpoint/pilot-tests/N4K48-PILOT-NODE-EVIDENCE.md) and the tested application changes.

The evidence record reports **7/7 Pilot Node checks passing**, including healthy API, three-item Comics catalog, candidate/detail/next-steps queries, HTTP 400 for a forbidden action, three readable local ledger events and persistence after API restart. Nicola separately reports **54/54 Python tests passing**, valid Compose configuration and a clean working tree after checkpointing. The source artifacts and test definitions are now publicly reviewable; the runtime PASS counts and clean local state remain participant-produced results because no matching GitHub Actions run or independent rerun is attached.

For `n4k48-comic-001`, the following public chain is available:

- [source commit `f853710`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/f853710e24c305cb292b271c0d37696147e35239), which introduced the three Comics images;
- Git blob `bf90e43ba1c1524a5c955e6e0446fe774f83a2e7`, independently matched by GitHub metadata for `docs/n4k48-comics/01-dall-idea-al-metaverso.png` at that commit;
- [provenance commit `aeb4955`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/aeb49554da678b9bc5ba80f25d1f8af06b2b5f25) and its [provenance evidence record](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/pilot/n4k48-tested-checkpoint/pilot-tests/N4K48-COMIC-001-PROVENANCE.md);
- reported PNG SHA-256 `37df6a259cf93f796c0b0700f8c5829ecd8162d6fa103dd7a99b89a2b91261e3`.

The commits, branch, evidence files and Git blob are independently accessible. The PNG SHA-256 is recorded in the published evidence but was not independently recomputed in this review. These references are prepared for owner-approved addition to the N4K48 Knowledge Card with the labels **Pilot Node verified locally** and **technical provenance documented/externally linked**—not third-party certification.

The candidate remains `NFT_CANDIDATE / PROPOSED_FOR_REVIEW` with `rights_status: TO_VERIFY`. Hash and Git provenance do not establish copyright ownership, commercial rights, minting, token ownership, blockchain registration or financial value; no mint is claimed.

No new service exposure or Bridge progress is claimed. The authenticated Bridge test remains paused and status remains `BLOCKED_SOURCE_NOT_PUBLISHED` pending identification and review of the deployed VPS connector source.


## Publicly reviewable checkpoint evidence (2026-10-03)

Nicola has now published the previously local evidence branch, so the checkpoint and supporting evidence are reviewable on GitHub:

- Evidence branch: [`pilot/n4k48-tested-checkpoint`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/tree/pilot/n4k48-tested-checkpoint)
- Pilot Node checkpoint: [`305d89ee6444210d52a1af27cbce54fc844ad51b`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/305d89ee6444210d52a1af27cbce54fc844ad51b)
- Pilot Node evidence: [`pilot-tests/N4K48-PILOT-NODE-EVIDENCE.md`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/pilot/n4k48-tested-checkpoint/pilot-tests/N4K48-PILOT-NODE-EVIDENCE.md)
- Comics provenance commit: [`aeb49554da678b9bc5ba80f25d1f8af06b2b5f25`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/commit/aeb49554da678b9bc5ba80f25d1f8af06b2b5f25)
- `n4k48-comic-001` provenance evidence: [`pilot-tests/N4K48-COMIC-001-PROVENANCE.md`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/pilot/n4k48-tested-checkpoint/pilot-tests/N4K48-COMIC-001-PROVENANCE.md)

The published evidence records 54/54 Python tests passing, 7/7 Pilot Node automated checks passing, valid Docker Compose configuration and loopback-only API exposure for the tested checkpoint. These claims are now tied to a public immutable commit and evidence files rather than an unpublished local branch.

Evidence labels must remain precise:

- **Pilot Node:** locally tested / publicly reviewable evidence
- **Technical provenance:** publicly reviewable
- **`n4k48-comic-001` rights:** `TO_VERIFY`
- **NFT state:** `NFT_CANDIDATE / PROPOSED_FOR_REVIEW`
- **Mint state:** no mint claimed; no `token_id` or `transaction_hash` asserted

This publication advances the reproducibility of the local N1/N4 evidence. It does **not** change the Bridge status: the authenticated Node Bridge test remains paused until the exact VPS-deployed connector source/version is identified and reviewed.

## Public Zorgax → Nicola Comics baseline confirmation (2026-10-03)

The direct public Zorgax → Nicola Comics path is now implemented in upstream `main` and is separate from the outbound local-node/VPS connector proposed earlier in this document:

- [PR #1460](https://github.com/MyZubster-Ecosystem/myzubster/pull/1460), merged as [`ee8c15d`](https://github.com/MyZubster-Ecosystem/myzubster/commit/ee8c15d4b26824b75345c2eebc62ac034058b84a), adds a read-only service that calls the public pilot HTTPS endpoint and allowlists only `gallery`, `detail`, `candidate` and `next_steps`;
- [PR #1461](https://github.com/MyZubster-Ecosystem/myzubster/pull/1461), merged as [`39fb429`](https://github.com/MyZubster-Ecosystem/myzubster/commit/39fb429277ac8d88ae589a0c7b8eed0c3e0fe54a), maps public Zorgax natural-language requests that explicitly mention “Nicola Comics” to that service;
- GitHub reports successful Vercel statuses for both merge commits.

Daniel reports a successful production end-to-end check using the prompt “Ciao Zorgax, mostrami la galleria di Nicola Comics”; Nicola then accepted the public Zorgax → Nicola Comics → pilot-evidence flow as the verified baseline. This review independently verified the merged source and deployment status records, but did not replay the production browser interaction.

This supersedes the earlier **public Zorgax connection PENDING** statement only for the direct hosted Comics path. It does **not** prove that Nicola's PC is connected to the earlier outbound Node Bridge design, and it does not complete that design's N2/N3 authenticated local-node round trip. `BLOCKED_SOURCE_NOT_PUBLISHED` therefore remains applicable only to that separate local-node/VPS connector.

The evidence boundary remains unchanged: `rights_status: TO_VERIFY`; `n4k48-comic-001` remains `NFT_CANDIDATE / PROPOSED_FOR_REVIEW` and not selected; no mint, token ID, transaction hash, on-chain registration, ownership or commercial-rights claim is established.

Nicola's confirmed next sequence is:

1. consolidate and publicly review rights/provenance evidence for `n4k48-comic-001`;
2. define explicit human-review criteria before any transition from candidate/proposed to selected;
3. only after verifiable evidence and separate approval, evaluate a possible on-chain path.

No automatic status promotion, mint, wallet action, payment or blockchain transaction is authorized by this confirmation.

## Comic 001 rights-review dossier prepared (2026-10-03)

Nicola opened [PR #20 in `nicolaususnicola-lgtm/myzubster-mvp`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/pull/20) from branch `docs/n4k48-comic-001-rights-review` onto the public checkpoint branch. The PR adds one file: [the rights and provenance review for `n4k48-comic-001`](https://github.com/nicolaususnicola-lgtm/myzubster-mvp/blob/docs/n4k48-comic-001-rights-review/docs/nicola-comics/evidence/n4k48-comic-001-rights-review.md).

Repository inspection confirms that the dossier is consistent with the existing card, manifest and provenance record: publication commit `f853710e24c305cb292b271c0d37696147e35239`, Git blob SHA-1 `bf90e43ba1c1524a5c955e6e0446fe774f83a2e7`, AI-assisted project provenance, and the current statuses `rights_status: TO_VERIFY`, `NFT_CANDIDATE`, and `PROPOSED_FOR_REVIEW`. The catalog's network, contract, token, transaction and metadata fields remain empty/null.

The dossier correctly separates Git/file provenance and participant project provenance from legal rights or usage authorization. It defines prerequisites for a future selection and for any later on-chain claim without promoting any state. PR #20 is open and mergeable; no CI workflow or commit status is attached, and it is not yet merged.

The remaining human evidence gate is authoritative, dated authorization covering the intended publication/commercial/NFT use and any MyZubster-controlled names, characters, logos or visual elements. A commit, hash, AI-generation note or candidate label is not sufficient. Until that evidence is linked and reviewed, no selection, mint or on-chain status change is justified.

