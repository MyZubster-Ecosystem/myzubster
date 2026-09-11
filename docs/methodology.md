# Methodology

This document explains the assumptions, limitations, and honest
behaviour of the MyZubster Pilot Baseline, KPI & Evidence
Framework. It is meant to be read together with the synthetic
sample data and the generated report.

## The baseline → intervention → comparison → evidence flow

The framework walks through the following chain when
`python -m myzpkpi` is invoked:

1. **Load records** (`myzpkpi/baseline.load_records_csv`) — a CSV
   file with one row per period per site. Records with an empty
   `intervention` field are baseline; others are pilot records.
2. **Validate records** (`myzpkpi/validation.validate_records`) —
   required fields, non-negative numeric fields, ISO-8601
   timestamps, and coupled-field sanity (e.g. `missing_samples`
   cannot exceed `expected_samples`).
3. **Compute per-record KPIs** (`myzpkpi/calculator.compute`) —
   for each KPI, for each record, evaluate the formula. Missing or
   invalid inputs return a non-`ok` status; the framework never
   invents a number.
4. **Aggregate** (`myzpkpi/calculator.aggregate`) — combine
   per-record values into one value per group (baseline / pilot)
   using the KPI's `aggregation` policy.
5. **Compare** (`myzpkpi/report.build_report`) — produce a
   `KPIComparison` for each KPI, including honest delta and
   direction status derived from `direction` policy.
6. **Emit evidence index** — collect all `evidence_ids` referenced
   by the records used in each KPI and emit a Markdown index.
7. **Attach disclaimers** — every report carries the framework's
   standard disclaimers, including the explicit statement that the
   framework makes no claim about EU LIFE funding or endorsement.

## What the framework does NOT do

* It does **not** invent percentage improvements. Every number in
  the report is a direct function of the input data and the
  documented formula.
* It does **not** assert any relationship with, or endorsement by,
  the European Commission, the EU LIFE programme, or any other
  public funder. This statement appears in every report.
* It does **not** impute missing values. Records with missing
  inputs are surfaced as `missing_input` and the affected KPI
  row is marked accordingly.
* It does **not** modify the input data. The framework is
  read-only with respect to the supplied CSV / JSON.

## Status semantics

| Status | Meaning |
|--------|---------|
| `ok` | All required inputs present and computation succeeded. |
| `partial` | Some records produced non-`ok` results but the aggregation still yielded a number; treat with caution. |
| `missing_input` | One or more required inputs are absent; no number could be produced. |
| `invalid` | Inputs were present but the computation is undefined (e.g. division by zero). |

The aggregated status follows this precedence:
`invalid > missing_input > partial > ok`.

## Honest delta calculation

`KPIComparison.delta_absolute` is the absolute difference
(`pilot - baseline`).

`KPIComparison.delta_relative` is the relative difference
(`(pilot - baseline) / baseline`) when `baseline != 0`, and
`None` when `baseline == 0` (we never fabricate a "100% improvement"
from a zero baseline).

## Reproducibility

The framework is deterministic given the same inputs. `python -m
myzpkpi` writes the same artefacts every time; only the
`generated_at` timestamp in the JSON changes.

## Synthetic data

All sample data shipped under `data/samples/` is fictional. The
sensor IDs (`sensor:soil_moisture_01`) and intervention names
(`ai_irrigation_v1`) are placeholders. Real pilots MUST replace the
sample data with site-specific measurements before drawing
conclusions, as stated in the report's first disclaimer.