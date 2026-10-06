# LIFE 2026 — Environmental Data Model

## Goal

Define a minimal public schema for a traceable environmental evidence record that can be adapted to circular-water and environmental-monitoring demonstrators.

This is a technical working schema, not a regulatory product passport and not a claim of compliance with any specific EU passport framework.

## Core record

| Field | Purpose |
|---|---|
| `record_id` | Unique evidence-record identifier |
| `source_asset_id` | Identifier of the originating asset, station, dataset, or system |
| `observed_at` | Timestamp of the measurement or observation |
| `received_at` | Timestamp at which MyZubster received the record |
| `spatial_reference` | Geolocation or spatial identifier when permitted |
| `source_system` | Originating system or dataset identifier |
| `parameter` | Environmental or operational parameter |
| `value` | Measured or reported value |
| `unit` | Unit of measure |
| `method` | Measurement, sampling, calculation, or reporting method |
| `provenance_ref` | Reference to the source or acquisition event |
| `validation_status` | Explicit status such as unvalidated, validated, rejected, or superseded |
| `quality_flags` | QA/QC flags or warnings |
| `evidence_ref` | Reference or content hash for supporting evidence |
| `monitoring_period` | Reporting or observation period to which the record belongs |
| `kpi_refs` | Zero or more KPI definitions that consume the record |
| `privacy_class` | Public, restricted, aggregated, anonymised, or other agreed class |
| `schema_version` | Version of the record schema |

## Water-oriented extensions

When applicable, a water demonstrator may extend the core record with fields such as:

- flow or volume;
- water-quality parameter and analytical method;
- treatment stage;
- reuse destination or use class;
- source-water category;
- asset or network segment;
- operational state;
- uncertainty or detection limit.

These extensions are optional and should only be populated when the data owner has authorised the relevant use.

## Validation semantics

Validation must be explicit. Suggested states:

- `UNVALIDATED` — received but not yet checked;
- `VALIDATED` — accepted under the agreed QA/QC method;
- `REJECTED` — failed validation or is not usable for the intended calculation;
- `SUPERSEDED` — replaced by a later corrected record.

A dashboard or KPI pipeline must not silently treat `UNVALIDATED` data as validated evidence.

## Provenance rules

1. Preserve the original source reference whenever technically possible.
2. Record transformations that materially change interpretation or units.
3. Keep raw-source identity separate from derived KPI output.
4. Store hashes or references as evidence aids, not as substitutes for the underlying validation process.
5. Never publish restricted source records merely because a derived KPI is public.

## Privacy and publication

The public repository should contain only schemas, synthetic examples, or datasets explicitly cleared for publication. Personal data, precise sensitive locations, restricted infrastructure details, and non-public operational data must remain outside the repository.

## Example

```json
{
  "record_id": "env-000001",
  "source_asset_id": "demo-sensor-01",
  "observed_at": "2026-08-25T12:00:00Z",
  "received_at": "2026-08-25T12:00:10Z",
  "spatial_reference": "synthetic-demo-zone",
  "source_system": "synthetic-lab-feed",
  "parameter": "example_parameter",
  "value": 12.4,
  "unit": "example_unit",
  "method": "synthetic_example",
  "provenance_ref": "demo://source/000001",
  "validation_status": "UNVALIDATED",
  "quality_flags": [],
  "evidence_ref": "sha256:example",
  "monitoring_period": "2026-Q3",
  "kpi_refs": [],
  "privacy_class": "PUBLIC_SYNTHETIC",
  "schema_version": "0.1"
}
```

The example above is synthetic and must not be interpreted as a real environmental measurement.
