# MyZubster Digital Civic Registry (MYZ-DCR)

MYZ-DCR is the public-safe identity, character and contribution registry for the MyZubster ecosystem.

It is inspired by the idea of a digital civic registry: MyZubster can record that an ecosystem identity exists, which public character belongs to it, which contributions have been reviewed, and where its public narrative artifacts live.

**MYZ-DCR is not a government registry, legal identity provider, KYC system or completed decentralized identity (DID) implementation.** It is an open-source foundation for verifiable ecosystem identity.

## Core principle

> MyZubster must verify identity claims from canonical evidence. It must not infer identity, ownership or authorship from usernames, repository names, paths, commits or visual resemblance.

## Three identity layers

```text
PRIVATE IDENTITY LAYER
real-world identity / recovery data / private credentials
NEVER committed to this repository
                |
                v
PUBLIC REGISTRY LAYER
MYZ-ID / public keys / attestations / hashes / public metadata
                |
                v
NARRATIVE IDENTITY LAYER
character / comic series / timeline / public contributions
```

## Lifecycle

```text
PERSON
  |
  v
create a MyZubster identity
  |
  v
receive a stable MYZ-ID
  |
  +--> optionally bind public keys / signed attestations
  |
  v
create a narrative character
  |
  v
submit real-world contribution + public-safe evidence
  |
  v
review / verification
  |
  v
comic, visual or story artifact
  |
  v
MyZubster Visual / external canonical storage
```

## Repository layout

- `civic-registry/schemas/` — JSON Schemas for public registry objects.
- `civic-registry/registry/` — public-safe canonical records.
- `civic-registry/examples/` — non-personal demo records.
- `civic-registry/docs/` — architecture, privacy model and roadmap.

## Relationship with MyZubster Visual

MYZ-DCR stores identity and provenance references. Large visual binaries remain canonical in `MyZubster-Visual` or another explicitly declared content store.

A registry entry may therefore reference a comic or visual without duplicating the binary.

## What must never be committed

Do not commit:

- private keys or seed phrases;
- passwords, access tokens or recovery secrets;
- government identity documents;
- private addresses, phone numbers or private email addresses;
- biometric templates;
- confidential evidence;
- unredacted personal data that is not intentionally public.

## Verification vocabulary

MYZ-DCR separates states instead of using one ambiguous `verified` flag:

- `unverified` — record exists but no identity evidence has been reviewed;
- `self_attested` — the subject has declared the information;
- `reviewed` — MyZubster review confirms the declared public evidence according to documented rules;
- `cryptographically_verified` — a documented cryptographic proof validates the relevant claim.

These statuses describe the specific registry claim. They do not imply legal identity verification.

## Design goals

1. Stable public identifiers.
2. Privacy by data minimization.
3. Evidence before inference.
4. Explicit provenance.
5. Portable characters and stories.
6. Human-readable and machine-readable records.
7. Future compatibility with signatures, verifiable credentials and decentralized storage.
8. No dependency on AI as a source of truth.

## Status

Version: `0.1.0-prototype`

This directory defines the first public architecture. Production identity verification, cryptographic key management, revocation and recovery are future work.
