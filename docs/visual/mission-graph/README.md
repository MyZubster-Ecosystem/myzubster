# Visual #017 — Cross-Repository Mission Graph

This package visualizes how a MyZubster mission may cross repository responsibility boundaries while keeping every transition evidence-bounded.

## Canonical source

Derived from `docs/ECOSYSTEM.md`, which defines the organization-wide repository map and the architecture:

```text
App / Web
   ↓
Core / Platform
   ↓
Bounties / Observations / Gardens / Registries
   ↓
Public snapshots (IPFS/IPNS)

Optional integration / settlement:
Core → Gateway → Treasury / payment adapters → independent verifier

Experimental tracks:
AI automation | EVA IONI | Robot | Space Station | IoT
```

## Mission interpretation

A mission is not assumed to exercise every repository. A valid mission may stop after observation/review, may involve only core and publication, or may include an experimental/specialist track when documented evidence requires it.

## Evidence rules

- repository relationship in documentation does not prove a live runtime integration;
- a shared mission ID or linked issue/PR does not prove successful cross-service execution;
- simulation or telemetry evidence does not prove physical deployment;
- a public snapshot/CID preserves content but does not independently prove the underlying claim;
- MYZ is an internal reward/accounting layer unless a separate external settlement is independently verified;
- Gateway/provider submission does not equal `PAID`;
- external/upstream repositories must not be presented as MyZubster-controlled products merely because they are referenced or forked.

## Intended use

This graph is the navigation layer for future mission-aware views. A later implementation can bind canonical evidence records to graph edges so a viewer can see which transitions are merely documented, which have test evidence, and which have runtime evidence.
