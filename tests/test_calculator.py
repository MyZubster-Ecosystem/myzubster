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
        id="t", family="t", name="t", unit="L",
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
        id="t", family="t", name="t", unit="L",
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
        id="t", family="t", name="t", unit="L",
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
        id="t", family="t", name="t", unit="L",
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
        id="t", family="t", name="t", unit="L",
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


def test_aggregate_sum():
    kpis = default_kpis()
    water = next(k for k in kpis if k.id == "water.use.l_per_kg_yield")
    records = [
        _rec(record_id="r1", irrigation_L=100.0, yield_kg=10.0),
        _rec(record_id="r2", irrigation_L=200.0, yield_kg=20.0),
    ]
    per = [compute(water, r) for r in records]
    value, status = aggregate(per, "sum")
    # Each per-record value is 10.0; sum = 20.0
    assert value == pytest.approx(20.0)
    assert status == "ok"


def test_aggregate_mean_filters_none():
    kpis = default_kpis()
    water = next(k for k in kpis if k.id == "water.use.l_per_kg_yield")
    records = [
        _rec(record_id="r1", irrigation_L=100.0, yield_kg=10.0),
        _rec(record_id="r2", irrigation_L=None, yield_kg=None),
    ]
    per = [compute(water, r) for r in records]
    value, status = aggregate(per, "mean")
    assert value == pytest.approx(10.0)
    assert status == "partial"


def test_aggregate_unknown_policy():
    from myzpkpi.calculator import ComputationResult
    with pytest.raises(ValueError):
        aggregate([ComputationResult("x", 1.0, {}, "ok")], "median")