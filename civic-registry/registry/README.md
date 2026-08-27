# Public Registry Records

This directory is reserved for canonical public-safe MYZ-DCR records.

## Rules

1. Every record must validate against an approved schema.
2. Do not add private or sensitive identity data.
3. A filename, GitHub username, repository path or commit is never sufficient proof of identity, authorship or ownership.
4. Verification status must describe the exact evidence level.
5. Large binaries should be referenced by canonical URL/hash rather than duplicated here.
6. Private keys and recovery secrets are forbidden.
7. Records that affect another person should not be published without a documented lawful/consensual basis.

## Suggested layout

```text
registry/
  people/
  entities/
  characters/
  contributions/
  attestations/
```

Directories can be introduced as real records are approved. The prototype intentionally ships only fictional data under `examples/`.

## Review principle

A pull request adding or changing a registry record should answer:

- What exact claim is being made?
- What evidence supports that claim?
- Is the evidence safe to publish?
- Does the record expose unnecessary personal data?
- Is the verification status accurate?
- Is there a revocation/correction path?

The registry records claims; it does not infer them.
