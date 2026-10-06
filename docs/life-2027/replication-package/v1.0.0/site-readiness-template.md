# Site Readiness Template

Version: 1.0.0

Use one copy per candidate site. Keep the public copy fictional or synthetic; store confidential partner inputs outside the repository. Record `READY`, `CONDITIONAL`, `NOT READY`, or `UNKNOWN` for every check and link evidence rather than relying on undocumented knowledge.

## Site and authority

| Check | Status | Public evidence | Confidential input owner | Blocker |
| --- | --- | --- | --- | --- |
| Site purpose and environmental problem are defined | UNKNOWN | TBD | TBD | TBD |
| Authorized site contact and decision owner are identified | UNKNOWN | Redacted in public copy | TBD | Yes until confirmed |
| Installation, maintenance and removal permissions are understood | UNKNOWN | TBD | TBD | TBD |

## Sensors, connectivity and data

| Check | Status | Public evidence | Localize | Blocker |
| --- | --- | --- | --- | --- |
| Sensor models, units and calibration evidence are documented | UNKNOWN | TBD | Yes | TBD |
| Connectivity and offline buffering constraints are known | UNKNOWN | TBD | Yes | TBD |
| Data ownership, retention and export routes are documented | UNKNOWN | TBD | Yes | Yes until confirmed |
| Adapter output can map to the environmental evidence schema | UNKNOWN | `docs/life-2026/ENVIRONMENTAL_DATA_MODEL.md` | Yes | TBD |

## KPI and evidence readiness

| Check | Status | Method/evidence | Validator | Blocker |
| --- | --- | --- | --- | --- |
| Baseline period and comparison method are defined | UNKNOWN | TBD | TBD | Yes until defined |
| KPI units, frequency and acceptance thresholds are defined | UNKNOWN | TBD | TBD | Yes until defined |
| Raw evidence remains traceable to source, time and schema version | UNKNOWN | TBD | TBD | TBD |
| Claims distinguish collected, normalized and human-validated states | UNKNOWN | `docs/life-2026/TECHNICAL_ARCHITECTURE.md` | TBD | TBD |

## Governance, security and privacy

| Check | Status | Control/evidence | Owner | Blocker |
| --- | --- | --- | --- | --- |
| Data classification and least-privilege access are defined | UNKNOWN | TBD | TBD | Yes until defined |
| Personal and sensitive-location data are minimized | UNKNOWN | TBD | TBD | Yes until reviewed |
| Credentials and partner-confidential inputs remain outside public assets | UNKNOWN | Repository review | TBD | Yes |
| Incident response, retention and deletion responsibilities are assigned | UNKNOWN | TBD | TBD | TBD |

## Human validation and automation safety

| Check | Status | Evidence | Decision owner | Blocker |
| --- | --- | --- | --- | --- |
| Technical and scientific validation roles are named | UNKNOWN | `docs/life-2027/ZORGAX_LIFE_AUTOMATION_V1.md` | TBD | Yes until named |
| AI recommendations are advisory and reviewable | UNKNOWN | TBD | TBD | Yes until verified |
| Manual override and safe fallback are documented for actuators | UNKNOWN | TBD | TBD | Yes for automated action |
| No automated state implies external approval, funding or partnership | READY | Public package boundary | Maintainer | No |

## Blockers and readiness decision

| Blocker ID | Description | Owner | Required evidence | Due | Status |
| --- | --- | --- | --- | --- | --- |
| B-001 | TBD | TBD | TBD | TBD | OPEN |

Final readiness: `NOT READY`

Decision owner: `TBD`

Decision evidence: `TBD`
