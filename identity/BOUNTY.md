# MyZubster Identity Bounty Program

This program rewards verifiable work that improves the integrity, reproducibility and technical assurance of the MyZubster digital identity proof.

It operates under the repository-wide [`BOUNTIES.md`](../BOUNTIES.md). Where this document is narrower, this document governs the identity scope. It must not weaken the canonical privacy, verification or settlement rules.

## Reward asset

All rewards in this identity program are denominated exclusively in **MYZ**.

Current platform truth: MYZ is the MyZubster internal reward/accounting unit. A recorded or approved MYZ reward is not automatically an on-chain transfer and must not be described as such unless independent settlement evidence exists.

No fiat equivalence is promised and no automatic EUR/USD conversion applies.

## Scope

Eligible work includes:

- detecting incorrect, stale or contradictory public identity metadata;
- reproducing and verifying the published SHA-256 integrity reference;
- identifying broken verification links or provenance gaps;
- improving the machine-readable identity schema;
- implementing an open-source verifier for the identity artifact;
- adding cryptographic signing or signature verification;
- proposing privacy-preserving verification improvements;
- implementing W3C Verifiable Credential / DID-compatible representations where technically justified;
- identifying impersonation or substitution weaknesses in the MyZubster-controlled identity verification flow.

## Out of scope

Do not:

- request, collect or publish government identity documents;
- request SPID/CIE credentials, authentication codes, recovery codes or passwords;
- collect private keys, wallet seeds or signing secrets;
- attempt account takeover, credential theft, phishing or persistence;
- attack third-party systems or accounts;
- perform denial-of-service or destructive testing;
- publish sensitive vulnerabilities before maintainers have had a reasonable opportunity to remediate them;
- expose unnecessary personal information.

## Reward bands

| Severity / contribution | Default reward |
| --- | ---: |
| Low | 100 MYZ |
| Medium | 500 MYZ |
| High | 2,500 MYZ |
| Critical | 10,000 MYZ minimum |

Maintainers may publish a different MYZ amount for a specific challenge before work begins. A higher reward is not automatic merely because a submitter labels a finding as critical.

### Typical examples

**Low — 100 MYZ**

- broken link;
- typo that affects verification;
- stale public metadata;
- reproducible formatting/schema inconsistency.

**Medium — 500 MYZ**

- incorrect canonicalization guidance;
- hash-verification defect;
- material schema problem;
- useful independent verification tooling.

**High — 2,500 MYZ**

- practical identity-artifact substitution weakness;
- signature verification bypass in an implemented verifier;
- reproducible provenance flaw that could mislead a verifier.

**Critical — 10,000+ MYZ**

- reproducible full impersonation of the technical identity within the authorized MyZubster verification flow;
- compromise of a production signing/verification design that would allow forged identity assertions without detection.

Critical testing must remain non-destructive and within MyZubster-controlled systems explicitly in scope.

## Positive bounties

The program also rewards constructive contributions, not only vulnerabilities. Published challenges may cover:

- deterministic verifier implementation;
- signed credential format;
- DID/VC interoperability;
- key rotation and credential status/revocation design;
- privacy-preserving selective disclosure;
- independent provenance attestations;
- automated CI verification of identity artifacts.

## Submission lifecycle

```text
OPEN
  -> CLAIMED (optional)
  -> SUBMITTED
  -> UNDER_REVIEW
  -> VERIFIED | REJECTED | DUPLICATE
  -> REWARD_RECORDED
  -> PAID/SETTLED only when the applicable MYZ ledger/settlement evidence supports that state
```

A pull request, merged commit, issue label or maintainer comment does not by itself prove payment.

## Evidence requirements

A submission should include:

1. bounty/challenge ID;
2. concise description;
3. exact reproduction steps;
4. expected vs actual result;
5. affected artifact/version/commit;
6. evidence sufficient for an independent reviewer;
7. remediation proposal when practical;
8. statement that no secrets or unnecessary personal data were collected.

For sensitive security findings, do not publish exploit details before remediation. Use a private disclosure path designated by the maintainers.

## Duplicate and prior-art policy

The first independently reproducible submission normally receives the reward. Later duplicates may be closed without reward unless they materially improve the evidence or remediation.

Publicly documented issues, already-known maintainer findings and previously submitted reports are normally ineligible unless a challenge explicitly says otherwise.

## Reward decisions

Maintainers determine validity, severity and final MYZ amount using reproducibility, impact, exploitability, quality of evidence and remediation value.

Rewards are recorded in [`rewards.json`](./rewards.json). Open opportunities are listed in [`challenges.json`](./challenges.json) and/or GitHub Issues.

## Privacy

Identity verification should minimize personal data. Public evidence should rely on public project references, cryptographic commitments, signatures, hashes and sanitized metadata wherever possible.

The objective is to make the **technical/project identity** harder to forge and easier to verify — not to publish more personal information.
