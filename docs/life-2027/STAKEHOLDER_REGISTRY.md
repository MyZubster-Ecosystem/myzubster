# MyZubster LIFE — Public Stakeholder & Partner-State Registry

**Updated:** 2026-08-31  
**Status:** PUBLIC / EVIDENCE-FIRST / HUMAN-GATED

This registry is the public source of truth for the relationship state of organisations, pilot sites, venues, institutional/scientific roles and other LIFE-aligned stakeholders referenced by MyZubster.

It intentionally distinguishes a **candidate**, an **interlocutor**, a **confirmed expression of interest** and a **formal partner**. A public mention, shortlist entry, event proposal, outreach draft, contribution, meeting or technical fit is not a partnership.

## Relationship states

```text
DISCOVERED
→ CANDIDATE
→ OUTREACH_PREPARED
→ IN_DISCUSSION
→ INTEREST_CONFIRMED
→ FORMAL_CONFIRMATION_PENDING
→ FORMAL_CONFIRMED
```

Additional non-partner states:

- `TENTATIVE` — proposed event/site/logistics not yet formally confirmed;
- `UNFILLED` — a required project role exists but no organisation/person has been confirmed;
- `INACTIVE` — previously tracked candidate no longer being actively pursued.

Only `FORMAL_CONFIRMED` may be described as a confirmed partner/consortium role, and only when the supporting agreement or independently verifiable public evidence is sufficient for that claim.

## Current public registry

| Stakeholder / role | Category | Current state | Public evidence | What is still missing |
|---|---|---|---|---|
| BIOAZUL | possible LIFE replication / uptake / European-dimension interlocutor | `IN_DISCUSSION` | authorised correspondence received 2026-08-31; correspondence content not published | follow-up discussion targeted for late October 2026, explicit participation/role confirmation, formal agreement if any |
| Isola di Capraia / Tuscan Archipelago context | candidate pilot context | `CANDIDATE` | `docs/life/02-pilot-shortlist.md`; #508 | competent authority, outreach response, scope/data/permissions, explicit institutional interest |
| Parco Nazionale delle Cinque Terre | candidate pilot organisation | `CANDIDATE` | `docs/life/02-pilot-shortlist.md`; #508 | outreach evidence, operational fit, explicit interest/authorization |
| Parco Nazionale dell'Arcipelago Toscano | candidate pilot organisation | `CANDIDATE` | `docs/life/02-pilot-shortlist.md`; #508 | outreach evidence, candidate site/data, explicit interest/authorization |
| TAZ Riccione | proposed event venue / local working-session context | `TENTATIVE` | #835 | authorised venue/host confirmation, logistics, organiser/host authorization |
| Scientific partner for biodiversity/KPI methodology | project role | `UNFILLED` | #509 | qualified interlocutor, methodology discussion, explicit role/interest |
| Formal LIFE consortium / institutional partner | formal partner layer | `UNFILLED` | #507–#509 and current public documentation | explicit independently verifiable formal agreement/role |

## Current conclusion

As of 2026-08-31, the public repository contains **candidate, preparatory and active-discussion stakeholder evidence but no record sufficient to label an external organisation as a formally confirmed LIFE consortium partner**.

BIOAZUL is currently recorded only as `IN_DISCUSSION`: the relationship remains exploratory and no consortium role, partnership, commitment, funding or participation is confirmed.

This is not a negative assessment of any organisation. It is a truth-labeling rule: the registry changes only when stronger evidence exists.

## Participant and contributor separation

This registry does not duplicate participant or contributor records:

- internal Zorgax/LIFE pilot participants → `docs/life/participant-automation/participant-registry.json`;
- public GitHub contributors → `docs/CONTRIBUTORS.md`;
- LIFE-aligned contributor candidate lanes → `docs/life-2027/CONTRIBUTOR_POOL.md`.

```text
PARTICIPANT ≠ CONTRIBUTOR ≠ PILOT CANDIDATE ≠ INSTITUTIONAL PARTNER
```

A person may occupy more than one layer only when each layer has its own evidence and, where required, explicit consent/authorization.

## Update rules

Before promoting any stakeholder state:

1. identify the exact organisation/person/role without guessing identity;
2. link the source evidence or record that the supporting evidence is authorised but not public;
3. verify that the evidence supports the proposed state;
4. record outstanding conditions and authorizations;
5. do not publish private contacts, contracts, confidential negotiation details or personal data;
6. require human review for `INTEREST_CONFIRMED` and above;
7. require explicit formal evidence before `FORMAL_CONFIRMED`.

Downgrades, withdrawals and restrictions should be applied immediately when supported by evidence.

## Automation boundary

Zorgax may discover public signals, detect material changes, classify evidence and prepare a branch/PR. It must not:

- infer partnership from silence, attendance, contribution or technical fit;
- contact candidates in bulk;
- publish confidential correspondence;
- accept legal commitments;
- sign agreements;
- submit funding applications;
- approve budgets;
- promote a stakeholder to `FORMAL_CONFIRMED` without human verification.

## Canonical references

- #507 — LIFE concept-note constraints
- #508 — pilot outreach
- #509 — scientific partner search
- #713 — Zorgax LIFE Automation v1
- #714 — ChatGPT × Zorgax v2
- #797 — Life master program index
- #834 — call for real pilots
- #835 — TAZ Riccione proposed working session
- `docs/life/02-pilot-shortlist.md`
- `docs/life/03-pilot-outreach.md`

**Evidence first. Candidate status is useful; false certainty is not.**
