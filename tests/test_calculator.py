"""Tests for the KPI calculator."""

from __future__ import annotations

import pytest

from myzpkpi.baseline import BaselineRecord
from myzpkpi.calculator import aggregate, compute
from myzpkpi.kpi_schema import KPI, default_kpis


def _rec(**overrides) -> BaselineRecord:
    base = {
        "record_id": "r1", "site_id": "plot",
        "period_start": "2024-01-01", "period_end": "2024-01-31",
        "area_m2": 100.0, "days": 30,
    }
    base.update(overrides)
    return BaselineRecord(**base)


def test_compute_simple_ratio():
    kpi = KPI(
        id="t", family="t", name="t", unit="L/kg",
        formula="irrigation_L / yield_kg",
        description="ratio",
        inputs=["irrigation_L", "yield_kg"],
    )
    r = _rec(irrigation_L=100.0, yield_kg=10.0)
    result = compute(kpi, r)
    assert result.status == "ok"
    assert result.value == pytest.approx(10.0)


def test_compute_simple_ratio_with_placeholder_formula():
    kpi = KPI(
        id="t", family="t", name="t", unit="L/kg",
        formula="a / b",
        description="ratio",
        inputs=["irrigation_L", "yield_kg"],
    )
    r = _rec(irrigation_L=100.0, yield_kg=10.0)
    result = compute(kpi, r)
    assert result.status == "ok"
    assert result.value == pytest.approx(10.0)


def test_compute_missing_input_returns_missing_status():
    kpi = KPI(
        id="t", family="t", name="t", unit="L/kg",
        formula="irrigation_L / yield_kg",
        description="ratio",
        inputs=["irrigation_L", "yield_kg"],
    )
    r = _rec(irrigation_L=100.0, yield_kg=None)
    result = compute(kpi, r)
    assert result.status == "missing_input"
    assert result.value is None


def test_compute_division_by_zero_returns_invalid():
    kpi = KPI(
        id="t", family="t", name="t", unit="L/kg",
        formula="irrigation_L / yield_kg",
        description="ratio",
        inputs=["irrigation_L", "yield_kg"],
    )
    r = _rec(irrigation_L=100.0, yield_kg=0)
    result = compute(kpi, r)
    assert result.status == "invalid"
    assert "division by zero" in result.notes


def test_compute_ratio_with_product_in_denominator():
    kpi = KPI(
        id="t", family="t", name="t", unit="L/m²/day",
        formula="irrigation_L / (area_m2 * days)",
        description="ratio",
        inputs=["irrigation_L", "area_m2", "days"],
    )
    r = _rec(irrigation_L=600.0, area_m2=100.0, days=30)
    result = compute(kpi, r)
    assert result.status == "ok"
    assert result.value == pytest.approx(0.2)


def test_compute_uptime_style():
    kpi = KPI(
        id="t", family="t", name="t", unit="ratio",
        formula="1 - (missing_samples / expected_samples)",
        description="uptime",
        inputs=["missing_samples", "expected_samples"],
    )
    r = _rec(missing_samples=10, expected_samples=100)
    result = compute(kpi, r)
    assert result.status == "ok"
    assert result.value == pytest.approx(0.9)


def test_compute_anomaly_response_minutes():
    kpi = KPI(
        id="t", family="t", name="t", unit="min",
        formula="anomaly_response_minutes",
        description="time diff",
        inputs=["detection_time", "response_time"],
    )
    r = _rec(
        detection_time="2024-01-01T08:00:00+00:00",
        response_time="2024-01-01T08:30:00+00:00",
    )
    result = compute(kpi, r)
    assert result.status == "ok"
    assert result.value == pytest.approx(30.0)


def test_compute_anomaly_response_missing_times():
    kpi = KPI(
        id="t", family="t", name="t", unit="min",
        formula="anomaly_response_minutes",
        description="time diff",
        inputs=["detection_time", "response_time"],
    )
    r = _rec(detection_time=None, response_time=None)
    result = compute(kpi, r)
    assert result.status == "missing_input"


def test_compute_anomaly_response_negative_delta():
    kpi = KPI(
        id="t", family="t", name="t", unit="min",
        formula="anomaly_response_minutes",
        description="time diff",
        inputs=["detection_time", "response_time"],
    )
    r = _rec(
        detection_time="2024-01-01T08:30:00+00:00",
        response_time="2024-01-01T08:00:00+00:00",
    )
    result = compute(kpi, r)
    assert result.status == "invalid"


def test_aggregate_ratio_of_totals_does_not_distort_on_split():
    kpi = KPI(
        id="water.use.l_per_kg_yield",
        family="water",
        name="Irrigation water per yield",
        unit="L/kg",
        formula="irrigation_L / yield_kg",
        description="ratio",
        inputs=["irrigation_L", "yield_kg"],
        aggregation="ratio-of-totals",
    )
    # One combined record: 100 L irrigation, 10 kg yield -> ratio 10 L/kg
    combined = _rec(record_id="combined", irrigation_L=100.0, yield_kg=10.0)
    # Two split records: same totals, split across two periods
    split1 = _rec(record_id="split1", irrigation_L=60.0, yield_kg=6.0)
    split2 = _rec(record_id="split2", irrigation_L=40.0, yield_kg=4.0)

    combined_result = compute(kpi, combined)
    split1_result = compute(kpi, split1)
    split2_result = compute(kpi, split2)

    combined_agg, combined_status = aggregate([combined_result], kpi)
    split_agg, split_status = aggregate([split1_result, split2_result], kpi)

    # Both aggregates must equal the true ratio-of-totals: 100/10 = 10
    assert combined_agg == pytest.approx(10.0)
    assert split_agg == pytest.approx(10.0)
    assert combined_agg == pytest.approx(split_agg)
    assert combined_status == "ok"
    assert split_status == "ok"


def test_aggregate_ratio_of_totals_with_product_denominator():
    kpi = KPI(
        id="water.use.l_per_m2_per_day",
        family="water",
        name="Irrigation intensity",
        unit="L/m²/day",
        formula="irrigation_L / (area_m2 * days)",
        description="ratio",
        inputs=["irrigation_L", "area_m2", "days"],
        aggregation="ratio-of-totals",
    )
    # Two records with same area/days split
    r1 = _rec(record_id="r1", irrigation_L=300.0, area_m2=100.0, days=30)
    r2 = _rec(record_id="r2", irrigation_L=300.0, area_m2=100.0, days=30)

    results = [compute(kpi, r) for r in (r1, r2)]
    value, status = aggregate(results, kpi)

    # numerator sum = 600, denominator sum = 100*30 + 100*30 = 6000
    assert value == pytest.approx(600.0 / 6000.0)
    assert status == "ok"


def test_aggregate_ratio_of_totals_missing_denominator():
    kpi = KPI(
        id="water.use.l_per_kg_yield",
        family="water",
        name="Irrigation water per yield",
        unit="L/kg",
        formula="irrigation_L / yield_kg",
        description="ratio",
        inputs=["irrigation_L", "yield_kg"],
        aggregation="ratio-of-totals",
    )
    r = _rec(record_id="r1", irrigation_L=100.0, yield_kg=None)
    result = compute(kpi, r)
    # compute should return missing_input when denominator is None
    assert result.status == "missing_input"
    assert result.value is None
    value, status = aggregate([result], kpi)
    assert value is None
    assert status == "missing_input"


def test_aggregate_ratio_of_totals_zero_denominator():
    kpi = KPI(
        id="water.use.l_per_kg_yield",
        family="water",
        name="Irrigation water per yield",
        unit="L/kg",
        formula="irrigation_L / yield_kg",
        description="ratio",
        inputs=["irrigation_L", "yield_kg"],
        aggregation="ratio-of-totals",
    )
    r = _rec(record_id="r1", irrigation_L=100.0, yield_kg=0.0)
    result = compute(kpi, r)
    value, status = aggregate([result], kpi)
    assert value is None
    assert status == "invalid"


def test_aggregate_sum():
    kpi = KPI(
        id="t", family="t", name="t", unit="count",
        formula="yield_kg",
        description="sum-test",
        inputs=["yield_kg"],
        aggregation="sum",
    )
    records = [
        _rec(record_id="r1", yield_kg=10.0),
        _rec(record_id="r2", yield_kg=20.0),
    ]
    per = [compute(kpi, r) for r in records]
    value, status = aggregate(per, kpi)
    # Each per-record value is the raw field; sum = 30.0
    assert value == pytest.approx(30.0)
    assert status == "ok"


def test_aggregate_mean_filters_none():
    kpi = KPI(
        id="t", family="t", name="t", unit="ratio",
        formula="irrigation_L / yield_kg",
        description="mean-test",
        inputs=["irrigation_L", "yield_kg"],
        aggregation="mean",
    )
    records = [
        _rec(record_id="r1", irrigation_L=100.0, yield_kg=10.0),
        _rec(record_id="r2", irrigation_L=None, yield_kg=None),
    ]
    per = [compute(kpi, r) for r in records]
    value, status = aggregate(per, kpi)
    assert value == pytest.approx(10.0)
    assert status == "partial"


def test_aggregate_unknown_policy():
    from myzpkpi.calculator import ComputationResult
    kpi = KPI(
        id="t", family="t", name="t", unit="ratio",
        formula="a / b", description="x",
        inputs=["a", "b"], aggregation="median",
    )
    with pytest.raises(ValueError):
        aggregate([ComputationResult("x", 1.0, {}, "ok")], kpi)
