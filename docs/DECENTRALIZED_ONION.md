# MyZubster Decentralized Onion

This document defines a layered decentralization model for MyZubster. The term **onion** refers to independent layers that can continue to function even when another layer is unavailable. It does **not** mean that every component is already decentralized today.

The design extends the current ecosystem architecture, which already uses IPFS/IPNS for content-addressed public snapshots, while reducing dependence on a single discovery endpoint, gateway, verifier, or publishing node.

## Design principles

1. **No single layer is trusted for everything.** Identity, content, discovery, transport, verification and settlement remain separate concerns.
2. **Content is verified by cryptographic identity, not by the server that delivered it.**
3. **Multiple retrieval paths should resolve to the same signed or content-addressed state.**
4. **Private keys stay local to their controller.** No seed phrase, private key or signing secret belongs in GitHub, IPFS metadata, logs or public manifests.
5. **Decentralization claims must match implementation.** A proposed mirror or quorum is not described as active until independently testable.

## Onion layers

```text
Layer 6  Independent verification / quorum
         verifier A | verifier B | verifier C
                    |
Layer 5  Service redundancy
         gateway A | gateway B | read-only mirrors
                    |
Layer 4  Privacy-preserving transport (optional)
         HTTPS | Tor onion-service mirror | direct IPFS retrieval
                    |
Layer 3  Decentralized discovery
         IPNS | signed manifest | DNS/DNSLink | onion address publication
                    |
Layer 2  Content-addressed public state
         IPFS CIDs | independent pins | immutable evidence objects
                    |
Layer 1  Signed project/identity state
         public keys | signed manifests | credential/status records
                    |
Layer 0  Local control
         user/device keys | hardware/offline backup | explicit consent
```

Each layer can be replaced or multiplied without changing the layer beneath it.

## Layer 0 — local control

The root of the onion is local control of credentials and signing material.

Requirements:

- private keys are generated and stored outside the public repository;
- signing operations are explicit and auditable;
- recovery material is never published;
- key rotation and revocation are supported;
- identity evidence does not require publication of government documents or unnecessary personal information.

This layer is the trust root for MyZubster technical identity, but it is not a claim of government/legal identity.

## Layer 1 — signed project and identity state

Self-attested identity artifacts, bounty policy, public manifests and future credentials should be signed by project-controlled public keys.

A verifier should be able to answer independently:

- who signed the object;
- whether the signature is valid;
- whether the signing key is current or revoked;
- whether the object was modified after signing.

A signature validates control of a key. It does not automatically validate every claim contained in the signed object.

## Layer 2 — content-addressed state

Sanitized public state is published as immutable content-addressed objects.

Typical objects include:

- identity attestations;
- public evidence metadata;
- bounty definitions;
- public reward-accounting snapshots;
- comic/publication metadata;
- environmental/public observation snapshots.

Every published root manifest should reference child objects by CID and, where useful, by SHA-256.

At least two independent pinning locations are recommended for important public roots. A pin is a replication mechanism, not an authorization mechanism.

## Layer 3 — decentralized discovery

No single website should be the only way to discover the current MyZubster public root.

The same current root may be advertised through several independent discovery channels:

```text
IPNS name ---------+
DNSLink ------------+--> signed current-root manifest --> immutable CIDs
GitHub release -----+
onion mirror -------+
```

Clients should prefer cryptographic verification over trusting the discovery channel. A compromised DNS record or web page must not be sufficient to replace a correctly signed root.

## Layer 4 — optional Tor onion-service transport

A Tor onion-service mirror can be added as an **optional transport and availability layer** for public MyZubster resources.

Its purpose is resilience and privacy-preserving access, not the creation of a separate source of truth.

Rules:

- the onion endpoint serves the same public, sanitized artifacts available through other legitimate retrieval paths;
- the onion hostname is published in a signed manifest before clients trust it;
- the onion service private key is never committed to source control;
- no sensitive identity records, credentials, private infrastructure data or illegal content are introduced simply because the transport uses Tor;
- clients still verify signatures/CIDs after retrieval.

The onion service is therefore a mirror, not an authority.

## Layer 5 — service redundancy

Application and API availability should not depend on one gateway.

Target model:

```text
client
  |
  +--> gateway A
  +--> gateway B
  +--> read-only public mirror
  +--> direct IPFS retrieval for public immutable state
```

For write operations, clients must know which services are authorized to accept a mutation. Replication alone must not turn an untrusted mirror into an authorized writer.

Public read paths and privileged write paths should remain distinct.

## Layer 6 — independent verification

Critical decisions should be independently verifiable and, where appropriate, support multiple verifier implementations.

Examples:

- identity artifact signature verification;
- bounty evidence validation;
- settlement verification;
- published-root consistency checks;
- content hash/CID verification.

A future quorum mode may require agreement from multiple distinct verifier keys for high-sensitivity transitions. Until the backend actually enforces such a threshold, documentation must call it **proposed**, not active.

## Canonical decentralized manifest

The onion is coordinated by a small signed public manifest. A minimal example is stored in [`decentralized-onion.manifest.json`](./decentralized-onion.manifest.json).

The manifest contains discovery and retrieval information only. It must never contain secrets.

Recommended fields:

- schema/version;
- project name;
- current root CID/IPNS reference;
- authorized public signing keys or references;
- HTTPS mirrors;
- Tor onion mirrors when active;
- independent pin providers/nodes expressed without private infrastructure details;
- verifier public endpoints/keys when suitable for publication;
- previous-manifest hash or CID for continuity;
- issued/expiry timestamps.

## Client verification flow

```text
1. Discover candidate manifest from any available channel.
2. Verify manifest signature against an accepted project key.
3. Check key/status/expiry rules.
4. Resolve the current root CID.
5. Retrieve content from any available transport.
6. Verify CID/hash locally.
7. For high-sensitivity state, request independent verifier confirmation.
8. Only then present the state as verified.
```

This allows discovery and transport to be untrusted while preserving end-to-end verification.

## Failure model

The onion should degrade gracefully:

- website unavailable -> use IPNS, IPFS gateway, onion mirror or another mirror;
- one IPFS pin disappears -> retrieve from another pin/provider;
- DNS poisoned -> reject content that fails signature/CID verification;
- one gateway compromised -> public immutable objects remain independently verifiable;
- one verifier fails -> use another verifier where policy permits;
- signing key compromised -> publish signed revocation/rotation from the recovery process and stop trusting the affected key.

## Privacy boundary

Decentralization must not mean irreversible over-publication.

Do not publish to immutable/public layers:

- government identity documents;
- private keys or recovery material;
- passwords/tokens;
- precise sensitive geolocation;
- private health/biometric data;
- private correspondence;
- unnecessary personally identifying information.

Where evidence is sensitive, publish only the minimum public metadata/hash needed for verification and keep the underlying object in an access-controlled store.

## Implementation phases

### Phase A — manifest and verification

- publish signed decentralized manifest schema;
- add deterministic local verification tooling;
- document key rotation/revocation;
- publish root CID consistently across multiple discovery channels.

### Phase B — independent availability

- establish multiple independent IPFS pins;
- expose at least two public retrieval paths;
- test recovery when the primary web/gateway path is unavailable.

### Phase C — onion mirror

- deploy an optional read-only Tor onion-service mirror;
- publish its hostname in the signed manifest;
- verify byte/content equivalence with the canonical CIDs;
- do not expose administrative interfaces over the public mirror.

### Phase D — verifier diversity

- publish an open verifier implementation;
- support independently operated verifier instances;
- define a future quorum policy for high-sensitivity state transitions only after distinct-verifier enforcement exists.

## What this does not claim

This architecture does not claim that:

- MyZubster currently runs a decentralized consensus network;
- Tor makes data trustworthy;
- IPFS provides authorization or financial consensus;
- every gateway is permissionless;
- MYZ is automatically an on-chain asset;
- a self-attested identity becomes a legal identity because it is signed or replicated.

The objective is narrower and testable: **reduce single points of failure while making public MyZubster state independently retrievable and cryptographically verifiable.**
