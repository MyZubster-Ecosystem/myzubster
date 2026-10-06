# KPI Schema

This document is the authoritative reference for the machine-readable
KPI definitions used by the MyZubster Pilot Baseline, KPI & Evidence
Framework.

The schema is intentionally generic so that future LIFE project work
packages can extend it without breaking existing data.

## Canonical units

All KPI values use SI or canonical units. The framework refuses to
load a KPI definition whose unit is not in the following list — this
prevents accidentally mixing pounds and kilograms in the same report.

| Code | Meaning |
|------|---------|
| `L` | litre (volume) |
| `kWh` | kilowatt-hour (energy) |
| `MJ` | megajoule (energy) |
| `kg` | kilogram (mass) |
| `t` | tonne (mass, 1 t = 1000 kg) |
| `m2` | square metre (area) |
| `ha` | hectare (area, 1 ha = 10000 m2) |
| `h` | hour (time) |
| `min` | minute (time) |
| `s` | second (time) |
| `%` | percent (0-100) |
| `ratio` | dimensionless ratio (≥ 0) |
| `count` | discrete count (≥ 0 integer) |
| `C` | degree Celsius (temperature) |
| `mS/cm` | electrical conductivity |
| `ppm` | parts per million |
| `pH` | pH unit (0-14) |
| `L/kg` | litre per kilogram (volume per mass) |
| `L/m²/day` | litre per square metre per day (intensity) |
| `kWh/kg` | kilowatt-hour per kilogram (energy per mass) |
| `kg/m²` | kilogram per square metre (yield density) |
| `kg/kg` | kilogram per kilogram (mass per mass) |
| `h/kg` | hour per kilogram (time per mass) |
| `h/m²` | hour per square metre (time per area) |

If a real pilot needs an additional unit, add it to `UNITS` in
`myzpkpi/kpi_schema.py` and document it in this table.

## KPI definition fields

Each KPI carries:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Stable machine identifier (e.g. `water.use.l_per_kg_yield`). |
| `family` | yes | High-level grouping: `water`, `energy`, `yield`, `nutrient`, `labour`, `data_quality`, `ops`, `ai_validation`. |
| `name` | yes | Human-readable name. |
| `unit` | yes | One of the canonical unit codes above. For ratio/intensity KPIs, the unit must represent the computed quantity (e.g. `L/kg`, not `L`). |
| `formula` | yes | Textual expression of the computation. See [Formula DSL](#formula-dsl). |
| `description` | yes | Plain-English explanation. |
| `inputs` | yes (can be empty) | List of input field names (drawn from `BaselineRecord`). |
| `aggregation` | no, default `sum` | One of `sum`, `mean`, `last`, `ratio-of-totals`. |
| `direction` | no, default `lower_is_better` | `lower_is_better` or `higher_is_better`. |
| `lifecycle` | no, default `sensor` | Where the data comes from: `sensor`, `manual`, `model`, `hybrid`. |
| `notes` | no | Free-form assumptions and caveats. |
| `version` | no, default `SCHEMA_VERSION` | Schema version (semver) of the definition. |

## Formula DSL

The calculator recognises a small set of formula forms. Identifiers
in the textual formula map positionally to slots:

* 1st identifier → `a`
* 2nd identifier → `b`
* 3rd identifier → `c`

Slot identifiers `a`, `b`, `c` are reserved placeholders. Real field
names (e.g. `irrigation_L`, `yield_kg`) may be used directly in the
formula; the calculator extracts them by position.

| Formula form | Meaning |
|--------------|---------|
| `a / b` | Simple ratio. |
| `a / (b * c)` | Ratio with product in denominator (e.g. L / (m² · d)). |
| `a - b` | Difference. |
| `1 - (a / b)` | Uptime / completeness (e.g. `1 - missing / expected`). |
| `anomaly_response_minutes` | Custom helper that computes the minutes between `detection_time` and `response_time`. |
| `<field_name>` | Single identifier — returns the field value as-is. |

Anything more complex should be implemented as a new KPI entry with
an explicit `formula` and a small helper added in
`myzpkpi/calculator.py`.

### Examples

```yaml
- id: water.use.l_per_kg_yield
  family: water
  name: Irrigation water per yield
  unit: L/kg
  formula: irrigation_L / yield_kg
  description: Litres of irrigation water per kilogram of yield.
  inputs: [irrigation_L, yield_kg]
  aggregation: ratio-of-totals
  direction: lower_is_better

- id: data_quality.uptime
  family: data_quality
  name: Sensor / data uptime
  unit: ratio
  formula: 1 - (missing_samples / expected_samples)
  description: Fraction of expected samples successfully captured.
  inputs: [missing_samples, expected_samples]
  aggregation: mean
  direction: higher_is_better

- id: ops.anomaly_response.min
  family: ops
  name: Anomaly detection-to-response time
  unit: min
  formula: anomaly_response_minutes
  description: Minutes between detection and recorded response.
  inputs: [detection_time, response_time]
  aggregation: mean
  direction: lower_is_better
```

## Aggregation policy

`aggregation` defines how the calculator combines per-record KPI
values across multiple baseline or pilot periods:

* `sum` — sum all per-record values. Use for additive quantities
  such as total yield or total labour hours.
* `mean` — arithmetic mean of per-record values. Use for rates or
  ratios that are already computed per record and are comparable
  across records (e.g. sensor uptime).
* `last` — last non-None per-record value. Use for time-ordered
  measurements where the most recent value is the relevant one.
* `ratio-of-totals` — sum numerators and denominators across
  records, then compute the overall ratio. **This is the correct
  policy for intensity/ratio KPIs** where per-record ratios must
  not be averaged or summed. For example, irrigation water per
  yield should be computed as `sum(irrigation_L) / sum(yield_kg)`
  across all records, not as the mean of `irrigation_L / yield_kg`
  per record. Splitting one observation period into multiple
  records must not distort the aggregate KPI.

The aggregated result still carries the worst `status` of the
underlying per-record results: if any input record produced a
`missing_input` or `invalid`, the aggregated KPI is marked
`partial` (or `missing_input` / `invalid` when no values are
present at all).

## Direction policy

`direction` defines whether a lower or higher value is considered
an improvement:

* `lower_is_better` — pilot < baseline → `improved`.
* `higher_is_better` — pilot > baseline → `improved`.

The framework reports an honest delta and direction status; it does
not invent a percentage improvement that is not directly derivable
from the input data.
