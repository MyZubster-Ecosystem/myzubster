# LIFE 2026 — Real-world stakeholder characters

The LIFE characters in MyZubster represent **real operational roles needed by the LIFE 2026 workstream**, but they are not portraits, impersonations, endorsements, or official representations of specific people or organisations.

Their purpose is to make the consortium workflow understandable and interactive inside MyZubster while keeping private correspondence, personal data, unconfirmed partnerships, negotiation details and confidential datasets out of the public repository.

The machine-readable source of truth is [`life-characters.json`](./life-characters.json).

## Why these characters exist

LIFE projects involve people and organisations with very different responsibilities: scientific validation, access to operational datasets, technical interpretation, pilot execution, replication and policy uptake. MyZubster turns those responsibilities into visible roles that can interact with data, evidence, assets, KPIs and milestones.

A character therefore represents **what someone is responsible for in the workflow**, not who that person is.

This separation lets MyZubster model a real consortium before every organisation is formally confirmed, while preventing a public character from being mistaken for an official partnership announcement.

## Character set

### 1. Scientific Coordinator

**Mission:** keep the environmental methodology defensible, measurable and auditable.

Typical responsibilities:
- define and review baselines;
- validate KPI methodology;
- review QA/QC and uncertainty;
- evaluate scientific evidence;
- approve technical milestones;
- support LIFE reporting with validated environmental results.

**How to interact in MyZubster:** submit a KPI methodology, request a data-quality review, attach scientific evidence, request validation of an indicator or ask for a technical milestone review.

### 2. Water Data Steward

**Mission:** connect operational water data to the MyZubster evidence layer while respecting privacy, cybersecurity and data-use restrictions.

Typical responsibilities:
- register available data sources;
- define which fields can be shared;
- document provenance and update frequency;
- approve access rules;
- distinguish public, restricted, aggregated and anonymised data;
- support baseline construction.

**How to interact in MyZubster:** propose a new data source, submit a schema for approval, request access to a dataset, define sharing constraints or validate the provenance of an environmental record.

### 3. Technical Data Validator

**Mission:** turn real domain measurements into usable and auditable environmental indicators.

Typical responsibilities:
- interpret technical values from water, sludge, nutrients, organic matrices or circular-economy processes;
- validate units, ranges and measurement context;
- map measurements to KPI/evidence records;
- identify anomalies and missing context;
- validate technical outputs from pilots.

**How to interact in MyZubster:** upload or map technical measurements, request unit/range validation, flag an anomaly, add domain interpretation or review a pilot result before it becomes validated evidence.

### 4. Replication & Policy Lead

**Mission:** make the demonstrator transferable beyond one site and convert project results into reusable governance and policy knowledge.

Typical responsibilities:
- define replication methodology;
- maintain stakeholder and territory maps;
- coordinate policy uptake;
- document reusable implementation patterns;
- track replication commitments;
- support post-project adoption.

**How to interact in MyZubster:** create a replication case, connect a territory/stakeholder, compare implementation requirements, record an uptake milestone or publish reusable replication guidance.

### 5. Pilot Operator

**Mission:** demonstrate that MyZubster works in a real operational context.

Typical responsibilities:
- register real assets or processes;
- define the monitoring perimeter;
- provide operational context and constraints;
- log observations and interventions;
- connect field evidence;
- verify before/after conditions;
- report deployment issues and corrective actions.

**How to interact in MyZubster:** register an asset, create a pilot observation, upload field evidence, confirm an operational milestone, report a problem or validate that a corrective action was completed.

### 6. Mediterranean Replication Partner

**Mission:** test whether the environmental-MRV model remains useful in another territory or operating context.

Typical responsibilities:
- adapt methods to another regional context;
- compare baseline/KPI models;
- identify regulatory or operational differences;
- test transferability;
- support stakeholder engagement and exploitation;
- document replication evidence.

**How to interact in MyZubster:** create a replication workspace, import a second-context baseline, compare KPIs, document adaptation requirements or submit evidence that the approach transfers successfully.

## Interaction model

The characters are designed to interact through **evidence-backed workflows**, not through fictional chat role-play.

A typical LIFE workflow can look like this:

```text
Pilot Operator
    ↓ registers asset / field observation
Water Data Steward
    ↓ connects approved operational data + provenance
Technical Data Validator
    ↓ interprets measurements and checks units/ranges
Scientific Coordinator
    ↓ validates KPI methodology and evidence quality
MyZubster
    ↓ stores traceable environmental evidence + audit trail
Replication & Policy Lead
    ↓ packages the validated result for another territory
Mediterranean Replication Partner
    ↓ tests transferability and records adaptation evidence
```

Every important interaction should produce or update a traceable MyZubster object such as:
- asset;
- data source;
- observation;
- environmental evidence record;
- KPI result;
- validation decision;
- milestone;
- replication case;
- stakeholder/territory record.

## How contributors should use them

When developing the UI or workflow logic, treat each character as a **capability/permission profile**.

Good examples:
- `Water Data Steward can approve a schema`;
- `Scientific Coordinator can validate KPI methodology`;
- `Pilot Operator can attach field evidence`;
- `Replication & Policy Lead can create a replication case`.

Avoid hard-coding a real organisation or person's identity into the component. The UI should read role, status, mission and available actions from the character manifest whenever possible.

## Status model

Each character can have one of these public-safe statuses:

- `ROLE_DEFINED` — the role exists in the project architecture; no organisation is implied.
- `CANDIDATE` — an organisation could fit the role; no commitment is claimed.
- `IN_DISCUSSION` — active dialogue exists; no partnership or endorsement is implied.
- `CONFIRMED` — use only when written confirmation/LoI exists **and** public representation is authorised.
- `INACTIVE` — the role/contact is no longer being pursued in the current configuration.

A status change is not merely visual. When implemented in the app it should be auditable, with the evidence/source supporting the transition stored outside public personal data.

## Privacy and representation rules

Do not attach a real person's name, photo, email, phone number, private message or likeness to a LIFE character unless explicit permission for public representation has been obtained.

Do not display an organisation as a confirmed partner solely because a call took place, an email was exchanged or technical interest was expressed.

`CONFIRMED` should require both:
1. suitable written evidence of the role/commitment; and
2. permission to represent that status publicly.

Confidential data-sharing agreements, budgets, Letters of Intent, private partner notes and operational datasets belong in the consortium data room, not in this public folder.

## For users of MyZubster

When the LIFE character UI is implemented, a user should be able to select a character card to understand:
- what that role does;
- which Work Packages it supports;
- what its current status is;
- which actions it can perform;
- which evidence/data objects it has interacted with;
- what action is needed next.

The goal is to turn a complex LIFE consortium into a transparent workflow where every environmental claim can be traced back through **who supplied the data, who interpreted it, who validated it and where it was demonstrated** — while protecting the identities and negotiations that are not meant to be public.

## Implementation references

- Character manifest: [`life-characters.json`](./life-characters.json)
- LIFE technical documentation: [`../README.md`](../README.md)
- Environmental data model: [`../ENVIRONMENTAL_DATA_MODEL.md`](../ENVIRONMENTAL_DATA_MODEL.md)
- Technical architecture: [`../TECHNICAL_ARCHITECTURE.md`](../TECHNICAL_ARCHITECTURE.md)
- UI integration task: [Issue #711](https://github.com/MyZubster-Ecosystem/myzubster/issues/711)
