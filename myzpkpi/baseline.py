"""Baseline / pilot data model.

A ``BaselineRecord`` represents the aggregated measurements of one
period (typically a growing season or month) for one plot / site.
Pilot records add an ``intervention`` field that names the change
introduced in that period. Comparing baseline vs pilot records of
the same site is the basis of the framework's reports.

All numeric fields are optional; the calculator + validator will
treat missing values explicitly. Units follow the canonical list
in :mod:`myzpkpi.kpi_schema`.
"""

from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


BASELINE_SCHEMA_VERSION = "0.1.0"

# Numeric fields the framework knows how to consume. Keys are the
# canonical field names; values are the canonical units.
NUMERIC_FIELDS: dict[str, str] = {
    "area_m2": "m2",
    "days": "count",
    "irrigation_L": "L",
    "electricity_kWh": "kWh",
    "fertilizer_n_kg": "kg",
    "yield_kg": "kg",
    "labour_h": "h",
    "expected_samples": "count",
    "missing_samples": "count",
    "issued_recommendations": "count",
    "accepted_recommendations": "count",
    "evaluated_recommendations": "count",
    "matching_outcomes": "count",
}


@dataclass
class BaselineRecord:
    """A single period of measurements for a site / plot."""

    record_id: str
    site_id: str
    period_start: str  # ISO-8601 date or datetime
    period_end: str    # ISO-8601 date or datetime
    area_m2: float
    days: int
    irrigation_L: float | None = None
    electricity_kWh: float | None = None
    fertilizer_n_kg: float | None = None
    yield_kg: float | None = None
    labour_h: float | None = None
    expected_samples: int | None = None
    missing_samples: int | None = None
    issued_recommendations: int | None = None
    accepted_recommendations: int | None = None
    evaluated_recommendations: int | None = None
    matching_outcomes: int | None = None
    detection_time: str | None = None
    response_time: str | None = None
    intervention: str = ""  # empty for baseline, names intervention for pilot
    notes: str = ""
    evidence_ids: list[str] = field(default_factory=list)
    version: str = BASELINE_SCHEMA_VERSION

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "BaselineRecord":
        # Allow extra keys (forward-compat) but reject obviously wrong ones.
        valid_keys = {f for f in cls.__dataclass_fields__}  # type: ignore[attr-defined]
        unknown = set(raw) - valid_keys
        if unknown:
            raise ValueError(
                f"BaselineRecord has unknown fields: {sorted(unknown)}"
            )
        # Coerce None for missing numeric fields.
        for f in NUMERIC_FIELDS:
            if f in raw and raw[f] in ("", None):
                raw[f] = None
        # Coerce numeric fields to float/int.
        for f, unit in NUMERIC_FIELDS.items():
            if f in raw and raw[f] is not None:
                try:
                    raw[f] = float(raw[f]) if unit != "count" else int(float(raw[f]))
                except (TypeError, ValueError):
                    raise ValueError(
                        f"Field {f!r} must be numeric, got {raw[f]!r}"
                    ) from None
        return cls(**raw)


def load_records_csv(source: str | Path) -> list[BaselineRecord]:
    """Load baseline / pilot records from a CSV file.

    CSV is the recommended interchange format because it can be
    inspected in any spreadsheet and version-controlled cleanly.
    """
    path = Path(source)
    with path.open(encoding="utf-8-sig", newline="") as fh:
        reader = csv.DictReader(fh)
        records: list[BaselineRecord] = []
        for row in reader:
            # Parse list-like columns that were stored as ``"a;b;c"``.
            if row.get("evidence_ids"):
                row["evidence_ids"] = [
                    x for x in row["evidence_ids"].split(";") if x
                ]
            else:
                row["evidence_ids"] = []
            records.append(BaselineRecord.from_dict(row))
    return records


def write_records_csv(records: list[BaselineRecord], dest: str | Path) -> None:
    """Write baseline / pilot records to a CSV file."""
    path = Path(dest)
    if not records:
        raise ValueError("Cannot write empty record list to CSV")
    fieldnames = list(records[0].to_dict().keys())
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for rec in records:
            row = rec.to_dict()
            # Serialise list fields as ``"a;b;c"`` so a single CSV row
            # stays on a single line.
            row["evidence_ids"] = ";".join(row.get("evidence_ids") or [])
            writer.writerow(row)


def load_records_json(source: str | Path) -> list[BaselineRecord]:
    path = Path(source)
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("Baseline JSON must contain a list of records")
    return [BaselineRecord.from_dict(item) for item in raw]


def write_records_json(records: list[BaselineRecord], dest: str | Path) -> None:
    path = Path(dest)
    payload = [r.to_dict() for r in records]
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False),
                    encoding="utf-8")


def split_baseline_and_pilot(
    records: list[BaselineRecord],
) -> tuple[list[BaselineRecord], list[BaselineRecord]]:
    """Split records into baseline (no intervention) and pilot groups."""
    baseline = [r for r in records if not r.intervention]
    pilot = [r for r in records if r.intervention]
    return baseline, pilot