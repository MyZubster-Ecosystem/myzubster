# External Project Verification Protocol v1

This protocol generalizes the bounded N4K48/Nicola pilot into a reusable MyZubster VPS verification path for external projects.

It is intentionally narrower than deployment, certification, partnership or full decentralization.

## Goal

Given a public external project and an immutable commit:

1. fetch or build it in an isolated verification context;
2. run a harmless, bounded adapter/check;
3. capture the observed result;
4. publish sanitized evidence;
5. assign an evidence state that matches only what was observed.

## Verification path

```text
EXTERNAL PROJECT
      ↓
public repository + immutable commit
      ↓
verification manifest
      ↓
isolated VPS verification context
      ↓
adapter / bounded procedure
      ↓
PASS / FAIL / PARTIAL
      ↓
machine-readable evidence
      ↓
optional MyZubster / Zorgax linkage
```

## Isolation rules

The verification node must not mutate the production checkout or unrelated services.

On the Daniel VPS:

- do not delete, reset, pull or checkout-swap `/root/myzubster`;
- prefer a dedicated directory under `/opt/myzubster/pilots/` or another explicit verification root;
- for Docker, use a unique Compose project name;
- do not run `pm2 restart all`;
- do not expose new inbound ports unless the manifest explicitly requires and documents them;
- never copy secrets into public evidence;
- cleanup must be defined before the test begins.

## Adapter types

- `runtime-http` — isolated service exposes a bounded HTTP contract;
- `runtime-cli` — deterministic CLI or local process check;
- `semantic-evidence` — evidence package ingestion/retrieval;
- `security-regression` — bounded security regression;
- `deterministic-calculation` — fixed-input deterministic result comparison;
- `custom` — only when the above do not fit; scope must be explicit.

## State model

- `PROPOSED` — candidate identified; procedure not frozen.
- `READY` — source commit, environment, procedure, expected checks and cleanup are frozen.
- `IN_VERIFICATION` — bounded run is being executed.
- `TESTED_PASS` — observed bounded run passed.
- `TESTED_FAIL` — observed bounded run failed.
- `DISABLED` — do not execute.

A manifest with `NOT_RUN` can never be `TESTED_PASS`.

## What TESTED_PASS means

Only:

> the exact source commit passed the exact bounded procedure in the recorded verification environment.

It does **not** establish:

- production readiness;
- full security assurance;
- direct P2P;
- complete decentralization;
- legal or institutional approval;
- contributor certification;
- payment/reward entitlement;
- employment or partnership.

## Nicola / N4K48 as reference

The Nicola checkpoint is the reference pattern because it demonstrated an authenticated bounded path:

```text
VPS
→ authenticated HTTPS broker
→ contributor-controlled agent
→ contributor-local catalog
→ bounded result returned to MyZubster
```

That result supports a bounded interoperability checkpoint. It is not a claim of direct P2P or complete decentralization.

## Candidate onboarding

Before testing a new external project, freeze:

1. repository;
2. immutable commit;
3. project owner / public alias;
4. adapter type;
5. exact procedure;
6. expected checks;
7. isolation method;
8. cleanup;
9. limitations.

Only then move `PROPOSED → READY`.

## Relationship with Zorgax

A successful external-project checkpoint may become an input to a Zorgax capability, but it does not automatically grant Zorgax new authority.

The capability registry still controls:

- allowed inputs;
- allowed actions;
- prohibited claims;
- evidence requirements;
- whether the capability itself has a bounded TESTED checkpoint.
