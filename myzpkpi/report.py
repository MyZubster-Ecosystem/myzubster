"""Report generator.

Produces a baseline-vs-pilot comparison report. The report is a
*machine-readable* JSON file plus a *human-readable* Markdown
summary. The generator never invents numbers: when data is missing
or invalid, the corresponding row in the report is flagged.

Important: the comparison value below is purely a function of the
input data. The framework MUST NOT print a marketing-style
"X% improvement" — only the actual difference and the absolute
delta, plus the direction derived from the KPI policy.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from . import __version__
from .baseline import BaselineRecord, split_baseline_and_pilot
from .calculator import ComputationResult, aggregate, compute
from .evidence import Evidence
from .kpi_schema import KPI
from .validation import ValidationIssue, validate_records


@dataclass
class KPIComparison:
    kpi_id: str
    family: str
    name: str
    unit: str
    direction: str
    formula: str
    baseline_value: float | None
    pilot_value: float | None
    delta_absolute: float | None
    delta_relative: float | None
    direction_status: str  # "improved" | "worsened" | "unchanged" | "indeterminate"
    status: str            # "ok" | "missing_input" | "invalid"
    notes: str = ""
    baseline_evidence_ids: list[str] = field(default_factory=list)
    pilot_evidence_ids: list[str] = field(default_factory=list)


@dataclass
class Report:
    generated_at: str
    framework_version: str
    baseline_count: int
    pilot_count: int
    validation_issues: list[dict[str, str]]
    comparisons: list[KPIComparison]
    disclaimers: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "generated_at": self.generated_at,
            "framework_version": self.framework_version,
            "baseline_count": self.baseline_count,
            "pilot_count": self.pilot_count,
            "validation_issues": self.validation_issues,
            "comparisons": [asdict(c) for c in self.comparisons],
            "disclaimers": self.disclaimers,
        }


# Standard disclaimers attached to every report. They protect the
# framework from being misread as a public claim about any real
# partner, fund, or regulatory programme.
DEFAULT_DISCLAIMERS: list[str] = [
    (
        "This report is generated from synthetic sample data shipped "
        "with the framework. Real pilots must replace the sample data "
        "with site-specific measurements before drawing conclusions."
    ),
    (
        "The framework does not assert any relationship with, or "
        "endorsement by, the European Commission, EU LIFE programme, "
        "or any other public funder."
    ),
    (
        "Improvement direction is derived mechanically from the KPI "
        "policy (lower_is_better / higher_is_better) and the input "
        "data only. No external benchmark, claim, or marketing "
        "percentage is implied."
    ),
]


def _direction_status(
    kpi: KPI, baseline: float | None, pilot: float | None,
) -> str:
    if baseline is None or pilot is None:
        return "indeterminate"
    if pilot == baseline:
        return "unchanged"
    if kpi.direction == "lower_is_better":
        return "improved" if pilot < baseline else "worsened"
    return "improved" if pilot > baseline else "worsened"


def _delta(
    baseline: float | None, pilot: float | None,
) -> tuple[float | None, float | None]:
    if baseline is None or pilot is None:
        return None, None
    if baseline == 0:
        return pilot - baseline, None
    return pilot - baseline, (pilot - baseline) / baseline


def _aggregate_records(
    kpi: KPI, records: list[BaselineRecord],
) -> tuple[float | None, str, list[str]]:
    """Compute one KPI across a list of records.

    Returns ``(value, status, evidence_ids)``.
    """
    if not records:
        return None, "missing_input", []
    per_record = [compute(kpi, r) for r in records]
    value, status = aggregate(per_record, kpi)
    evidence_ids: list[str] = []
    for r in records:
        evidence_ids.extend(r.evidence_ids)
    # De-duplicate while preserving order.
    seen: set[str] = set()
    deduped: list[str] = []
    for eid in evidence_ids:
        if eid not in seen:
            seen.add(eid)
            deduped.append(eid)
    return value, status, deduped


def build_report(
    records: list[BaselineRecord],
    kpis: list[KPI],
    *,
    evidence: list[Evidence] | None = None,
    disclaimers: list[str] | None = None,
) -> Report:
    """Build a baseline-vs-pilot comparison report.

    ``records`` may contain both baseline (no ``intervention``) and
    pilot records. The report aggregates each KPI separately for the
    two groups and computes an honest delta. Missing or invalid
    inputs are surfaced via the ``status`` field.
    """
    validation_issues = validate_records(records)
    baseline, pilot = split_baseline_and_pilot(records)

    comparisons: list[KPIComparison] = []
    for kpi in kpis:
        baseline_value, baseline_status, baseline_ev = _aggregate_records(
            kpi, baseline)
        pilot_value, pilot_status, pilot_ev = _aggregate_records(
            kpi, pilot)
        delta_abs, delta_rel = _delta(baseline_value, pilot_value)
        # Combined status: the worse of baseline and pilot.
        statuses = {baseline_status, pilot_status}
        if statuses == {"ok"}:
            combined = "ok"
        elif "invalid" in statuses:
            combined = "invalid"
        elif "missing_input" in statuses and len(statuses) == 1:
            combined = "missing_input"
        else:
            combined = "partial"
        notes_parts: list[str] = []
        if baseline_status != "ok":
            notes_parts.append(f"baseline: {baseline_status}")
        if pilot_status != "ok":
            notes_parts.append(f"pilot: {pilot_status}")
        comparisons.append(KPIComparison(
            kpi_id=kpi.id,
            family=kpi.family,
            name=kpi.name,
            unit=kpi.unit,
            direction=kpi.direction,
            formula=kpi.formula,
            baseline_value=baseline_value,
            pilot_value=pilot_value,
            delta_absolute=delta_abs,
            delta_relative=delta_rel,
            direction_status=_direction_status(
                kpi, baseline_value, pilot_value),
            status=combined,
            notes="; ".join(notes_parts),
            baseline_evidence_ids=baseline_ev,
            pilot_evidence_ids=pilot_ev,
        ))

    return Report(
        generated_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
        framework_version=__version__,
        baseline_count=len(baseline),
        pilot_count=len(pilot),
        validation_issues=[
            {"record_id": i.record_id, "field": i.field,
             "severity": i.severity, "message": i.message}
            for i in validation_issues
        ],
        comparisons=comparisons,
        disclaimers=list(disclaimers) if disclaimers is not None
        else list(DEFAULT_DISCLAIMERS),
    )


def write_report_json(report: Report, dest: str | Path) -> None:
    path = Path(dest)
    path.write_text(
        json.dumps(report.to_dict(), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def write_report_markdown(report: Report, dest: str | Path) -> None:
    path = Path(dest)
    lines: list[str] = []
    lines.append("# MyZubster Pilot Baseline vs Pilot Report")
    lines.append("")
    lines.append(f"- Generated at: `{report.generated_at}`")
    lines.append(f"- Framework version: `{report.framework_version}`")
    lines.append(f"- Baseline records: {report.baseline_count}")
    lines.append(f"- Pilot records: {report.pilot_count}")
    lines.append(f"- Validation issues: {len(report.validation_issues)}")
    lines.append("")
    if report.disclaimers:
        lines.append("## Disclaimers")
        for d in report.disclaimers:
            lines.append(f"- {d}")
        lines.append("")

    lines.append("## KPI Comparison")
    lines.append("")
    lines.append(
        "| KPI | Family | Unit | Baseline | Pilot | Δ abs | Δ rel "
        "| Direction | Status | Notes |"
    )
    lines.append(
        "|-----|--------|------|---------:|------:|------:|------:"
        "|-----------|--------|-------|"
    )
    for c in report.comparisons:
        def fmt_num(v):
            return "n/a" if v is None else f"{v:.4f}"
        def fmt_rel(v):
            return "n/a" if v is None else f"{v * 100:+.2f}%"
        lines.append(
            f"| `{c.kpi_id}` ({c.name}) "
            f"| {c.family} | {c.unit} "
            f"| {fmt_num(c.baseline_value)} "
            f"| {fmt_num(c.pilot_value)} "
            f"| {fmt_num(c.delta_absolute)} "
            f"| {fmt_rel(c.delta_relative)} "
            f"| {c.direction_status} "
            f"| {c.status} "
            f"| {c.notes} |"
        )
    lines.append("")

    if report.validation_issues:
        lines.append("## Validation Issues")
        lines.append("")
        lines.append("| Record | Field | Severity | Message |")
        lines.append("|--------|-------|----------|---------|")
        for i in report.validation_issues:
            lines.append(
                f"| `{i['record_id']}` | {i['field']} "
                f"| {i['severity']} | {i['message']} |"
            )
        lines.append("")
    else:
        lines.append("## Validation Issues")
        lines.append("")
        lines.append("No validation issues found.")
        lines.append("")

    # Evidence index — links IDs to records used in the report.
    evidence_ids: set[str] = set()
    for c in report.comparisons:
        evidence_ids.update(c.baseline_evidence_ids)
        evidence_ids.update(c.pilot_evidence_ids)
    if evidence_ids:
        lines.append("## Evidence Referenced")
        lines.append("")
        lines.append(
            "| Evidence ID | KPI(s) (baseline → pilot) |"
        )
        lines.append(
            "|-------------|---------------------------|"
        )
        for eid in sorted(evidence_ids):
            kpis_with_eid: list[str] = []
            for c in report.comparisons:
                in_baseline = eid in c.baseline_evidence_ids
                in_pilot = eid in c.pilot_evidence_ids
                if in_baseline or in_pilot:
                    tags = []
                    if in_baseline:
                        tags.append("baseline")
                    if in_pilot:
                        tags.append("pilot")
                    kpis_with_eid.append(f"`{c.kpi_id}` ({','.join(tags)})")
            lines.append(f"| `{eid}` | {'; '.join(kpis_with_eid)} |")
        lines.append("")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")