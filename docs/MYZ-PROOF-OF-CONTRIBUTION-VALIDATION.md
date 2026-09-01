# MYZ Proof-of-Contribution Validation

Validation target: bounty `MYZ-BTY-POC-001` in issue #620.

## Result

The schema is valid JSON Schema Draft 2020-12 after the scoped corrections in
this contribution. The specification documents the required state transitions,
independent verifier quorum, anti-duplicate checks, self-verification prohibition
and lawful-contribution boundary. The MYZ bounty issue form captures authorized
scope, exclusions, evidence, base/maximum reward and acceptance criteria.

## Findings

### F-01: high-risk controls were optional

The high-risk conditional constrained `required_verifiers` and
`maintainer_approval_required` only when those properties were present. JSON Schema
`default` values are annotations and do not insert missing data, so a high-risk
bounty with neither property still validated.

Resolution: the high-risk branch now requires both fields, requires at least two
verifiers and requires maintainer approval to be `true`. The conditional branch
also declares its integer and boolean types so strict Draft 2020-12 validators can
compile the schema without relying on type information from a different subschema.

### F-02: legal policy was optional

The schema correctly constrained lawful-only behavior, prohibited unauthorized
access and fixed illegal-activity reward to zero, but the whole `legal_policy`
object could be omitted.

Resolution: `legal_policy` is now a required top-level property. Automated cases
also reject false lawful/prohibition flags and any non-zero illegal-activity reward.

## Specification review

- State path is explicit from `DRAFT` through terminal `FINAL`, with
  `VERIFIED`, `REJECTED` and `NEEDS_MORE_EVIDENCE` review outcomes.
- Low risk requires one independent verifier; medium requires two; high risk
  requires at least two plus maintainer approval.
- A verifier cannot approve their own contribution.
- Exact duplicates are rejected unless repeated independent verification is an
  explicit bounty objective; near duplicates require human review.
- Illegal activity, unauthorized access, fabricated evidence and stolen secrets
  are explicitly ineligible and worth `0 MYZ`.
- External settlement is a separate reference and does not prove the underlying work.

## Issue-template review

`.github/ISSUE_TEMPLATE/myz-bounty.yml` requires:

- action type and authorized scope;
- explicit exclusions and deliverables;
- base and maximum MYZ rewards;
- risk level;
- evidence requirements and acceptance criteria;
- acknowledgement of lawful-only work, no unauthorized activity and no secret data.

Risk level remains the source for verifier-quorum policy. Enforcement belongs to
the schema and reviewer workflow rather than duplicating conditional logic in the
GitHub issue form.

## Reproduction

```bash
npm install
npm test -- --runInBand tests/myzProofOfContributionSchema.test.js
```

The test suite validates the schema against the Draft 2020-12 meta-schema and
covers lawful low-risk input, required legal policy, high-risk quorum and approval,
and unsafe policy overrides.

## Residual boundaries

Narrative checks such as contributor identity relationships, near-duplicate meaning,
evidence quality and verifier independence cannot be fully established by structural
JSON Schema. They remain explicit manual-review requirements in the specification.
