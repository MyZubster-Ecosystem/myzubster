"""Evidence / provenance model.

Every measurement used in baseline-vs-pilot comparisons must carry
provenance so that reports are auditable. The framework defines a
simple, schema-versioned ``Evidence`` record that downstream
LIFE-style work packages can extend.

An evidence record is intentionally small and additive — it does
not attempt to model a full W3C PROV graph. The minimum fields are
documented in ``docs/evidence.md``.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


EVIDENCE_SCHEMA_VERSION = "0.1.0"
EVIDENCE_SCHEMA_URI = "https://myzubster.example/schemas/evidence/v0.1"

# Validation status values, in increasing order of trust.
VALIDATION_STATUSES = (
    "raw",          # received from source, not checked
    "checked",      # passed range / unit checks
    "cross_validated",  # cross-checked against independent source
    "rejected",     # failed validation; MUST NOT be used in reports
)


@dataclass
class Evidence:
    """A single piece of measurement evidence."""

    evidence_id: str
    timestamp: str  # ISO-8601, UTC
    source: str     # e.g. "sensor:soil_moisture_01", "manual:operator_journal"
    method: str     # how the value was produced
    unit: str       # SI / canonical unit
    value: float | int | str
    version: str = EVIDENCE_SCHEMA_VERSION
    validation_status: str = "raw"
    notes: str = ""
    references: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.validation_status not in VALIDATION_STATUSES:
            raise ValueError(
                f"validation_status must be one of {VALIDATION_STATUSES}, "
                f"got {self.validation_status!r}"
            )
        # Validate ISO-8601 timestamp.
        datetime.fromisoformat(self.timestamp.replace("Z", "+00:00"))

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def fingerprint(self) -> str:
        """Stable SHA-256 fingerprint of the evidence content.

        Used by ``report`` to anchor evidence IDs without exposing raw
        values to log lines.
        """
        canonical = json.dumps(self.to_dict(), sort_keys=True,
                               separators=(",", ":")).encode("utf-8")
        return hashlib.sha256(canonical).hexdigest()[:16]


def now_utc_iso() -> str:
    """Return current UTC time as ISO-8601 string with explicit zone."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def load_evidence_records(source: str | Path) -> list[Evidence]:
    """Load a list of evidence records from a JSON file."""
    path = Path(source)
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("Evidence file must contain a list of records")
    return [Evidence(**item) for item in raw]


def write_evidence_records(records: list[Evidence], dest: str | Path) -> None:
    path = Path(dest)
    payload = [r.to_dict() for r in records]
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False),
                    encoding="utf-8")