# Zorgax LIFE Automation v1

Zorgax LIFE Automation v1 extends the existing MyZubster automation model with a dedicated **environmental data orchestration workflow** for the LIFE 2027 preparation track.

It is designed to transform partner-provided technical data into traceable, reviewable environmental evidence without allowing Zorgax to invent values, approve scientific claims, or impersonate institutional partners.

## Objective

```text
PARTNER DATA
    ↓
INGEST
    ↓
SCHEMA + QUALITY CHECKS
    ↓
NORMALIZATION + PROVENANCE
    ↓
EVIDENCE RECORD
    ↓
KPI UPDATE
    ↓
ANOMALY / REVIEW ROUTING
    ↓
TECHNICAL VALIDATION
    ↓
SCIENTIFIC VALIDATION
    ↓
PILOT / REPORTING / REPLICATION
```

## Core responsibilities

Zorgax may automate:

- intake of approved datasets or API feeds;
- schema validation;
- required-field checks;
- unit normalization;
- timestamp and source registration;
- provenance metadata;
- duplicate detection;
- basic range/plausibility checks configured by reviewers;
- creation of draft environmental evidence records;
- KPI recalculation using approved formulas;
- anomaly detection and routing;
- task creation for missing or inconsistent data;
- audit-log generation;
- status transitions that do not imply scientific approval;
- generation of draft reporting summaries from validated records.

Zorgax must not automatically:

- invent missing environmental values;
- infer confidential partner data;
- change an approved KPI formula without review;
- mark a result scientifically validated;
- publish restricted operational data;
- declare an organisation a confirmed LIFE partner;
- convert a technical support relationship into a consortium role;
- submit a LIFE application;
- approve budgets, LoIs or contractual commitments.

## LIFE character integration

The workflow routes work to the role characters already defined in `docs/life-2026/characters/life-characters.json`.

### Water Data Steward
Receives requests related to data access, source registration, privacy, granularity and provenance.

### Technical Data Validator
Receives measurements that require domain interpretation, unit/range review or anomaly explanation.

### Scientific Coordinator
Receives KPI methodology, uncertainty, baseline and evidence-quality decisions. Zorgax can prepare the review package but cannot issue the scientific approval itself.

### Pilot Operator
Receives field observations, asset context, intervention logs and requests to confirm operational milestones.

### Replication & Policy Lead
Receives validated outputs that can be packaged for replication or policy uptake.

### Mediterranean Replication Partner
Receives approved evidence packages for second-context testing and transferability analysis.

## Data lifecycle

Every incoming dataset should move through explicit states:

```text
RECEIVED
  ↓
SCHEMA_CHECKED
  ↓
NORMALIZED
  ↓
PROVENANCE_ATTACHED
  ↓
DRAFT_EVIDENCE
  ↓
TECHNICAL_REVIEW
  ↓
SCIENTIFIC_REVIEW
  ↓
VALIDATED
  ↓
REPORTABLE / REPLICABLE
```

Exceptional states:

- `REJECTED_SCHEMA`
- `MISSING_CONTEXT`
- `ANOMALY_REVIEW`
- `ACCESS_RESTRICTED`
- `SUPERSEDED`

## Minimum record structure

Each environmental evidence record should include at least:

- record ID;
- source organisation/system identifier;
- dataset/source identifier;
- observation timestamp;
- ingestion timestamp;
- measured variable;
- raw value;
- normalized value;
- unit;
- asset/site/process reference;
- provenance chain;
- data quality flags;
- access classification;
- applicable KPI references;
- technical-review status;
- scientific-review status;
- audit events.

No personal contact data should be required in the public evidence model.

## Trigger model

Supported trigger categories:

### 1. New dataset / API batch
Starts schema, duplicate, provenance and normalization checks.

### 2. Scheduled refresh
Re-ingests approved sources at an agreed cadence and records changes.

### 3. Missing required field
Creates a clarification task for the Data Steward or provider instead of filling the value automatically.

### 4. Anomaly threshold reached
Creates an `ANOMALY_REVIEW` task for Technical Data Validator and freezes downstream validation of the affected record.

### 5. KPI inputs complete
Recalculates the KPI using the approved versioned formula and creates a review packet.

### 6. Technical review completed
Routes the evidence package to Scientific Coordinator if scientific approval is required.

### 7. Scientific validation completed
Marks eligible evidence as reportable and makes it available to pilot/replication workflows.

## Idempotency and duplicate control

Every ingestion should generate a deterministic fingerprint from source, timestamp, variable, asset and source record identifier where available.

Duplicate inputs must not create duplicate evidence records. Corrections should create a new version linked to the superseded record.

## Audit trail

Every automated action must record:

- actor: `zorgax` or human role;
- action;
- timestamp;
- input/source reference;
- previous status;
- new status;
- rule/formula version;
- result;
- reason/flags.

The audit trail must be append-only at the application level.

## Human-in-the-loop gates

Mandatory human gates:

```text
Data sharing/access policy      → Water Data Steward
Technical interpretation       → Technical Data Validator
Scientific methodology/claims  → Scientific Coordinator
Operational milestone          → Pilot Operator
Public partner status           → authorised consortium governance
```

Zorgax can prepare, route and record these decisions; it cannot replace them.

## Partner data onboarding

For each data provider, create a provider profile with:

- provider ID;
- permitted source types;
- agreed fields;
- allowed purposes;
- access classification;
- update cadence;
- schema version;
- retention rules;
- validation owner;
- contact reference stored outside the public repository.

The provider profile must not imply a LIFE partnership unless that status is separately documented and authorised.

## Phase 1 implementation target

The first implementation should support synthetic/demo data only and prove:

1. ingestion from CSV/JSON;
2. schema validation;
3. normalization;
4. provenance metadata;
5. evidence-record creation;
6. KPI calculation from a versioned rule;
7. anomaly routing;
8. technical/scientific review states;
9. immutable-style audit history;
10. export of validated evidence for LIFE reporting.

Real partner data should only be connected after data-sharing rules and security requirements are defined.

## Security boundaries

- no credentials in repository files;
- no production API keys in workflow definitions;
- no unrestricted partner endpoints;
- least-privilege access;
- encrypted transport;
- explicit separation between public metadata and restricted payloads;
- no automatic publication of raw operational datasets;
- data retention and deletion rules must be configurable.

## Relationship with existing Zorgax automation

This specification complements `docs/ZORGAX_AUTOMATION.md`.

The existing LIFE Update monitors authoritative programme changes. **Zorgax LIFE Automation v1** handles the project-internal environmental evidence pipeline.

```text
Zorgax LIFE Update
    → external programme intelligence

Zorgax LIFE Automation v1
    → internal data/evidence orchestration
```

## Source of truth

Machine-readable workflow: [`zorgax-life-automation-v1.json`](./zorgax-life-automation-v1.json)

Implementation should remain evidence-first, reversible where possible, and subject to human review at every governance-critical step.
