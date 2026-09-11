# How to adopt this framework in a real pilot

This document is for partner organisations that want to use the
MyZubster Pilot Baseline, KPI & Evidence Framework with their own
data. It deliberately keeps the bar low: a real pilot does NOT need
to learn Python to use the framework.

## 1. Prepare your CSV

Create a CSV file with the same column order as
[`data/samples/records.csv`](../data/samples/records.csv). The
framework tolerates missing numeric columns (just leave them
empty) but enforces the following on every row:

* `record_id`, `site_id`, `period_start`, `period_end` must be
  non-empty.
* `area_m2` and `days` must be positive.
* All numeric fields must be ≥ 0.
* `missing_samples ≤ expected_samples`.
* `accepted_recommendations ≤ issued_recommendations`.
* `matching_outcomes ≤ evaluated_recommendations`.
* `detection_time` / `response_time` (when present) must be
  ISO-8601.

Rows with no value in the `intervention` column are treated as
baseline; rows with a value (e.g. `ai_irrigation_v1`) are treated as
pilot.

## 2. (Optional) Prepare your evidence file

Create a JSON array whose elements look like the records in
[`data/samples/evidence.json`](../data/samples/evidence.json).
Each element must have `evidence_id`, `timestamp`, `source`,
`method`, `unit`, and `value`. The `validation_status` field is
optional and defaults to `raw`.

In the CSV, the `evidence_ids` column is a `;`-separated list of
`evidence_id` values that back the row.

## 3. (Optional) Extend the KPI catalog

If your pilot needs a new KPI:

1. Choose a stable `id` (e.g. `water.quality.ec_per_m2`).
2. Pick a unit from the [canonical list](kpi_schema.md#canonical-units).
   If you need a new unit, add it to `UNITS` first.
3. Express the formula using the [Formula DSL](kpi_schema.md#formula-dsl).
4. Decide the `aggregation` policy (`sum`, `mean`, or `last`) and
   `direction` policy (`lower_is_better` / `higher_is_better`).

Save the updated catalog as `data/config/kpi_catalog.json` (or
point the CLI at a different file via `--catalog`).

## 4. Run the framework

```bash
python -m myzpkpi \
  --records path/to/your_records.csv \
  --evidence path/to/your_evidence.json \
  --out-dir reports/
```

The framework writes `reports/report.json` and
`reports/report.md`. Inspect the validation table at the bottom of
the Markdown report to find rows that the framework rejected.

## 5. How real pilot partners should define final targets

The framework does **not** decide what counts as a successful
pilot. Partner organisations should:

* Decide their **target KPI direction** explicitly (e.g. "we want
  `water.use.l_per_kg_yield` to drop by ≥ 10 %"). The framework
  reports direction status, but it does not assert a target was
  met.
* Specify **acceptable noise floor** for each KPI (e.g. ±5 %).
  The framework does not compute significance; partners must apply
  their own statistical analysis on top of the report's data.
* Document the **intervention protocol** in the `intervention`
  column. Future versions of the framework may aggregate KPI
  results by intervention label.
* Keep evidence files **append-only**: rejected evidence must
  remain in the file so the audit trail is intact.
* Use **canonical units** consistently across partners so that
  cross-pilot aggregation is possible.

## 6. Limitations to be honest about

* The framework is a *scaffold*: it does not perform significance
  testing, season normalisation, or weather correction.
* The synthetic data is fictional; numbers in `data/samples/` are
  not a forecast or projection.
* The framework does not integrate with any specific IoT platform,
  weather data source, or farm management system.
* Extending the schema (new units, new formula forms, new fields)
  is straightforward but requires a code change; partners who
  cannot change code should fork the catalog file only and ask the
  MyZubster maintainers to add the required KPI.

## 7. Disclaimers

Every report carries the framework's standard disclaimers. The
framework makes no claim about EU LIFE funding, endorsement, or
partnership. Partners are responsible for the language they use
in their own publications.