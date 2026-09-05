# Zorgax LIFE participant orchestrator

**Status:** ENABLED FOR MONITORING / HUMAN-GATED FOR CHANGES  
**Scope:** internal MyZubster / Zorgax LIFE digital pilot only.

This orchestrator applies the participant automation playbook across the pilot without treating contributors, candidates or interested organisations as LIFE partners.

## Core rule

Automation is enabled only after explicit participant opt-in. Public GitHub contribution evidence, an invitation, an issue comment, attendance interest or candidate status is not consent to participant-profile processing.

## Registry separation

The LIFE/Zorgax system now keeps four evidence layers separate:

- internal participants: `participant-registry.json`;
- public contributor evidence: `docs/CONTRIBUTORS.md`;
- LIFE-aligned contributor candidate lanes: `docs/life-2027/CONTRIBUTOR_POOL.md`;
- organisations, pilot sites and formal partner states: `docs/life-2027/STAKEHOLDER_REGISTRY.md` and `stakeholder-registry.json`.

```text
PARTICIPANT ≠ CONTRIBUTOR ≠ PILOT CANDIDATE ≠ FORMAL PARTNER
```

No state may be copied from one registry into another without the evidence required by the destination layer.

## Discovery loop

The monitor checks for new, explicit participation signals in the existing public entry points and for authorized participant updates in connected Gmail/GitHub sources.

Candidate discovery sources:

- contributor onboarding / LIFE lanes: #742;
- global/country interest: #833;
- real pilot interest: #834;
- event interest: #835;
- metaverse interest: #836;
- missions/LIFE technical interest: #837.

A new participant signal is classified as one of:

- `CANDIDATE_ONLY` — interest or public contribution evidence, but no participant consent;
- `CONSENT_PENDING` — participation intent is plausible but consent scope is incomplete;
- `CONSENT_CONFIRMED` — explicit, participant-specific consent is present;
- `PARTICIPANT_UPDATE` — new authorized evidence from an already confirmed participant;
- `REVOKED_OR_RESTRICTED` — consent changed; processing must stop or narrow immediately.

Organisation/pilot relationship signals must use the stakeholder states in `STAKEHOLDER_REGISTRY.md`, from `DISCOVERED` / `CANDIDATE` through `FORMAL_CONFIRMED`. Only sufficiently verified formal evidence may produce `FORMAL_CONFIRMED`.

## Activation

For `CONSENT_CONFIRMED` participant status only:

1. create or update a registry entry using public/non-sensitive identifiers;
2. keep private contact details out of the public repository;
3. create a participant-specific Gmail sender filter using the verified address outside the public registry;
4. process new messages as `NO_ACTION`, `NEEDS_CLARIFICATION` or `UPDATE_PREPARED`;
5. minimize and anonymize relayed interview evidence;
6. create or reuse a dedicated branch and pull request;
7. run CI/test, security, privacy/evidence checks;
8. stop for human review.

Contributor candidates follow a separate activation gate: verified public contribution evidence may create a `CANDIDATE_ONLY` entry, but a LIFE-aligned task requires explicit opt-in/claim. No private Gmail processing is activated merely because a GitHub contribution exists.

## Prohibited automatic actions

- no automatic email sending;
- no bulk outreach to candidates;
- no scraping public email addresses;
- no automatic merge;
- no direct `main` writes from the participant automation;
- no publication of private contact details;
- no payments, pricing changes, legal commitments or access-management changes;
- no claim that a contributor/candidate is a LIFE partner, consortium member or EU-funded participant;
- no promotion of an organisation to `FORMAL_CONFIRMED` from interest, attendance, technical fit, an unanswered outreach message or an informal mention.

## Current participant/contributor registry

Machine-readable participant/candidate state is stored in `participant-registry.json`.

Current state recorded on 2026-08-31:

- Nicola: confirmed internal pilot participant, automation enabled, validation active, current evidence verdict `NEEDS_CLARIFICATION`;
- `@Aming9303`: invited candidate contributor, automation disabled;
- `@wasim-builds`: invited candidate contributor, automation disabled;
- `@ghzhost`: candidate contributor, automation disabled;
- `@laurentketterle-hub`: candidate contributor with merged public contribution evidence, automation disabled;
- `@foxxx009`: candidate contributor, automation disabled;
- `@leanworld7-netizen`: candidate contributor, automation disabled;
- `@rafaio1`: candidate contributor, automation disabled.

None of the contributor candidates has participant consent inferred from GitHub activity.

## Current stakeholder/partner state

The public stakeholder registry records candidate pilot contexts and unfilled roles separately. As of 2026-08-31, it contains no external organisation with sufficient public evidence for `FORMAL_CONFIRMED` LIFE partner/consortium status.

## Human gate

The orchestrator may detect, classify and prepare changes. A maintainer remains responsible for accepting participant scope, reviewing pull requests, confirming institutional relationship states and approving any public or sensitive action.
