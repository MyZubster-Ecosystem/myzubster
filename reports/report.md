# MyZubster Pilot Baseline vs Pilot Report

- Generated at: `2026-09-01T18:29:35+00:00`
- Framework version: `0.1.0`
- Baseline records: 3
- Pilot records: 2
- Validation issues: 0

## Disclaimers
- This report is generated from synthetic sample data shipped with the framework. Real pilots must replace the sample data with site-specific measurements before drawing conclusions.
- The framework does not assert any relationship with, or endorsement by, the European Commission, EU LIFE programme, or any other public funder.
- Improvement direction is derived mechanically from the KPI policy (lower_is_better / higher_is_better) and the input data only. No external benchmark, claim, or marketing percentage is implied.

## KPI Comparison

| KPI | Family | Unit | Baseline | Pilot | Δ abs | Δ rel | Direction | Status | Notes |
|-----|--------|------|---------:|------:|------:|------:|-----------|--------|-------|
| `water.use.l_per_kg_yield` (Irrigation water per yield) | water | L | 324.8527 | 229.2155 | -95.6371 | -29.44% | improved | partial | baseline: partial |
| `water.use.l_per_m2_per_day` (Irrigation intensity) | water | L | 0.6986 | 0.5128 | -0.1857 | -26.59% | improved | partial | baseline: partial |
| `energy.use.kwh_per_kg_yield` (Energy per yield) | energy | kWh | 36.2169 | 29.2303 | -6.9866 | -19.29% | improved | partial | baseline: partial |
| `yield.kg_per_m2` (Yield per area) | yield | kg | 0.1946 | 0.2025 | 0.0079 | +4.06% | improved | partial | baseline: partial |
| `nutrient.n_kg_per_kg_yield` (Nitrogen input per yield) | nutrient | kg | 1.0379 | 0.8298 | -0.2080 | -20.04% | improved | partial | baseline: partial |
| `labour.h_per_kg_yield` (Labour per yield) | labour | h | 8.4798 | 6.9644 | -1.5153 | -17.87% | improved | partial | baseline: partial |
| `labour.h_per_m2` (Labour intensity per area) | labour | h | 0.8250 | 0.7050 | -0.1200 | -14.55% | improved | partial | baseline: partial |
| `data_quality.uptime` (Sensor / data uptime) | data_quality | ratio | 0.9103 | 0.9599 | 0.0497 | +5.46% | improved | partial | baseline: partial |
| `ops.anomaly_response.min` (Anomaly detection-to-response time) | ops | min | 105.0000 | 32.5000 | -72.5000 | -69.05% | improved | partial | baseline: partial |
| `ai.acceptance_rate` (AI recommendation acceptance rate) | ai_validation | ratio | n/a | 0.7129 | n/a | n/a | indeterminate | partial | baseline: missing_input |
| `ai.precision_proxy` (AI recommendation outcome match) | ai_validation | ratio | n/a | 0.6882 | n/a | n/a | indeterminate | partial | baseline: missing_input |

## Validation Issues

No validation issues found.

## Evidence Referenced

| Evidence ID | KPI(s) (baseline → pilot) |
|-------------|---------------------------|
| `E-001` | `water.use.l_per_kg_yield` (baseline); `water.use.l_per_m2_per_day` (baseline); `energy.use.kwh_per_kg_yield` (baseline); `yield.kg_per_m2` (baseline); `nutrient.n_kg_per_kg_yield` (baseline); `labour.h_per_kg_yield` (baseline); `labour.h_per_m2` (baseline); `data_quality.uptime` (baseline); `ops.anomaly_response.min` (baseline); `ai.acceptance_rate` (baseline); `ai.precision_proxy` (baseline) |
| `E-002` | `water.use.l_per_kg_yield` (baseline); `water.use.l_per_m2_per_day` (baseline); `energy.use.kwh_per_kg_yield` (baseline); `yield.kg_per_m2` (baseline); `nutrient.n_kg_per_kg_yield` (baseline); `labour.h_per_kg_yield` (baseline); `labour.h_per_m2` (baseline); `data_quality.uptime` (baseline); `ops.anomaly_response.min` (baseline); `ai.acceptance_rate` (baseline); `ai.precision_proxy` (baseline) |
| `E-003` | `water.use.l_per_kg_yield` (baseline); `water.use.l_per_m2_per_day` (baseline); `energy.use.kwh_per_kg_yield` (baseline); `yield.kg_per_m2` (baseline); `nutrient.n_kg_per_kg_yield` (baseline); `labour.h_per_kg_yield` (baseline); `labour.h_per_m2` (baseline); `data_quality.uptime` (baseline); `ops.anomaly_response.min` (baseline); `ai.acceptance_rate` (baseline); `ai.precision_proxy` (baseline) |
| `E-004` | `water.use.l_per_kg_yield` (baseline); `water.use.l_per_m2_per_day` (baseline); `energy.use.kwh_per_kg_yield` (baseline); `yield.kg_per_m2` (baseline); `nutrient.n_kg_per_kg_yield` (baseline); `labour.h_per_kg_yield` (baseline); `labour.h_per_m2` (baseline); `data_quality.uptime` (baseline); `ops.anomaly_response.min` (baseline); `ai.acceptance_rate` (baseline); `ai.precision_proxy` (baseline) |
| `E-005` | `water.use.l_per_kg_yield` (baseline); `water.use.l_per_m2_per_day` (baseline); `energy.use.kwh_per_kg_yield` (baseline); `yield.kg_per_m2` (baseline); `nutrient.n_kg_per_kg_yield` (baseline); `labour.h_per_kg_yield` (baseline); `labour.h_per_m2` (baseline); `data_quality.uptime` (baseline); `ops.anomaly_response.min` (baseline); `ai.acceptance_rate` (baseline); `ai.precision_proxy` (baseline) |
| `E-006` | `water.use.l_per_kg_yield` (pilot); `water.use.l_per_m2_per_day` (pilot); `energy.use.kwh_per_kg_yield` (pilot); `yield.kg_per_m2` (pilot); `nutrient.n_kg_per_kg_yield` (pilot); `labour.h_per_kg_yield` (pilot); `labour.h_per_m2` (pilot); `data_quality.uptime` (pilot); `ops.anomaly_response.min` (pilot); `ai.acceptance_rate` (pilot); `ai.precision_proxy` (pilot) |
| `E-007` | `water.use.l_per_kg_yield` (pilot); `water.use.l_per_m2_per_day` (pilot); `energy.use.kwh_per_kg_yield` (pilot); `yield.kg_per_m2` (pilot); `nutrient.n_kg_per_kg_yield` (pilot); `labour.h_per_kg_yield` (pilot); `labour.h_per_m2` (pilot); `data_quality.uptime` (pilot); `ops.anomaly_response.min` (pilot); `ai.acceptance_rate` (pilot); `ai.precision_proxy` (pilot) |
| `E-008` | `water.use.l_per_kg_yield` (pilot); `water.use.l_per_m2_per_day` (pilot); `energy.use.kwh_per_kg_yield` (pilot); `yield.kg_per_m2` (pilot); `nutrient.n_kg_per_kg_yield` (pilot); `labour.h_per_kg_yield` (pilot); `labour.h_per_m2` (pilot); `data_quality.uptime` (pilot); `ops.anomaly_response.min` (pilot); `ai.acceptance_rate` (pilot); `ai.precision_proxy` (pilot) |
| `E-009` | `water.use.l_per_kg_yield` (pilot); `water.use.l_per_m2_per_day` (pilot); `energy.use.kwh_per_kg_yield` (pilot); `yield.kg_per_m2` (pilot); `nutrient.n_kg_per_kg_yield` (pilot); `labour.h_per_kg_yield` (pilot); `labour.h_per_m2` (pilot); `data_quality.uptime` (pilot); `ops.anomaly_response.min` (pilot); `ai.acceptance_rate` (pilot); `ai.precision_proxy` (pilot) |
| `E-010` | `water.use.l_per_kg_yield` (pilot); `water.use.l_per_m2_per_day` (pilot); `energy.use.kwh_per_kg_yield` (pilot); `yield.kg_per_m2` (pilot); `nutrient.n_kg_per_kg_yield` (pilot); `labour.h_per_kg_yield` (pilot); `labour.h_per_m2` (pilot); `data_quality.uptime` (pilot); `ops.anomaly_response.min` (pilot); `ai.acceptance_rate` (pilot); `ai.precision_proxy` (pilot) |
| `E-999` | `water.use.l_per_kg_yield` (baseline); `water.use.l_per_m2_per_day` (baseline); `energy.use.kwh_per_kg_yield` (baseline); `yield.kg_per_m2` (baseline); `nutrient.n_kg_per_kg_yield` (baseline); `labour.h_per_kg_yield` (baseline); `labour.h_per_m2` (baseline); `data_quality.uptime` (baseline); `ops.anomaly_response.min` (baseline); `ai.acceptance_rate` (baseline); `ai.precision_proxy` (baseline) |

