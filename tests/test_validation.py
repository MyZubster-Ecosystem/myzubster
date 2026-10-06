"""Tests for the validation module."""

from __future__ import annotations

import pytest

from myzpkpi.baseline import BaselineRecord
from myzpkpi.validation import validate_records, validate_kpi_required_inputs


def _rec(**overrides) -> BaselineRecord:
    base = {
        "record_id": "r1", "site_id": "plot",
        "period_start": "2024-01-01", "period_end": "2024-01-31",
        "area_m2": 100.0, "days": 30,
    }
    base.update(overrides)
    return BaselineRecord(**base)


def test_valid_record_has_no_issues():
    issues = validate_records([_rec(irrigation_L=100.0)])
    assert not issues


def test_missing_record_id_reports_error():
    rec = _rec()
    rec.record_id = ""
    issues = validate_records([rec])
    assert any(i.severity == "error" and i.field == "record_id" for i in issues)


def test_negative_area_reports_error():
    issues = validate_records([_rec(area_m2=-1.0)])
    assert any(i.field == "area_m2" for i in issues)


def test_missing_samples_cannot_exceed_expected():
    issues = validate_records([_rec(expected_samples=10, missing_samples=20)])
    assert any(i.field == "missing_samples" for i in issues)


def test_accepted_cannot_exceed_issued():
    issues = validate_records([_rec(
        issued_recommendations=5, accepted_recommendations=10,
    )])
    assert any(i.field == "accepted_recommendations" for i in issues)


def test_matching_cannot_exceed_evaluated():
    issues = validate_records([_rec(
        evaluated_recommendations=5, matching_outcomes=10,
    )])
    assert any(i.field == "matching_outcomes" for i in issues)


def test_invalid_iso_timestamp_reports_error():
    issues = validate_records([_rec(
        detection_time="not-a-time", response_time="also-not-a-time",
    )])
    assert any(i.field in {"detection_time", "response_time"} for i in issues)


def test_validate_kpi_required_inputs_reports_warnings():
    rec = _rec(irrigation_L=None)
    issues = validate_kpi_required_inputs([rec], ["irrigation_L"])
    assert any(i.severity == "warning" for i in issues)