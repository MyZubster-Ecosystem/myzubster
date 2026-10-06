"""Command-line entry point.

Usage::

    python -m myzpkpi [--records PATH] [--evidence PATH]
                      [--catalog PATH] [--out-dir PATH]

With no arguments, the framework loads the synthetic sample data
shipped under ``data/samples`` and writes JSON + Markdown reports
to ``reports/``.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import __version__
from .baseline import load_records_csv
from .evidence import load_evidence_records
from .kpi_schema import default_kpis, load_kpis
from .report import build_report, write_report_json, write_report_markdown


DEFAULT_REPO_ROOT = Path(__file__).resolve().parent.parent


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="myzpkpi",
        description=(
            "Generate a baseline-vs-pilot comparison report from "
            "synthetic or partner-supplied data."
        ),
    )
    parser.add_argument(
        "--records", type=Path,
        default=DEFAULT_REPO_ROOT / "data" / "samples" / "records.csv",
        help="Path to baseline/pilot CSV records.",
    )
    parser.add_argument(
        "--evidence", type=Path,
        default=DEFAULT_REPO_ROOT / "data" / "samples" / "evidence.json",
        help="Path to evidence JSON records (optional).",
    )
    parser.add_argument(
        "--catalog", type=Path,
        default=DEFAULT_REPO_ROOT / "data" / "config" / "kpi_catalog.json",
        help="Path to KPI catalog (JSON or YAML).",
    )
    parser.add_argument(
        "--out-dir", type=Path,
        default=DEFAULT_REPO_ROOT / "reports",
        help="Directory to write reports into.",
    )
    parser.add_argument(
        "--version", action="version",
        version=f"myzpkpi {__version__}",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(sys.argv[1:] if argv is None else argv)
    records = load_records_csv(args.records)
    evidence: list = []
    if args.evidence and Path(args.evidence).exists():
        evidence = load_evidence_records(args.evidence)
    if args.catalog and Path(args.catalog).exists():
        kpis = load_kpis(args.catalog)
    else:
        kpis = default_kpis()
    report = build_report(records, kpis, evidence=evidence)
    args.out_dir.mkdir(parents=True, exist_ok=True)
    json_path = args.out_dir / "report.json"
    md_path = args.out_dir / "report.md"
    write_report_json(report, json_path)
    write_report_markdown(report, md_path)
    print(json.dumps({
        "wrote": [str(json_path), str(md_path)],
        "baseline_count": report.baseline_count,
        "pilot_count": report.pilot_count,
        "comparisons": [c.kpi_id for c in report.comparisons],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())