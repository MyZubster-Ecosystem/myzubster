# Replication Decision Matrix

Version: 1.0.0

For each capability choose exactly one decision: `REUSE`, `LOCALIZE`, or `BLOCK`. A reusable software asset can still be blocked from deployment when local authority, evidence, privacy, security, validation, or safety requirements are unresolved.

| Capability | Reuse | Localize | Block | Evidence required | Decision owner |
| --- | --- | --- | --- | --- | --- |
| Public environmental evidence schema | REUSE |  |  | Compatible field mapping and schema version | Technical validator |
| Sensor adapter configuration |  | LOCALIZE |  | Device model, units, calibration and transport mapping | Site technical lead |
| Baseline and KPI thresholds |  | LOCALIZE |  | Site baseline, method, units and acceptance thresholds | Scientific validator |
| Public documentation templates | REUSE |  |  | Version and license review | Replication lead |
| Data retention and access policy |  | LOCALIZE |  | Local legal, privacy and security review | Authorized governance owner |
| Partner-confidential inputs in public repository |  |  | BLOCK | Removal and repository history review | Maintainer |
| Automated physical actuation without manual override |  |  | BLOCK | Manual override, safe fallback and authorized safety review | Site safety owner |
| Claims of deployment, funding or partnership |  |  | BLOCK | Independent public authorization evidence | Maintainer |

## Decision rules

- `REUSE`: the versioned public asset can transfer unchanged, but its local application still needs evidence.
- `LOCALIZE`: the public structure is reusable while values, controls, owners or methods must be supplied locally.
- `BLOCK`: deployment cannot proceed until the listed evidence resolves the blocker.
- `UNKNOWN` inputs are blockers when they concern authority, privacy, security, validation or physical safety.

## Reviewer checklist

- [ ] Every row has exactly one decision.
- [ ] Every `LOCALIZE` or `BLOCK` row names required evidence and a decision owner.
- [ ] References distinguish normalized data from human-validated evidence.
- [ ] No public artifact contains real confidential partner information.
- [ ] No artifact implies verified funding, partnership, deployment or production readiness.
