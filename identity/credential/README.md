# Signed Technical Identity Credential

This directory defines a minimal Ed25519-signed representation of the MyZubster self-attested technical identity. It does not turn that statement into a government identity, legal identity certification, SPID/CIE proof, or qualified electronic signature.

## Trust model

Verification requires two separate inputs:

1. a signed credential; and
2. a trusted-key registry obtained from the canonical MyZubster repository.

The credential references a `key_id`, but it does not embed or choose its own trusted key. The verifier recomputes each public-key fingerprint and rejects unknown, substituted, inactive, or revoked keys.

## Credential fields

- `schema_version`: `myzubster-technical-identity/v1`
- `credential_id`: stable identifier for this assertion
- `key_id`: SHA-256 fingerprint of the Ed25519 SPKI public key
- `issued_at` and `expires_at`: canonical UTC RFC 3339 timestamps (`YYYY-MM-DDTHH:mm:ss[.sss]Z`)
- `subject`: technical project name and canonical GitHub organization
- `claims`: explicitly self-attested claims, including `legal_identity_document: false`
- `signature`: base64 Ed25519 signature over canonical JSON with the signature field removed

Canonicalization follows the RFC 8785/JCS data model: object keys are sorted by UTF-16 code units, array order is preserved, numbers use ECMAScript JSON serialization (`-0` becomes `0`), output is compact UTF-8 JSON, and only the top-level `signature` field is excluded. Non-finite numbers and non-JSON values are rejected before signing or verification. Inputs parsed from JSON must not contain duplicate object keys.

## Sign without committing a private key

Generate and store the Ed25519 private key outside the repository using an access-controlled signing environment. Add only its public key and fingerprint to the reviewed trusted-key registry. Then run:

```bash
node identity/credential/sign.mjs unsigned-credential.json /secure/path/private-key.pem signed-credential.json
```

The signer refuses to overwrite the key file and creates a new owner-readable output file. Never commit the private key, seed material, passwords, recovery data, or signing logs containing secrets.

## Verify

```bash
node identity/credential/verify.mjs signed-credential.json trusted-keys.json
```

The command returns machine-readable JSON and exits non-zero for malformed input, tampering, signature substitution, an unknown/inactive/revoked key, fingerprint mismatch, or an invalid/expired validity window.

## Rotation and revocation

1. Generate the replacement key outside the repository.
2. Add its public key as `active` through normal review while the old key remains active.
3. Sign and publish a replacement credential using the new `key_id`.
4. Mark the old key `retired` after the overlap period. Use `revoked_key_ids` immediately when compromise is suspected.
5. Consumers must fetch the registry from the canonical repository over authenticated HTTPS, pin the exact reviewed commit SHA (or a signed release), and apply an application-defined maximum age before verification. Record the source URL, commit SHA, and retrieval time with the verification result. A locally cached registry beyond that policy must not be treated as current status.
6. Preserve dated registry revisions only for audit. Historical validity must never override a current revocation when deciding whether to trust a credential now.

The verifier deliberately reports registry freshness as `not_evaluated`; it cannot establish freshness from arbitrary local JSON. The caller owns source authentication, commit/release verification, refresh policy, and fail-closed handling when the registry cannot be refreshed. No revocation design can recover trust if an attacker can replace both the credential and the canonical repository or its review history. Repository protection and independent release/hash publication remain part of the trust boundary.

## Tests

```bash
node --test identity/credential/credential.test.mjs
```

Tests generate keys only in memory and cover canonicalization, valid verification, payload tampering, signer substitution, revocation, strict timestamps, malformed and duplicate registries, inactive keys, algorithm and fingerprint mismatch, malformed base64, and expiration. No private key fixture is written or committed.
