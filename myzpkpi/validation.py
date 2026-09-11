"""Validation helpers for baseline data and KPI inputs.

This module is deliberately conservative: it never *fixes* data,
it only reports missing / suspicious values so the report layer can
flag them. Downstream tooling may choose to drop a record or a KPI
from the comparison when validation fails.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .baseline import NUMERIC_FIELDS, BaselineRecord


@dataclass
class ValidationIssue:
    record_id: str
    field: str
    severity: str  # "error" | "warning"
    message: str


# Fields that must be non-negative when present.
NON_NEGATIVE_FIELDS = set(NUMERIC_FIELDS.keys())


def validate_records(records: Iterable[BaselineRecord]) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for rec in records:
        # Required core fields.
        if not rec.record_id:
            issues.append(ValidationIssue(
                record_id="<missing>", field="record_id", severity="error",
                message="record_id is required"))
        if not rec.site_id:
            issues.append(ValidationIssue(
                record_id=rec.record_id, field="site_id", severity="error",
                message="site_id is required"))
        if not rec.period_start or not rec.period_end:
            issues.append(ValidationIssue(
                record_id=rec.record_id, field="period", severity="error",
                message="period_start and period_end are required"))
        if rec.days is None or rec.days <= 0:
            issues.append(ValidationIssue(
                record_id=rec.record_id, field="days", severity="error",
                message=f"days must be a positive integer, got {rec.days!r}"))
        if rec.area_m2 is None or rec.area_m2 <= 0:
            issues.append(ValidationIssue(
                record_id=rec.record_id, field="area_m2", severity="error",
                message=f"area_m2 must be positive, got {rec.area_m2!r}"))

        # Non-negative numeric fields when present.
        for f in NON_NEGATIVE_FIELDS:
            value = getattr(rec, f, None)
            if value is None:
                continue
            if isinstance(value, (int, float)) and value < 0:
                issues.append(ValidationIssue(
                    record_id=rec.record_id, field=f, severity="error",
                    message=f"{f} must be >= 0, got {value!r}"))

        # Sample-related fields are coupled.
        if rec.expected_samples is not None and rec.missing_samples is not None:
            if rec.missing_samples > rec.expected_samples:
                issues.append(ValidationIssue(
                    record_id=rec.record_id, field="missing_samples",
                    severity="error",
                    message=(
                        f"missing_samples ({rec.missing_samples}) > "
                        f"expected_samples ({rec.expected_samples})"
                    )))
        # Acceptance fields are coupled.
        for accepted, total in (
            ("accepted_recommendations", "issued_recommendations"),
            ("matching_outcomes", "evaluated_recommendations"),
        ):
            a = getattr(rec, accepted, None)
            t = getattr(rec, total, None)
            if a is not None and t is not None and a > t:
                issues.append(ValidationIssue(
                    record_id=rec.record_id, field=accepted, severity="error",
                    message=(
                        f"{accepted} ({a}) > {total} ({t})"
                    )))

        # Detection time / response time must be parseable ISO-8601.
        for f in ("detection_time", "response_time"):
            value = getattr(rec, f, None)
            if value in (None, ""):
                continue
            try:
                from datetime import datetime
                datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                issues.append(ValidationIssue(
                    record_id=rec.record_id, field=f, severity="error",
                    message=f"{f} must be ISO-8601, got {value!r}"))

    return issues


def validate_kpi_required_inputs(
    records: Iterable[BaselineRecord],
    required_inputs: Iterable[str],
) -> list[ValidationIssue]:
    """Return a warning for each record missing any required input.

    The check is intentionally lightweight: a record may still be
    usable in other KPIs even when missing the inputs of one KPI,
    so the issues returned here are ``warning`` severity.
    """
    issues: list[ValidationIssue] = []
    required = list(required_inputs)
    for rec in records:
        for f in required:
            if getattr(rec, f, None) is None:
                issues.append(ValidationIssue(
                    record_id=rec.record_id, field=f, severity="warning",
                    message=f"required input for KPI missing: {f}"))
    return issues