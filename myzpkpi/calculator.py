"""KPI calculator.

Given a :class:`BaselineRecord` and a :class:`KPI`, evaluate the KPI
according to its formula. The calculator is deliberately formula-
driven (no embedded magic numbers) so that the same calculation can
be reproduced from a different environment. The supported formula
forms are:

* ``a / b``                     simple ratio
* ``a / (b * c)``               ratio with product in denominator
* ``a - b``                     difference
* ``1 - (a / b)``               uptime / completeness style
* ``anomaly_response_minutes``  custom helper for ops.anomaly_response.min
* ``<field_name>``              returns the field value as-is

Field names inside the textual ``formula`` are mapped positionally
to slots ``a``, ``b``, ``c``: the first identifier is ``a``, the
second is ``b``, the third is ``c``. This means a catalog entry may
author a formula in plain English, e.g. ``irrigation_L / yield_kg``,
without giving up the calculator's deterministic matching.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Iterable

from .baseline import BaselineRecord
from .kpi_schema import KPI


@dataclass
class ComputationResult:
    kpi_id: str
    value: float | None
    inputs_used: dict[str, Any]
    status: str  # "ok" | "missing_input" | "invalid"
    notes: str = ""


def _get(record: BaselineRecord, name: str) -> Any:
    return getattr(record, name, None)


def _coerce_numeric(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _require(record: BaselineRecord, name: str) -> tuple[float | None, str | None]:
    raw = _get(record, name)
    num = _coerce_numeric(raw)
    if num is None:
        return None, f"missing or non-numeric input '{name}' (got {raw!r})"
    return num, None


_FIELD_TOKEN = re.compile(r"[A-Za-z_][A-Za-z0-9_]*")


def _classify_formula(formula: str) -> tuple[str, list[str]]:
    """Map a textual formula to a (kind, field_names) pair.

    The first identifier in the formula is the ``a`` field, the
    second is ``b`` and the third is ``c``. The ``kind`` is one of:

    * ``anomaly_response_minutes``
    * ``1 - (a / b)``
    * ``a / (b * c)``
    * ``a / b``
    * ``a - b``
    * ``field`` — single identifier, returned as-is

    Identifiers ``a``/``b``/``c`` are placeholders: when detected
    they are *removed* from the field list so that the caller can
    fill in real field names from the KPI's ``inputs``.
    """
    cleaned = formula.replace(" ", "")
    fields = _FIELD_TOKEN.findall(formula)
    placeholders = {"a", "b", "c"}
    real = [f for f in fields if f not in placeholders]
    if cleaned == "anomaly_response_minutes":
        return "anomaly_response_minutes", real
    if cleaned.startswith("1-(") and "/" in cleaned:
        return "1 - (a / b)", real
    has_div = "/" in cleaned
    has_mul = "*" in cleaned
    has_sub = "-" in cleaned
    if has_div and not has_sub:
        if "(" in cleaned and has_mul:
            return "a / (b * c)", real
        if len(real) >= 2:
            return "a / b", real[:2]
        if len(real) == 1:
            return "field", real[:1]
    if has_sub and not has_div and not has_mul:
        if len(real) >= 2:
            return "a - b", real[:2]
    if len(real) == 1 and not any(op in cleaned for op in "+-*/()"):
        return "field", real
    return formula, real


def compute(kpi: KPI, record: BaselineRecord) -> ComputationResult:
    """Evaluate a single KPI for a single record.

    The function never raises on missing data; it returns a
    :class:`ComputationResult` with ``status='missing_input'`` so the
    report layer can surface the gap.
    """
    formula = kpi.formula.strip()
    kind, fields = _classify_formula(formula)
    inputs_used: dict[str, Any] = {f: _get(record, f) for f in kpi.inputs}

    # When the formula uses placeholder identifiers (a / b / c),
    # ``fields`` is empty — fill in from kpi.inputs so callers can
    # mix and match placeholder formulas with concrete inputs.
    if not fields and kpi.inputs:
        fields = list(kpi.inputs)

    try:
        if kind == "anomaly_response_minutes":
            return _compute_anomaly_response(kpi, record, inputs_used)

        if kind == "1 - (a / b)":
            a_field = fields[0] if len(fields) >= 1 else None
            b_field = fields[1] if len(fields) >= 2 else None
            a, err_a = _require(record, a_field) if a_field else (None, "no a_field")
            b, err_b = _require(record, b_field) if b_field else (None, "no b_field")
            if a is None or b is None:
                return ComputationResult(
                    kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                    status="missing_input",
                    notes=err_a or err_b or "missing input",
                )
            if b == 0:
                return ComputationResult(
                    kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                    status="invalid",
                    notes="division by zero in denominator",
                )
            return ComputationResult(
                kpi_id=kpi.id, value=1.0 - (a / b),
                inputs_used=inputs_used, status="ok",
            )

        if kind == "a / b":
            a_field = fields[0] if len(fields) >= 1 else None
            b_field = fields[1] if len(fields) >= 2 else None
            a, err_a = _require(record, a_field) if a_field else (None, "no a_field")
            b, err_b = _require(record, b_field) if b_field else (None, "no b_field")
            if a is None or b is None:
                return ComputationResult(
                    kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                    status="missing_input",
                    notes=err_a or err_b or "missing input",
                )
            if b == 0:
                return ComputationResult(
                    kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                    status="invalid",
                    notes="division by zero in denominator",
                )
            return ComputationResult(
                kpi_id=kpi.id, value=a / b,
                inputs_used=inputs_used, status="ok",
            )

        if kind == "a / (b * c)":
            a_field = fields[0] if len(fields) >= 1 else None
            b_field = fields[1] if len(fields) >= 2 else None
            c_field = fields[2] if len(fields) >= 3 else None
            a, err_a = _require(record, a_field) if a_field else (None, "no a_field")
            b, err_b = _require(record, b_field) if b_field else (None, "no b_field")
            c, err_c = _require(record, c_field) if c_field else (None, "no c_field")
            if a is None or b is None or c is None:
                return ComputationResult(
                    kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                    status="missing_input",
                    notes=err_a or err_b or err_c or "missing input",
                )
            denom = b * c
            if denom == 0:
                return ComputationResult(
                    kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                    status="invalid",
                    notes="division by zero in denominator",
                )
            return ComputationResult(
                kpi_id=kpi.id, value=a / denom,
                inputs_used=inputs_used, status="ok",
            )

        if kind == "a - b":
            a_field = fields[0] if len(fields) >= 1 else None
            b_field = fields[1] if len(fields) >= 2 else None
            a, err_a = _require(record, a_field) if a_field else (None, "no a_field")
            b, err_b = _require(record, b_field) if b_field else (None, "no b_field")
            if a is None or b is None:
                return ComputationResult(
                    kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                    status="missing_input",
                    notes=err_a or err_b or "missing input",
                )
            return ComputationResult(
                kpi_id=kpi.id, value=a - b,
                inputs_used=inputs_used, status="ok",
            )

        if kind == "field":
            a_field = fields[0]
            a, err_a = _require(record, a_field)
            if a is None:
                return ComputationResult(
                    kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                    status="missing_input",
                    notes=err_a or "missing input",
                )
            return ComputationResult(
                kpi_id=kpi.id, value=a,
                inputs_used=inputs_used, status="ok",
            )

        # Fallback: treat the formula as a direct field reference.
        value = _coerce_numeric(_get(record, formula))
        if value is None:
            return ComputationResult(
                kpi_id=kpi.id, value=None, inputs_used=inputs_used,
                status="missing_input",
                notes=f"unknown formula {formula!r} or missing input",
            )
        return ComputationResult(
            kpi_id=kpi.id, value=value,
            inputs_used=inputs_used, status="ok",
        )
    except Exception as exc:  # pragma: no cover - defensive
        return ComputationResult(
            kpi_id=kpi.id, value=None, inputs_used=inputs_used,
            status="invalid", notes=f"unexpected error: {exc!r}",
        )


def _compute_anomaly_response(
    kpi: KPI, record: BaselineRecord, inputs_used: dict[str, Any],
) -> ComputationResult:
    """Compute the time between detection_time and response_time, in minutes."""
    if not record.detection_time or not record.response_time:
        return ComputationResult(
            kpi_id=kpi.id, value=None, inputs_used=inputs_used,
            status="missing_input",
            notes="detection_time and response_time are both required",
        )
    try:
        t_det = datetime.fromisoformat(record.detection_time.replace("Z", "+00:00"))
        t_resp = datetime.fromisoformat(record.response_time.replace("Z", "+00:00"))
    except ValueError as exc:
        return ComputationResult(
            kpi_id=kpi.id, value=None, inputs_used=inputs_used,
            status="invalid",
            notes=f"could not parse timestamps: {exc}",
        )
    delta = (t_resp - t_det).total_seconds() / 60.0
    if delta < 0:
        return ComputationResult(
            kpi_id=kpi.id, value=None, inputs_used=inputs_used,
            status="invalid",
            notes="response_time earlier than detection_time",
        )
    return ComputationResult(
        kpi_id=kpi.id, value=delta,
        inputs_used=inputs_used, status="ok",
    )


def aggregate(
    results: Iterable[ComputationResult], policy: str,
) -> tuple[float | None, str]:
    """Aggregate per-record results into a single value.

    ``policy`` is one of:
    * ``sum``   — sum all non-None numeric values
    * ``mean``  — arithmetic mean of non-None numeric values
    * ``last``  — last non-None numeric value

    The status returned reflects the per-record statuses.
    """
    values: list[float] = []
    statuses: set[str] = set()
    for r in results:
        statuses.add(r.status)
        if r.value is not None:
            values.append(r.value)

    if not values:
        status = (
            "invalid" if "invalid" in statuses
            else "missing_input"
        )
        return None, status
    if policy == "sum":
        agg = sum(values)
    elif policy == "mean":
        agg = sum(values) / len(values)
    elif policy == "last":
        agg = values[-1]
    else:
        raise ValueError(f"Unknown aggregation policy: {policy!r}")

    if statuses == {"ok"}:
        return agg, "ok"
    if "invalid" in statuses:
        return agg, "partial"
    return agg, "partial"