# MYZ-DCR Privacy and Threat Model

## Privacy objective

The public registry should prove as little as necessary while still allowing useful verification.

A public MYZ-ID does not require publication of a legal name.

## Data minimization rules

Public records should prefer:

- opaque/stable identifiers;
- pseudonymous display names;
- public keys;
- hashes of evidence instead of private evidence itself;
- URLs to intentionally public artifacts;
- narrow attestations such as "contribution reviewed" instead of broad identity claims.

## Prohibited public material

Never place the following in MYZ-DCR records:

- private cryptographic keys;
- seed/recovery phrases;
- passwords or tokens;
- copies of passports, ID cards or tax documents;
- private residential addresses;
- private phone numbers;
- private email addresses without explicit publication intent;
- biometric templates;
- health or similarly sensitive personal records;
- evidence that exposes unrelated third parties.

## Threats

### Identity inference

**Threat:** AI or humans infer real identity, ownership or authorship from filenames, account names, repositories or paths.

**Control:** registry consumers must treat those signals as non-authoritative. Claims require explicit canonical evidence.

### Doxxing through aggregation

**Threat:** individually harmless records combine to reveal a person's location, routine or private identity.

**Control:** minimize fields, avoid precise location by default, review public records for aggregation risk and allow de-publication/revocation procedures.

### Key compromise

**Threat:** a public identity's signing key is compromised.

**Control:** future versions need key rotation, revocation and recovery records. Private keys never belong in Git.

### False verification

**Threat:** a record is labelled `verified` without defining what was actually verified.

**Control:** use explicit statuses and claim-specific attestations. Avoid a single universal boolean.

### Narrative confusion

**Threat:** a fictional character or AI-generated story is interpreted as a factual identity statement.

**Control:** keep narrative character data separate from identity claims and mark fictional/creative artifacts clearly.

### Evidence tampering

**Threat:** linked evidence changes after review.

**Control:** include cryptographic hashes for evidence or artifacts when appropriate, together with timestamps and canonical references.

### Repository takeover or history rewrite

**Threat:** repository permissions are abused or branch history is force-rewritten.

**Control:** protected branches, required reviews, signed commits/tags, mirrors and external transparency snapshots are recommended for production.

## Privacy-preserving publication pattern

```text
PRIVATE EVIDENCE
      |
      | review
      v
NARROW PUBLIC CLAIM
      |
      +-- hash/proof reference
      +-- verifier/attestation reference
      +-- timestamp
      |
      v
PUBLIC REGISTRY
```

The public registry should not become a database of private identity documents.

## Right to change and revoke

A production system must support:

- correction of inaccurate public claims;
- revocation of compromised keys;
- retirement of characters or identities;
- replacement of outdated public references;
- retention rules that respect applicable privacy requirements.

Git history complicates deletion. Therefore personal data minimization must happen **before** information is committed.

## Onion access

Tor/Onion access can improve network privacy but does not automatically anonymize application data. A user who voluntarily publishes identifying information in a registry remains identifiable from that information.

Network privacy and data privacy are separate layers and must be designed separately.
