# Visual #016 — Security / Trust Boundaries

This package visualizes the documented security and trust model of MyZubster without turning policy text into a claim of absolute security.

## Sources

- `SECURITY.md`
- `docs/MYZ-PROOF-OF-CONTRIBUTION.md`
- existing Gateway, runtime-evidence and evidence-ledger views

## Core model

```text
UNTRUSTED INPUT
      ↓
SCOPE / AUTHORIZATION
      ↓
SANITIZE + VALIDATE
      ↓
EVIDENCE PACKAGE
      ↓
INDEPENDENT VERIFICATION
      ↓
TRUST DECISION
      ↓
REWARD / SETTLEMENT BOUNDARIES
```

## Security boundaries

- public identity labels do not create trust;
- authorization must be explicit for security testing;
- secrets and unnecessary personal data must stay out of public evidence;
- a hash proves integrity of referenced bytes, not truth of the underlying claim;
- self-verification is not sufficient where independent verification is required;
- MYZ rewards are separate from authority and reputation;
- runtime health and settlement finality are separate evidence domains;
- vulnerability details should use private disclosure channels rather than public issues.

## Important non-claims

This visual does **not** claim that MyZubster is vulnerability-free, independently audited, penetration-tested, formally verified or production-secure. It only represents the public controls, policies and trust boundaries currently documented by the project.
