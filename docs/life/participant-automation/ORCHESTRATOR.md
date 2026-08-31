# Zorgax LIFE participant orchestrator

**Status:** ENABLED FOR MONITORING / HUMAN-GATED FOR CHANGES  
**Scope:** internal MyZubster / Zorgax LIFE digital pilot only.

This orchestrator applies the participant automation playbook across the pilot without treating contributors, candidates or interested organisations as LIFE partners.

## Core rule

Automation is enabled only after explicit participant opt-in. Public GitHub contribution evidence, an invitation, an issue comment, attendance interest or candidate status is not consent to participant-profile processing.

## Discovery loop

The monitor checks for new, explicit participation signals in the existing public entry points and for authorized participant updates in connected Gmail/GitHub sources.

Candidate discovery sources:

- contributor onboarding / LIFE lanes: #742;
- global/country interest: #833;
- real pilot interest: #834;
- event interest: #835;
- metaverse interest: #836;
- missions/LIFE technical interest: #837.

A new signal is classified as one of:

- `CANDIDATE_ONLY` — interest or public contribution evidence, but no participant consent;
- `CONSENT_PENDING` — participation intent is plausible but consent scope is incomplete;
- `CONSENT_CONFIRMED` — explicit, participant-specific consent is present;
- `PARTICIPANT_UPDATE` — new authorized evidence from an already confirmed participant;
- `REVOKED_OR_RESTRICTED` — consent changed; processing must stop or narrow immediately.

## Activation

For `CONSENT_CONFIRMED` only:

1. create or update a registry entry using public/non-sensitive identifiers;
2. keep private contact details out of the public repository;
3. create a participant-specific Gmail sender filter using the verified address outside the public registry;
4. process new messages as `NO_ACTION`, `NEEDS_CLARIFICATION` or `UPDATE_PREPARED`;
5. minimize and anonymize relayed interview evidence;
6. create or reuse a dedicated branch and pull request;
7. run CI/test, security, privacy/evidence checks;
8. stop for human review.

## Prohibited automatic actions

- no automatic email sending;
- no bulk outreach to candidates;
- no scraping public email addresses;
- no automatic merge;
- no direct `main` writes from the participant automation;
- no publication of private contact details;
- no payments, pricing changes, legal commitments or access-management changes;
- no claim that a contributor/candidate is a LIFE partner, consortium member or EU-funded participant.

## Current registry

Machine-readable state is stored in `participant-registry.json`.

At initial activation on 2026-08-31:

- Nicola: confirmed participant, automation enabled, validation active;
- `@Aming9303`: invited candidate contributor only, automation disabled;
- `@wasim-builds`: invited candidate contributor only, automation disabled.

## Human gate

The orchestrator may detect, classify and prepare changes. A maintainer remains responsible for accepting participant scope, reviewing pull requests and approving any public or sensitive action.
