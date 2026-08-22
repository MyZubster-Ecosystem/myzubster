# MYZ Proof-of-Contribution & Verified Action Rewards

## Purpose

MYZ Proof-of-Contribution is a reward framework for lawful, attributable and independently verifiable contributions to the MyZubster ecosystem.

It must **never reward illegal activity itself**. Rewards are only eligible for lawful actions such as authorized research, responsible disclosure, verification, remediation, environmental observation, data validation, documentation, recovery, moderation and other approved public-interest contributions.

## Core model

```text
ACTION / CONTRIBUTION
        ↓
EVIDENCE PACKAGE
        ↓
CONTRIBUTION ID
        ↓
POLICY + SCOPE CHECK
        ↓
VERIFIER QUORUM
        ↓
ANTI-DUPLICATE / ANTI-SYBIL
        ↓
REWARD DECISION
        ↓
MYZ LEDGER ENTRY
```

## Contribution ID

Each submission receives a deterministic identifier derived from canonicalized metadata and evidence hashes.

Recommended logical form:

```text
contribution_id = SHA256(
  schema_version |
  bounty_id |
  actor_pseudonymous_id |
  scope_id |
  action_type |
  evidence_root_hash |
  submitted_at_bucket
)
```

The implementation must canonicalize the payload before hashing. Raw private data must not be included in public identifiers.

## Eligible action types

- `DISCOVERY` — lawful discovery of an issue, ecological observation, defect or verifiable opportunity.
- `VERIFICATION` — independent validation of evidence or a claimed result.
- `REMEDIATION` — fixing or mitigating a verified issue.
- `RETEST` — proving that remediation works.
- `DOCUMENTATION` — producing reproducible technical or ecological documentation.
- `DATA_VALIDATION` — checking datasets, measurements, provenance or metadata.
- `RECOVERY` — lawful harm reduction, restoration or recovery work.
- `PUBLIC_INTEREST_REPORT` — responsible reporting performed within applicable law and policy.

## Explicitly ineligible

- committing, facilitating or monetizing illegal activity;
- unauthorized exploitation or intrusion;
- stolen credentials, private data or access tokens;
- extortion, coercion, ransom or threats;
- fabricated evidence;
- duplicate submissions presented as new work;
- self-verification where independent verification is required;
- bypassing access controls to collect evidence;
- rewards based on criminal notoriety or harmful impact.

An ineligible action has reward value `0 MYZ` regardless of technical novelty.

## Trust and reward are separate

Trust is non-transferable. MYZ rewards may be transferable according to project policy, but a token balance must never equal authority or reputation.

```text
Trust Score =
  verified contribution history
+ evidence quality
+ verifier reliability
+ policy compliance
+ dispute history

Reward =
  approved bounty value
× completion factor
× verification factor
```

Do not allow users to purchase Trust Score with MYZ.

## Evidence package

A bounty submission should include, where applicable:

- `bounty_id`
- `scope_id`
- `actor_pseudonymous_id`
- `action_type`
- `description`
- `evidence[]` containing SHA-256 hashes and public-safe references
- `reproduction_or_validation_steps`
- `impact`
- `remediation_reference`
- `submitted_at`
- `conflict_of_interest`

Secrets, seed phrases, private keys, raw credentials and unnecessary personal data must never be included.

## Verification states

```text
DRAFT
  ↓
SUBMITTED
  ↓
SCOPE_CHECKED
  ↓
UNDER_VERIFICATION
  ↓
VERIFIED | REJECTED | NEEDS_MORE_EVIDENCE
  ↓
REWARDED | CLOSED_NO_REWARD
  ↓
FINAL
```

## Verifier quorum

Default policy:

- low-risk bounty: 1 independent verifier;
- medium-risk bounty: 2 independent verifiers;
- high-risk/security-sensitive bounty: 2+ verifiers and one maintainer approval;
- disputes: verifier not involved in the original decision.

No verifier may approve their own contribution.

## Anti-duplicate rules

Before reward approval:

1. compare `evidence_root_hash` with prior submissions;
2. compare claimed scope and affected object;
3. compare linked issue/PR/commit identifiers;
4. flag near-duplicate descriptions for human review;
5. reject exact duplicates unless the bounty explicitly pays for repeated independent verification.

## Anti-Sybil rules

- pseudonyms are allowed, but contribution history must remain internally consistent;
- one human controlling multiple accounts may not claim the same bounty multiple times;
- quorum must avoid obviously related verifier identities;
- high-value rewards may require stronger contributor verification without making that information public.

## Reward calculation

A simple deterministic starting model:

```text
final_reward_myz = base_reward_myz
                 × completion_factor
                 × verification_factor
                 × impact_factor
```

Suggested ranges:

- `completion_factor`: 0.0–1.0
- `verification_factor`: 0.8–1.2
- `impact_factor`: 0.5–1.5

The final amount must never exceed `max_reward_myz` declared by the bounty unless a maintainer explicitly amends the bounty before settlement.

## Example

```text
Bounty: verify and document soil-observation metadata
Base reward: 120 MYZ
Completion: 1.0
Verification: 1.0
Impact: 1.1
Final reward: 132 MYZ
```

## Security bounty rule

For security-related work, the system rewards only actions carried out under explicit authorization and scope.

```text
illegal activity itself          → 0 MYZ
authorized security research     → eligible
responsible disclosure           → eligible
verified remediation             → eligible
retest after remediation         → eligible
harm reduction / recovery        → eligible
```

## Settlement

A reward record should contain:

- contribution ID;
- bounty ID;
- approved MYZ amount;
- verifier decision hashes;
- settlement status;
- optional external payment reference;
- timestamp;
- final evidence root hash.

If an external chain/payment system is used, that transaction is a settlement reference, not proof of the underlying work by itself.

## Principle

**Reward verified lawful contribution, not harmful activity. Trust comes from evidence and repeatable verification, not token ownership.**
