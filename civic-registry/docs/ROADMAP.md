# MYZ-DCR Roadmap

## Phase 0 — Canonical model

Status: prototype

- define MYZ-DCR vocabulary;
- separate private, public and narrative identity layers;
- publish schemas;
- create non-personal demo records;
- prohibit identity inference from repository/account metadata.

## Phase 1 — Registry service

- add schema validation in CI;
- add an API for reading public MYZ-DCR records;
- generate stable identifiers safely;
- create submission/review workflow;
- record artifact hashes and provenance;
- expose machine-readable status endpoints.

## Phase 2 — Character and comic integration

- bind a character record to a MYZ-ID;
- connect reviewed contributions to comic episodes;
- reference canonical binaries in `MyZubster-Visual`;
- publish user timelines without exposing private evidence;
- define cross-character collaboration events.

## Phase 3 — Cryptographic identity

- define supported public-key formats;
- add signed attestations;
- add key rotation and revocation;
- evaluate W3C Verifiable Credentials;
- evaluate DID-compatible identifiers where useful;
- separate issuer, subject and verifier roles.

## Phase 4 — User-controlled storage

- allow identity documents and story metadata to live outside the central GitHub repository;
- support IPFS/content-addressed references where appropriate;
- support user-owned repositories or wallets;
- maintain canonical hashes and attestations without owning user content.

## Phase 5 — Federation

- allow independent MyZubster communities or compatible registries;
- publish trust and verification rules;
- define registry discovery;
- permit cross-registry character and contribution verification;
- make MyZubster a verifier/protocol participant rather than a permanent single authority.

## Phase 6 — Narrative metaverse layer

- portable characters;
- shared canon events;
- persistent relationships between characters;
- AR/VR/3D interfaces as optional presentation layers;
- identity and provenance remain independent of any specific visual interface.

## Success criteria

The project succeeds when a user can:

1. create a public-safe MYZ identity;
2. create a character without exposing unnecessary real-world identity data;
3. submit a contribution with provenance;
4. receive a narrowly defined review/attestation;
5. connect that contribution to a comic/story artifact;
6. prove authorship/control using cryptographic means in later phases;
7. move or mirror their identity/story without losing verifiability.
