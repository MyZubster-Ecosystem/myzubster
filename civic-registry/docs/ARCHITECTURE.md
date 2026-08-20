# MYZ-DCR Architecture

## Purpose

The MyZubster Digital Civic Registry separates identity, provenance and storytelling into interoperable layers.

The public GitHub repository is the canonical prototype registry, not the storage location for secrets or full private identity profiles.

## Logical architecture

```text
                         USER
                          |
                          v
                 +------------------+
                 | MyZubster client |
                 +--------+---------+
                          |
          +---------------+----------------+
          |                                |
          v                                v
+-------------------+            +--------------------+
| Private identity  |            | Public MYZ-DCR     |
| service / wallet  |            | registry           |
| (future)          |            | Git + JSON records |
+---------+---------+            +---------+----------+
          |                                |
          | public proofs only             | references
          +---------------+----------------+
                          |
                          v
                 +-------------------+
                 | Character / story |
                 | provenance        |
                 +---------+---------+
                           |
          +----------------+----------------+
          |                                 |
          v                                 v
+--------------------+            +--------------------+
| MyZubster-Visual   |            | Other content      |
| canonical visuals  |            | store / IPFS       |
+--------------------+            +--------------------+
                           
Public registry facts can then be consumed by:

- MyZubster applications;
- Zorgax / RAG systems;
- public APIs;
- audit tools;
- future federation nodes.
```

## Trust boundaries

### 1. Private identity boundary

Real-world identity material and recovery secrets must remain outside the public repository. The prototype intentionally does not define storage for legal documents or secret key material.

### 2. Public registry boundary

GitHub contains only public-safe records that are intentionally publishable. Each record should be small, versioned and auditable.

### 3. Narrative boundary

A narrative character is not automatically the same thing as a legal or real-world identity. A person can use a pseudonymous public character while keeping private identity information outside the public registry.

### 4. AI boundary

AI may summarize or creatively transform verified context, but AI output cannot create an identity claim by itself. Identity, authorship and ownership claims require explicit registry evidence.

## Canonical objects

### Identity record

Defines a stable `myz_id`, record type, public display information, verification status, optional public-key references and lifecycle state.

### Character record

Defines the narrative identity associated with a MYZ-ID: character name, series, visual references and optional world/canon metadata.

### Contribution record

Defines a public-safe contribution or real-world event: description, evidence references, review status, provenance hashes and links to narrative artifacts.

### Registry entry

Connects the three object types without requiring binaries to live in the registry.

## Identifier model

Prototype identifiers use human-readable prefixes:

```text
MYZ-PERSON-000001
MYZ-ENTITY-000001
MYZ-CHAR-000001
MYZ-CONTRIB-000001
```

Production generation should avoid sequential identifiers if enumeration creates privacy or abuse risks. A later version may use UUIDv7, multibase identifiers or DID-compatible identifiers.

## Verification flow

```text
CLAIM
  |
  v
PUBLIC-SAFE EVIDENCE
  |
  v
SCHEMA VALIDATION
  |
  v
HUMAN / RULE-BASED REVIEW
  |
  +--> rejected -> no canonical verification claim
  |
  v
ATTESTATION / STATUS
  |
  +--> optional cryptographic signature
  |
  v
CANONICAL REGISTRY RECORD
```

## Git as prototype ledger

Git provides useful properties for the prototype:

- immutable commit history in normal workflows;
- reviewable diffs;
- timestamps and provenance metadata;
- public mirroring;
- signed commits/tags can be added later.

Git is not treated as a blockchain and does not by itself prove legal identity.

## Future federation

The long-term model should allow MyZubster to verify identities it does not centrally own.

```text
MYZ-DCR root rules
       |
       +-- MyZubster registry
       +-- community registry A
       +-- community registry B
       +-- user-controlled identity document
       +-- verifiable credential issuer
```

The objective is to move from "MyZubster says this identity exists" toward "the identity can present a proof that MyZubster can independently verify."
