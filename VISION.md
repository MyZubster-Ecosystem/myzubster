# What MyZubster is becoming

**Updated:** 31 August 2026  
**Status:** PUBLIC DIRECTION / EVIDENCE-FIRST / ACTIVE DEVELOPMENT

MyZubster is evolving from a collection of applications, experiments and open-source workflows into a **shared operating layer for people, AI agents, verifiable evidence, real-world pilots and human-governed automation**.

This document describes the direction that is now visible in the repository. It separates what is already implemented from what is still preparatory, simulated or awaiting external authorization.

## The direction in one sentence

> **MyZubster is becoming an open-source coordination and evidence system where people, contributors, AI agents, sensors, projects and external stakeholders can work through shared data, provenance, review and explicit human decision gates.**

It is not intended to be a single monolithic app. The repository is converging toward an ecosystem in which the same evidence and governance rules can be reused across software, environmental pilots, contributor work, robotics, automation and future settlement flows.

## The emerging MyZubster stack

```text
PEOPLE / CONTRIBUTORS / ORGANISATIONS
                │
                ▼
      WEB / APP / GITHUB / CONNECTORS
                │
                ▼
          MYZUBSTER CORE
      ┌─────────┼─────────┐
      ▼         ▼         ▼
 Observations  Missions  Participant / contributor flows
      │         │         │
      └─────────┼─────────┘
                ▼
        EVIDENCE + PROVENANCE
                │
        ┌───────┴────────┐
        ▼                ▼
      ZORGAX         HUMAN REVIEW
        │                │
        └───────┬────────┘
                ▼
       VERIFIED / BOUNDED OUTPUT
   ┌────────────┼─────────────┐
   ▼            ▼             ▼
Dashboards   Pilot evidence  Reproducible automation
   │                          │
   └────────────┬─────────────┘
                ▼
        OPTIONAL EXTERNAL LAYERS
       robotics / settlement / APIs
```

## 1. An evidence operating layer

The central direction is no longer simply “store data” or “run an app”. MyZubster increasingly treats **evidence, provenance and truth labels** as infrastructure.

A material claim should be traceable to its source and state. The project distinguishes, for example:

- issue ≠ implementation;
- pull request ≠ merge;
- merge ≠ deployment;
- simulation ≠ physical operation;
- candidate ≠ partner;
- contributor activity ≠ employment or payment;
- automated check ≠ independent verification;
- transaction submission ≠ final settlement.

The goal is a reusable evidence model that can support public documentation, environmental data, contributor activity, pilot validation, automation and future machine-readable reporting.

## 2. Zorgax as the orchestration layer

Zorgax is becoming the automation layer that sits between raw inputs and human decisions.

Its intended role is to:

- ingest and classify authorized information;
- normalize structured data;
- prepare provenance and evidence records;
- route work to bounded workflows;
- detect missing information or inconsistencies;
- prepare branches, pull requests and reviewable outputs;
- keep consequential actions behind explicit human gates.

This is already visible in the LIFE participant orchestration system merged through PR #864 and in the EVA IONI build routing merged through PR #870.

Zorgax is **not** being defined as an autonomous legal, financial or governance authority. It does not gain permission to merge, spend, sign, publish sensitive information or activate physical systems merely because it can prepare or analyze them.

## 3. A network for contributors, not just a code repository

MyZubster is also becoming a structured contributor network.

The public contributor registry records verifiable GitHub activity separately from participant consent, employment, rewards and institutional roles. LIFE-aligned technical work can be routed into bounded tasks without converting a contributor into a formal project partner.

Recent registry work records active public LIFE-aligned contribution evidence while preserving the separate consent and partnership boundaries. The objective is:

```text
PUBLIC CONTRIBUTION
→ SKILL EVIDENCE
→ BOUNDED TASK
→ PR / TEST / REVIEW
→ VERIFIED CONTRIBUTION
→ OPTIONAL NEW RESPONSIBILITY
```

This makes the contributor graph useful as project infrastructure while keeping identity, consent and contractual claims evidence-based.

Canonical references:

- `docs/CONTRIBUTORS.md`
- `docs/life-2027/CONTRIBUTOR_POOL.md`
- `JOIN.md`
- `CONTRIBUTING.md`

## 4. A LIFE-oriented pilot and stakeholder operating model

The LIFE 2027 workstream is turning MyZubster into a place where pilot preparation can be represented as **explicit states rather than informal claims**.

Participant automation, contributor work and institutional stakeholders now have separate registries. Organisations can move through bounded relationship states such as:

```text
DISCOVERED
→ CANDIDATE
→ OUTREACH_PREPARED
→ IN_DISCUSSION
→ INTEREST_CONFIRMED
→ FORMAL_CONFIRMATION_PENDING
→ FORMAL_CONFIRMED
```

As of 31 August 2026, the repository still records **zero formally confirmed external LIFE consortium partners**. BIOAZUL is recorded as `IN_DISCUSSION`, with a planned reassessment window in late October 2026; this is intentionally not described as a partnership.

The LIFE direction is therefore not “claim a consortium early”. It is to build a reusable system for:

- candidate pilot definition;
- authorization tracking;
- baseline and KPI/MRV evidence;
- data ownership and provenance;
- technical and scientific review;
- contributor work;
- stakeholder-state tracking;
- replication and auditability.

Canonical references:

- `docs/life/participant-automation/README.md`
- `docs/life/participant-automation/ORCHESTRATOR.md`
- `docs/life/participant-automation/participant-registry.json`
- `docs/life-2027/STAKEHOLDER_REGISTRY.md`
- `docs/life-2027/stakeholder-registry.json`

## 5. From digital agents toward bounded robotics

MyZubster is extending the same governance model into robotics.

PR #872 merged an observable **software simulation runtime** for EVA IONI and MyZubster Robot, including public health/status endpoints, synthetic simulation pulses and explicit safety truth fields such as:

- `actuators_enabled: false`;
- `physical_hardware_verified: false`;
- `autonomous_settlement_enabled: false`.

PR #870 also merged the Zorgax EVA IONI build template, which models environmental sensing, soil sensing and fail-safe irrigation interfaces while requiring simulation-first validation, manual override and physical safety gates.

This means the direction is becoming concrete, but the boundary remains important:

> **software simulation runtime ≠ verified physical robot deployment**

The long-term pattern is to let robots and sensors become evidence-producing participants in the technical architecture without granting them uncontrolled physical or financial authority.

## 6. Optional settlement as a separately verified layer

MyZubster also contains a developing settlement track, including the XMR stagenet implementation documented in `docs/XMR-STAGENET-SETTLEMENT.md` and the related Gateway work.

The architectural direction is intentionally separate from internal MYZ accounting and from ordinary evidence workflows:

```text
AUTHORIZED INTENT
→ SUBMISSION
→ EXTERNAL TX REFERENCE
→ INDEPENDENT VERIFICATION
→ CONFIRMED
→ PAID
```

A submitter must not be able to self-declare final settlement. Real stagenet validation remains a separate gate from runtime/test implementation, and mainnet or autonomous financial authority is outside the current milestone unless separately reviewed and authorized.

## 7. A human-gated system, not an autonomous organisation

Across the repository, the same control model is becoming more consistent:

```text
AUTOMATION MAY
observe → classify → validate → prepare → recommend

HUMANS RETAIN
consent → authorization → merge → publication → partnership → legal commitment → spending → physical activation
```

This is the core design choice connecting Zorgax, LIFE, contributors, security, robotics and settlement.

## Current state matrix — 31 Aug 2026

| Layer | Current repository state | Boundary |
|---|---|---|
| Evidence / provenance | active core direction | evidence quality depends on actual sources and validation |
| GitHub CI / security gates | implemented and active | green checks are not a universal security guarantee |
| Zorgax participant orchestration | implemented / merged | explicit participant-specific consent required |
| Contributor evidence registry | implemented / active | contributor ≠ participant ≠ employee ≠ partner |
| LIFE stakeholder registry | implemented / active | formal partner count remains 0 until formal evidence exists |
| LIFE public acquisition surface | merged via PR #868 | preparatory LIFE path, not EU endorsement/funding |
| EVA IONI Zorgax build routing | merged via PR #870 | planning/template ≠ hardware deployment |
| Robot observable runtime | simulation active via PR #872 | physical hardware not verified or activated |
| XMR settlement runtime/tests | active implementation track | real stagenet E2E remains a separate verification gate |
| Autonomous legal/financial authority | not enabled | human authorization remains mandatory |

## What MyZubster is not claiming

This direction does **not** mean that MyZubster is currently:

- an officially funded or approved EU LIFE project;
- a formally completed LIFE consortium;
- an autonomous company run by AI;
- a fleet of physically autonomous robots;
- a production financial network with autonomous spending;
- proof of external adoption simply because code, documentation or PRs exist;
- authorized to use third-party sites, data or systems without permission.

## The next transformation

The next stage is to make the existing layers work together through one consistent evidence model:

1. connect authorized observations and sensor data to provenance;
2. let Zorgax prepare bounded evidence and actions;
3. route contributor work through reproducible tasks and review;
4. convert pilot discussions into explicit authorization, baseline and KPI states;
5. integrate simulation and real devices only after physical safety gates;
6. expose public dashboards that distinguish measured, simulated, proposed and verified states;
7. make every consequential transition attributable to a human decision or independently verifiable external event.

That is the direction MyZubster is becoming: **an open, evidence-first coordination infrastructure connecting digital work to real-world outcomes without hiding the boundary between automation and responsibility.**

## Related public references

- `README.md`
- `docs/ECOSYSTEM.md`
- `docs/CONTRIBUTORS.md`
- `docs/life/participant-automation/README.md`
- `docs/life-2027/STAKEHOLDER_REGISTRY.md`
- `docs/XMR-STAGENET-SETTLEMENT.md`
- Issue #839 — public roadmap
- PR #864 — LIFE participant orchestrator
- PR #868 — LIFE homepage spotlight
- PR #870 — EVA IONI Zorgax build routing
- PR #872 — observable robot simulation runtime
- PR #875 — LIFE contributor registry sync
- PR #876 — BIOAZUL discussion-state registry update

**Evidence before claims. Human responsibility before automation. Authorization before deployment.**
