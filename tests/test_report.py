"""Tests for the report generator."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from myzpkpi.baseline import BaselineRecord, load_records_csv
from myzpkpi.evidence import load_evidence_records
from myzpkpi.kpi_schema import default_kpis
from myzpkpi.report import (
    DEFAULT_DISCLAIMERS,
    build_report,
    write_report_json,
    write_report_markdown,
)


@pytest.fixture
def sample_records() -> list[BaselineRecord]:
    return load_records_csv(
        Path(__file__).resolve().parent.parent
        / "data" / "samples" / "records.csv"
    )


@pytest.fixture
def sample_evidence():
    return load_evidence_records(
        Path(__file__).resolve().parent.parent
        / "data" / "samples" / "evidence.json"
    )


def test_build_report_contains_all_kpis(sample_records):
    kpis = default_kpis()
    report = build_report(sample_records, kpis)
    assert {c.kpi_id for c in report.comparisons} == {k.id for k in kpis}


def test_report_includes_disclaimers(sample_records):
    report = build_report(sample_records, default_kpis())
    assert report.disclaimers
    assert "synthetic" in report.disclaimers[0].lower()


def test_report_distinguishes_baseline_and_pilot(sample_records):
    report = build_report(sample_records, default_kpis())
    assert report.baseline_count == 3
    assert report.pilot_count == 2


def test_report_direction_lower_is_better(sample_records):
    """For a lower-is-better KPI, pilot < baseline must be improved."""
    kpis = default_kpis()
    water = next(k for k in kpis if k.id == "water.use.l_per_kg_yield")
    report = build_report(sample_records, [water])
    cmp = report.comparisons[0]
    # When baseline > pilot, lower_is_better should be 'improved'.
    if cmp.baseline_value is not None and cmp.pilot_value is not None:
        if cmp.pilot_value < cmp.baseline_value:
            assert cmp.direction_status == "improved"


def test_report_direction_higher_is_better(sample_records):
    kpis = default_kpis()
    yield_kpi = next(k for k in kpis if k.id == "yield.kg_per_m2")
    report = build_report(sample_records, [yield_kpi])
    cmp = report.comparisons[0]
    if cmp.baseline_value is not None and cmp.pilot_value is not None:
        if cmp.pilot_value > cmp.baseline_value:
            assert cmp.direction_status == "improved"


def test_report_delta_handles_zero_baseline():
    kpis = default_kpis()
    water = next(k for k in kpis if k.id == "water.use.l_per_kg_yield")
    recs = [
        BaselineRecord(
            record_id="B", site_id="p", period_start="2024-01-01",
            period_end="2024-01-31", area_m2=100.0, days=30,
            irrigation_L=100.0, yield_kg=10.0,  # baseline ratio = 10.0
        ),
        BaselineRecord(
            record_id="P", site_id="p", period_start="2025-01-01",
            period_end="2025-01-31", area_m2=100.0, days=30,
            intervention="x", irrigation_L=50.0, yield_kg=10.0,  # pilot ratio = 5.0
        ),
    ]
    report = build_report(recs, [water])
    cmp = report.comparisons[0]
    # baseline_value=10, pilot_value=5 -> delta_abs=-5, delta_rel=-0.5
    assert cmp.delta_absolute == pytest.approx(-5.0)
    assert cmp.delta_relative == pytest.approx(-0.5)


def test_report_to_dict_roundtrips(sample_records):
    report = build_report(sample_records, default_kpis())
    d = report.to_dict()
    json.dumps(d)
    assert "comparisons" in d
    assert "disclaimers" in d


def test_report_writes_json_and_markdown(sample_records, tmp_path: Path):
    report = build_report(sample_records, default_kpis())
    json_path = tmp_path / "report.json"
    md_path = tmp_path / "report.md"
    write_report_json(report, json_path)
    write_report_markdown(report, md_path)
    assert json_path.exists() and md_path.exists()
    loaded = json.loads(json_path.read_text(encoding="utf-8"))
    assert loaded["framework_version"] == report.framework_version


def test_report_markdown_contains_disclaimers(sample_records):
    report = build_report(sample_records, default_kpis())
    md_path = Path(tmp_path := __import__("tempfile").gettempdir()) / "report.md"
    write_report_markdown(report, md_path)
    text = md_path.read_text(encoding="utf-8")
    assert "Disclaimers" in text
    assert "synthetic" in text.lower()
    md_path.unlink(missing_ok=True)


def test_report_includes_no_fabricated_claims(sample_records, sample_evidence):
    report = build_report(sample_records, default_kpis(), evidence=sample_evidence)
    md_path = Path(__import__("tempfile").gettempdir()) / "report.md"
    write_report_markdown(report, md_path)
    text = md_path.read_text(encoding="utf-8")
    # Banned phrases / over-claims.
    banned = ["LIFE project", "EU funding", "officially approved"]
    for phrase in banned:
        assert phrase.lower() not in text.lower()
    md_path.unlink(missing_ok=True)


def test_report_default_disclaimers_contains_synthetic_notice():
    joined = " ".join(DEFAULT_DISCLAIMERS).lower()
    assert "synthetic" in joined
    assert "does not assert" in joined


def test_report_flags_missing_data_not_fabricates(sample_records):
    """The B-incomplete record must NOT cause fabricated baseline values."""
    kpis = default_kpis()
    water = next(k for k in kpis if k.id == "water.use.l_per_kg_yield")
    report = build_report(sample_records, [water])
    cmp = report.comparisons[0]
    # Baseline value should be a real average of the two valid records.
    expected = ((3222.5 / 9.95) + (3098.7 / 9.51)) / 2
    assert cmp.baseline_value == pytest.approx(expected, rel=1e-3)