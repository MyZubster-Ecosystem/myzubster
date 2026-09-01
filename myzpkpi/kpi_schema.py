"""KPI schema and machine-readable KPI definitions.

The schema is intentionally generic so that future LIFE project
work packages can extend it. Each KPI carries:

* id               — stable machine identifier
* family           — high-level grouping (water, energy, yield, ...)
* name             — human-readable name
* unit             — canonical SI unit (string); see ``UNITS`` notes
* formula          — textual expression of the computation
* description      — what the KPI measures
* inputs           — list of input field names (from BaselineRecord)
* aggregation      — how to roll up sub-periods (sum / mean / last)
* direction        — 'lower_is_better' or 'higher_is_better'
* lifecycle        — where the metric is sourced (sensor / manual / model)
* notes            — free-form assumptions and caveats
* version          — schema version of this definition (semver)

KPIs are loaded from a YAML/JSON file; this module also provides
helpers for validation and lookup.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable


SCHEMA_VERSION = "0.1.0"
KPI_SCHEMA_URI = "https://myzubster.example/schemas/kpi/v0.1"

# Canonical units used by the framework. Real pilots may add more
# units but MUST keep the canonical names here for comparability.
UNITS: dict[str, str] = {
    "L": "litre (volume)",
    "kWh": "kilowatt-hour (energy)",
    "MJ": "megajoule (energy)",
    "kg": "kilogram (mass)",
    "t": "tonne (mass, 1 t = 1000 kg)",
    "m2": "square metre (area)",
    "ha": "hectare (area, 1 ha = 10000 m2)",
    "h": "hour (time)",
    "min": "minute (time)",
    "s": "second (time)",
    "%": "percent (0-100, dimensionless ratio)",
    "ratio": "dimensionless ratio (>=0)",
    "count": "discrete count (>=0 integer)",
    "C": "degree Celsius (temperature)",
    "mS/cm": "millisiemens per centimetre (electrical conductivity)",
    "ppm": "parts per million (concentration)",
    "pH": "pH unit (acidity, 0-14)",
}


@dataclass
class KPI:
    """Single machine-readable KPI definition."""

    id: str
    family: str
    name: str
    unit: str
    formula: str
    description: str
    inputs: list[str] = field(default_factory=list)
    aggregation: str = "sum"  # one of: sum, mean, last
    direction: str = "lower_is_better"  # higher_is_better | lower_is_better
    lifecycle: str = "sensor"  # sensor | manual | model | hybrid
    notes: str = ""
    version: str = SCHEMA_VERSION

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "KPI":
        required = {"id", "family", "name", "unit", "formula", "description"}
        missing = required - raw.keys()
        if missing:
            raise ValueError(f"KPI definition missing keys: {sorted(missing)}")
        if raw["unit"] not in UNITS:
            raise ValueError(
                f"Unknown unit '{raw['unit']}' for KPI '{raw['id']}'. "
                f"Add it to UNITS first."
            )
        raw.setdefault("aggregation", "sum")
        raw.setdefault("direction", "lower_is_better")
        raw.setdefault("lifecycle", "sensor")
        raw.setdefault("inputs", [])
        raw.setdefault("notes", "")
        if raw["aggregation"] not in {"sum", "mean", "last"}:
            raise ValueError(
                f"aggregation must be sum/mean/last, got {raw['aggregation']!r}"
            )
        if raw["direction"] not in {"lower_is_better", "higher_is_better"}:
            raise ValueError(
                f"direction must be lower_is_better/higher_is_better, "
                f"got {raw['direction']!r}"
            )
        return cls(**raw)


def load_kpis(source: str | Path) -> list[KPI]:
    """Load KPI definitions from a JSON or YAML file.

    Only stdlib is used; YAML is parsed manually when needed so the
    package remains dependency-free. Real deployments are encouraged
    to keep the canonical ``data/config/kpi_catalog.json`` file in
    sync with this module's ``default_kpis()``.
    """
    path = Path(source)
    text = path.read_text(encoding="utf-8")
    if text.startswith("\ufeff"):  # pragma: no cover - tolerate BOM
        text = text[1:]
    # Manual YAML support: a very small subset that understands
    # ``key: value`` lines and ``key:`` followed by a list. Anything
    # more complex should be edited as JSON for clarity.
    if path.suffix.lower() in {".yaml", ".yml"}:
        raw = _parse_minimal_yaml(text)
    else:
        raw = json.loads(text)
    if isinstance(raw, dict) and "kpis" in raw:
        raw = raw["kpis"]
    if not isinstance(raw, list):
        raise ValueError("KPI file must contain a list of definitions")
    return [KPI.from_dict(item) for item in raw]


def _parse_minimal_yaml(text: str) -> Any:
    """Parse the minimal YAML we use for KPI catalogs.

    Supports:
      * top-level scalar values
      * ``key: value`` mappings (values may be strings or numbers)
      * ``- item`` lists (after a ``key:`` header)
    No support for nested mappings, anchors, or tags — anything more
    elaborate should be authored as JSON.
    """
    lines = [
        ln.rstrip()
        for ln in text.splitlines()
        if ln.strip() and not ln.lstrip().startswith("#")
    ]
    # Walk and decide single-document shape.
    root: Any = None
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("- "):
            if not isinstance(root, list):
                raise ValueError("List item found outside of a list context")
            root.append(_scalar(line[2:].strip()))
            i += 1
            continue
        if ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()
            if value == "":
                # Either a nested mapping or a list under this key.
                # Look ahead: if next non-empty line starts with "- ",
                # it's a list; otherwise nested mapping.
                j = i + 1
                while j < len(lines) and lines[j].startswith(" "):
                    j += 1
                if j < len(lines) and lines[j].startswith("- "):
                    items: list[Any] = []
                    while j < len(lines) and lines[j].startswith("- "):
                        items.append(_scalar(lines[j][2:].strip()))
                        j += 1
                    if root is None:
                        root = {}
                    if not isinstance(root, dict):
                        raise ValueError("Mixed list and mapping at top level")
                    root[key] = items
                    i = j
                    continue
                # Nested mapping (rare for our catalogs).
                nested: dict[str, Any] = {}
                k = i + 1
                while k < len(lines) and lines[k].startswith("  "):
                    sub = lines[k].strip()
                    if ":" in sub:
                        sk, _, sv = sub.partition(":")
                        nested[sk.strip()] = _scalar(sv.strip())
                    k += 1
                if root is None:
                    root = {}
                if not isinstance(root, dict):
                    raise ValueError("Mixed list and mapping at top level")
                root[key] = nested
                i = k
                continue
            if root is None:
                root = {}
            if not isinstance(root, dict):
                raise ValueError("Mixed scalar, list, and mapping at top level")
            root[key] = _scalar(value)
            i += 1
            continue
        raise ValueError(f"Unparseable YAML line: {line!r}")
    return root


def _scalar(text: str) -> Any:
    if text.startswith('"') and text.endswith('"'):
        return text[1:-1]
    if text.startswith("'") and text.endswith("'"):
        return text[1:-1]
    lowered = text.lower()
    if lowered in {"true", "false"}:
        return lowered == "true"
    if lowered in {"null", "~"}:
        return None
    try:
        if "." in text or "e" in lowered:
            return float(text)
        return int(text)
    except ValueError:
        return text


def write_kpis(kpis: Iterable[KPI], dest: str | Path) -> None:
    path = Path(dest)
    payload = [k.to_dict() for k in kpis]
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False),
                    encoding="utf-8")


def default_kpis() -> list[KPI]:
    """Return the built-in KPI catalog.

    The catalog covers all KPI families required by the framework:
    water/resource use, energy use, yield/output per area, nutrient/
    input efficiency, labour/time, sensor/data uptime, anomaly
    detection-to-response time, and AI recommendation validation.
    Real pilots can extend or override this list via
    ``load_kpis(catalog.json)``.
    """
    return [
        KPI(
            id="water.use.l_per_kg_yield",
            family="water",
            name="Irrigation water per yield",
            unit="L",
            formula="irrigation_L / yield_kg",
            description=(
                "Litres of irrigation water applied per kilogram of "
                "yield produced. Lower values indicate more "
                "water-efficient production."
            ),
            inputs=["irrigation_L", "yield_kg"],
            aggregation="mean",
            direction="lower_is_better",
            lifecycle="hybrid",
            notes=(
                "Numerator and denominator must cover the same period "
                "and site. Aggregation is performed by summing both "
                "numerator and denominator across the matched period "
                "set, then taking the ratio of the totals."
            ),
        ),
        KPI(
            id="water.use.l_per_m2_per_day",
            family="water",
            name="Irrigation intensity",
            unit="L",
            formula="irrigation_L / (area_m2 * days)",
            description=(
                "Average irrigation applied per square metre per day. "
                "Useful as a coarse hydrological footprint indicator."
            ),
            inputs=["irrigation_L", "area_m2", "days"],
            aggregation="sum",
            direction="lower_is_better",
            lifecycle="hybrid",
        ),
        KPI(
            id="energy.use.kwh_per_kg_yield",
            family="energy",
            name="Energy per yield",
            unit="kWh",
            formula="electricity_kWh / yield_kg",
            description=(
                "Kilowatt-hours of electricity consumed per kilogram "
                "of yield."
            ),
            inputs=["electricity_kWh", "yield_kg"],
            aggregation="sum",
            direction="lower_is_better",
            lifecycle="sensor",
        ),
        KPI(
            id="yield.kg_per_m2",
            family="yield",
            name="Yield per area",
            unit="kg",
            formula="yield_kg / area_m2",
            description=(
                "Total yield mass per square metre of cultivated area."
            ),
            inputs=["yield_kg", "area_m2"],
            aggregation="sum",
            direction="higher_is_better",
            lifecycle="hybrid",
        ),
        KPI(
            id="nutrient.n_kg_per_kg_yield",
            family="nutrient",
            name="Nitrogen input per yield",
            unit="kg",
            formula="fertilizer_n_kg / yield_kg",
            description=(
                "Mass of nitrogen applied (synthetic + organic) per "
                "kilogram of yield. Used as a proxy for nutrient "
                "efficiency."
            ),
            inputs=["fertilizer_n_kg", "yield_kg"],
            aggregation="sum",
            direction="lower_is_better",
            lifecycle="manual",
            notes=(
                "Only tracks nitrogen. Future LIFE work packages may "
                "add phosphorus, potassium and micronutrient KPIs; "
                "the framework does not invent them."
            ),
        ),
        KPI(
            id="labour.h_per_kg_yield",
            family="labour",
            name="Labour per yield",
            unit="h",
            formula="labour_h / yield_kg",
            description=(
                "Person-hours of labour invested per kilogram of "
                "yield produced."
            ),
            inputs=["labour_h", "yield_kg"],
            aggregation="sum",
            direction="lower_is_better",
            lifecycle="manual",
        ),
        KPI(
            id="data_quality.uptime",
            family="data_quality",
            name="Sensor / data uptime",
            unit="ratio",
            formula="1 - (missing_samples / expected_samples)",
            description=(
                "Fraction of expected sensor samples successfully "
                "captured and ingested. 1.0 means no missing data."
            ),
            inputs=["missing_samples", "expected_samples"],
            aggregation="mean",
            direction="higher_is_better",
            lifecycle="model",
        ),
        KPI(
            id="ops.anomaly_response.min",
            family="ops",
            name="Anomaly detection-to-response time",
            unit="min",
            formula="anomaly_response_minutes",
            description=(
                "Median time between an anomaly being detected and a "
                "human/automated response being recorded, in minutes."
            ),
            inputs=["detection_time", "response_time"],
            aggregation="mean",
            direction="lower_is_better",
            lifecycle="hybrid",
            notes=(
                "Computed only when both ``detection_time`` and "
                "``response_time`` are present. If either is missing "
                "the KPI is reported as ``missing_input``."
            ),
        ),
        KPI(
            id="ai.acceptance_rate",
            family="ai_validation",
            name="AI recommendation acceptance rate",
            unit="ratio",
            formula="accepted_recommendations / issued_recommendations",
            description=(
                "Share of model-issued recommendations accepted by the "
                "operator. A proxy for trust calibration, not for "
                "model quality."
            ),
            inputs=["accepted_recommendations", "issued_recommendations"],
            aggregation="mean",
            direction="higher_is_better",
            lifecycle="model",
        ),
        KPI(
            id="ai.precision_proxy",
            family="ai_validation",
            name="AI recommendation outcome match",
            unit="ratio",
            formula="matching_outcomes / evaluated_recommendations",
            description=(
                "Share of accepted recommendations whose actual "
                "outcome matched the model prediction. Used as a "
                "precision proxy, not a true precision metric."
            ),
            inputs=["matching_outcomes", "evaluated_recommendations"],
            aggregation="mean",
            direction="higher_is_better",
            lifecycle="model",
        ),
        KPI(
            id="labour.h_per_m2",
            family="labour",
            name="Labour intensity per area",
            unit="h",
            formula="labour_h / area_m2",
            description=(
                "Person-hours of labour invested per square metre of "
                "cultivated area."
            ),
            inputs=["labour_h", "area_m2"],
            aggregation="sum",
            direction="lower_is_better",
            lifecycle="manual",
        ),
    ]