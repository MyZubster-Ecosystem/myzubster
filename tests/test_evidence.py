"""Tests for the evidence/provenance model."""

from __future__ import annotations

from pathlib import Path

import pytest

from myzpkpi.evidence import (
    EVIDENCE_SCHEMA_VERSION,
    VALIDATION_STATUSES,
    Evidence,
    load_evidence_records,
    now_utc_iso,
    write_evidence_records,
)


def _sample_evidence(**overrides) -> Evidence:
    base = {
        "evidence_id": "E-1",
        "timestamp": "2024-01-01T00:00:00+00:00",
        "source": "sensor:test",
        "method": "test",
        "unit": "kg",
        "value": 1.5,
    }
    base.update(overrides)
    return Evidence(**base)


def test_evidence_requires_valid_status():
    with pytest.raises(ValueError):
        _sample_evidence(validation_status="dubious")


def test_evidence_requires_iso_timestamp():
    with pytest.raises(ValueError):
        _sample_evidence(timestamp="yesterday")


def test_evidence_accepts_z_suffix():
    rec = _sample_evidence(timestamp="2024-01-01T00:00:00Z")
    assert rec.timestamp.startswith("2024-01-01")


def test_evidence_fingerprint_is_stable():
    rec = _sample_evidence()
    fp1 = rec.fingerprint()
    fp2 = rec.fingerprint()
    assert fp1 == fp2
    assert len(fp1) == 16


def test_evidence_fingerprint_changes_with_value():
    rec = _sample_evidence()
    fp_a = rec.fingerprint()
    rec2 = _sample_evidence(value=2.0)
    fp_b = rec2.fingerprint()
    assert fp_a != fp_b


def test_load_evidence_records_from_sample():
    p = Path(__file__).resolve().parent.parent / "data" / "samples" / "evidence.json"
    records = load_evidence_records(p)
    assert len(records) >= 1
    for r in records:
        assert r.validation_status in VALIDATION_STATUSES
        assert r.version == EVIDENCE_SCHEMA_VERSION


def test_write_evidence_records_roundtrip(tmp_path: Path):
    recs = [_sample_evidence()]
    dest = tmp_path / "ev.json"
    write_evidence_records(recs, dest)
    loaded = load_evidence_records(dest)
    assert loaded[0].evidence_id == recs[0].evidence_id


def test_now_utc_iso_returns_valid_iso():
    ts = now_utc_iso()
    from datetime import datetime
    # Should parse without error.
    datetime.fromisoformat(ts.replace("Z", "+00:00"))