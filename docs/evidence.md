# Evidence / Provenance

Every measurement used in a baseline-vs-pilot comparison must carry
provenance. The framework defines a deliberately small, schema-
versioned evidence record (`myzpkpi/evidence.py`) so that downstream
LIFE-style work packages can extend it without breaking existing
artefacts.

## Record fields

| Field | Required | Description |
|-------|----------|-------------|
| `evidence_id` | yes | Stable identifier referenced by `BaselineRecord.evidence_ids`. |
| `timestamp` | yes | ISO-8601 datetime, UTC (`...+00:00` or trailing `Z`). |
| `source` | yes | Where the measurement came from. Recommended form: `<kind>:<id>`, e.g. `sensor:soil_moisture_01`, `manual:operator_journal`, `model:ai_irrigation_v1`. |
| `method` | yes | How the value was produced. |
| `unit` | yes | SI / canonical unit (see [`kpi_schema.md`](kpi_schema.md)). |
| `value` | yes | Numeric or string value. |
| `version` | no, default `EVIDENCE_SCHEMA_VERSION` | Schema version (semver) of the definition. |
| `validation_status` | no, default `raw` | One of `raw`, `checked`, `cross_validated`, `rejected`. |
| `notes` | no | Free-form caveats. |
| `references` | no | Cross-references to other evidence IDs or record IDs. |

## Validation status

| Status | Meaning |
|--------|---------|
| `raw` | Received from source, no automated checks applied. |
| `checked` | Passed range / unit / type checks. |
| `cross_validated` | Cross-checked against an independent source. |
| `rejected` | Failed validation; MUST NOT appear in reports. |

The framework never deletes a `rejected` record — it remains in the
evidence file so that the audit trail is intact.

## Linking to baseline / pilot records

`BaselineRecord` carries a list of `evidence_ids`. The
report generator aggregates these lists for each KPI and emits an
evidence index showing which evidence IDs back each baseline and
pilot KPI value. This makes the report auditable end-to-end:

* `KPIComparison.baseline_evidence_ids`
* `KPIComparison.pilot_evidence_ids`

## Fingerprint

`Evidence.fingerprint()` returns a stable SHA-256 fingerprint of the
canonical JSON serialisation of the record. The fingerprint is used
for internal anchoring (e.g. log lines) without exposing the raw
value. It is **not** used as a substitute for the evidence ID.

## Extending the schema

If a real pilot needs additional fields, e.g. `calibration_curve`,
add them to `Evidence` with sensible defaults and bump
`EVIDENCE_SCHEMA_VERSION`. The CLI tolerates older records by
ignoring unknown keys.