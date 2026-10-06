"""Tests for the baseline data model and CSV I/O."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from myzpkpi.baseline import (
    NUMERIC_FIELDS,
    BaselineRecord,
    load_records_csv,
    load_records_json,
    split_baseline_and_pilot,
    write_records_csv,
    write_records_json,
)


@pytest.fixture
def sample_csv() -> Path:
    return Path(__file__).resolve().parent.parent / "data" / "samples" / "records.csv"


@pytest.fixture
def sample_records(sample_csv: Path) -> list[BaselineRecord]:
    return load_records_csv(sample_csv)


def test_csv_loads_expected_number_of_records(sample_records):
    # 2 baseline + 2 pilot + 1 incomplete (B-incomplete).
    assert len(sample_records) == 5


def test_csv_loads_required_fields(sample_records):
    for r in sample_records:
        assert r.record_id
        assert r.site_id
        assert r.period_start
        assert r.period_end
        assert r.area_m2 > 0
        assert r.days > 0


def test_csv_handles_bom(tmp_path: Path):
    csv_text = (
        "record_id,site_id,period_start,period_end,area_m2,days,irrigation_L,yield_kg,"
        "intervention,evidence_ids\n"
        "B-1,plot,2024-01-01,2024-01-31,100,30,1000,5,,E-1\n"
    )
    p = tmp_path / "bom.csv"
    p.write_bytes(b"\xef\xbb\xbf" + csv_text.encode("utf-8"))
    records = load_records_csv(p)
    assert len(records) == 1
    assert records[0].record_id == "B-1"


def test_csv_with_evidence_ids_parses_list(sample_records):
    b1 = next(r for r in sample_records if r.record_id == "B-2024-S1")
    assert b1.evidence_ids == ["E-001", "E-002", "E-003"]


def test_csv_with_empty_evidence_ids(sample_records):
    incomplete = next(r for r in sample_records if r.record_id == "B-incomplete")
    assert incomplete.evidence_ids == ["E-999"]


def test_csv_coerces_numeric_fields(sample_records):
    b1 = next(r for r in sample_records if r.record_id == "B-2024-S1")
    assert isinstance(b1.area_m2, float)
    assert isinstance(b1.days, int)
    assert isinstance(b1.irrigation_L, float)


def test_split_baseline_and_pilot(sample_records):
    baseline, pilot = split_baseline_and_pilot(sample_records)
    assert len(baseline) == 3  # B-2024-S1, B-2024-S2, B-incomplete
    assert len(pilot) == 2  # P-2025-S1, P-2025-S2
    for r in baseline:
        assert not r.intervention
    for r in pilot:
        assert r.intervention


def test_from_dict_rejects_unknown_field():
    raw = {"record_id": "x", "site_id": "y", "period_start": "a", "period_end": "b",
           "area_m2": 1.0, "days": 1, "made_up_field": 42}
    with pytest.raises(ValueError):
        BaselineRecord.from_dict(raw)


def test_from_dict_coerces_blank_to_none():
    raw = {"record_id": "x", "site_id": "y", "period_start": "a",
           "period_end": "b", "area_m2": 1.0, "days": 1, "irrigation_L": ""}
    rec = BaselineRecord.from_dict(raw)
    assert rec.irrigation_L is None


def test_from_dict_rejects_non_numeric():
    raw = {"record_id": "x", "site_id": "y", "period_start": "a",
           "period_end": "b", "area_m2": "not a number", "days": 1}
    with pytest.raises(ValueError):
        BaselineRecord.from_dict(raw)


def test_numeric_fields_dict_has_expected_keys():
    expected = {
        "area_m2", "days", "irrigation_L", "electricity_kWh",
        "fertilizer_n_kg", "yield_kg", "labour_h",
        "expected_samples", "missing_samples",
        "issued_recommendations", "accepted_recommendations",
        "evaluated_recommendations", "matching_outcomes",
    }
    assert expected <= set(NUMERIC_FIELDS)


def test_csv_roundtrip(tmp_path: Path, sample_records):
    out = tmp_path / "rt.csv"
    write_records_csv(sample_records, out)
    assert out.exists()
    reloaded = load_records_csv(out)
    assert len(reloaded) == len(sample_records)
    assert reloaded[0].record_id == sample_records[0].record_id


def test_json_roundtrip(tmp_path: Path, sample_records):
    out = tmp_path / "rt.json"
    write_records_json(sample_records, out)
    reloaded = load_records_json(out)
    assert len(reloaded) == len(sample_records)
    assert reloaded[0].record_id == sample_records[0].record_id
    # The JSON file must be valid JSON.
    json.loads(out.read_text(encoding="utf-8"))


def test_write_records_csv_rejects_empty_list(tmp_path: Path):
    with pytest.raises(ValueError):
        write_records_csv([], tmp_path / "empty.csv")