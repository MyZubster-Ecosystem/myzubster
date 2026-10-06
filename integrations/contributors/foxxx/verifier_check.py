#!/usr/bin/env python3
"""Zero-dependency independent verifier for foxxx009 KPI/evidence framework.

Canonical contribution:
- PR #894
- contributor commit 70cb32c6500525df4056859525fe215b95188a02
- merge commit 50f70aab6dc9a909f65b81cb70d932706143afec

This verifier intentionally avoids pip/pytest so it can run on a minimal VPS
with only Python 3 and the checked-out repository.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CONTRIBUTOR_COMMIT = "70cb32c6500525df4056859525fe215b95188a02"
MERGE_COMMIT = "50f70aab6dc9a909f65b81cb70d932706143afec"

REQUIRED_SOURCE_SNIPPETS = {
    "synthetic_disclaimer": "This report is generated from synthetic sample data",
    "no_funder_endorsement": "does not assert any relationship with, or endorsement by",
    "missing_input_surface": "missing_input",
    "evidence_ids": "baseline_evidence_ids",
}


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )


def main() -> int:
    sys.path.insert(0, str(ROOT))

    from myzpkpi.baseline import load_records_csv
    from myzpkpi.evidence import load_evidence_records
    from myzpkpi.kpi_schema import default_kpis
    from myzpkpi.report import build_report, write_report_json, write_report_markdown

    report_file = ROOT / "myzpkpi/report.py"
    source = report_file.read_text(encoding="utf-8")
    source_checks = {k: v in source for k, v in REQUIRED_SOURCE_SNIPPETS.items()}
    head = run(["git", "rev-parse", "HEAD"]).stdout.strip()

    records = load_records_csv(ROOT / "data/samples/records.csv")
    evidence = load_evidence_records(ROOT / "data/samples/evidence.json")
    kpis = default_kpis()
    report = build_report(records, kpis, evidence=evidence)

    with tempfile.TemporaryDirectory(prefix="foxxx-kpi-") as tmp:
        out = Path(tmp)
        json_path = out / "report.json"
        md_path = out / "report.md"
        write_report_json(report, json_path)
        write_report_markdown(report, md_path)
        report_data = json.loads(json_path.read_text(encoding="utf-8"))
        md = md_path.read_text(encoding="utf-8")

    water = next(c for c in report.comparisons if c.kpi_id == "water.use.l_per_kg_yield")
    expected_baseline = ((3222.5 / 9.95) + (3098.7 / 9.51)) / 2

    behavioral_checks = {
        "baseline_count_3": report.baseline_count == 3,
        "pilot_count_2": report.pilot_count == 2,
        "all_default_kpis_present": len(report.comparisons) == len(kpis),
        "synthetic_disclaimer_present": "synthetic" in " ".join(report.disclaimers).lower(),
        "report_json_roundtrip": report_data.get("framework_version") == report.framework_version,
        "evidence_section_present": "Evidence Referenced" in md,
        "missing_data_not_fabricated": (
            water.baseline_value is not None
            and abs(water.baseline_value - expected_baseline) < 1e-3
        ),
        "no_eu_funding_claim": "eu funding" not in md.lower(),
        "no_official_approval_claim": "officially approved" not in md.lower(),
        "eu_life_disclaimer_present": "eu life" in md.lower(),
    }

    source_ok = all(source_checks.values())
    behavioral_ok = all(behavioral_checks.values())
    status = "TESTED" if source_ok and behavioral_ok else "FAILED"

    print(json.dumps({
        "status": status,
        "scope": "foxxx009 KPI/evidence/report regression on current MyZubster code using synthetic sample data",
        "contributor": "foxxx009",
        "source_pr": "MyZubster-Ecosystem/myzubster#894",
        "contributor_commit": CONTRIBUTOR_COMMIT,
        "merge_commit": MERGE_COMMIT,
        "repository_head": head,
        "runtime": "python3 standard library + repository modules; no pip/pytest required",
        "source_checks": source_checks,
        "behavioral_checks": behavioral_checks,
        "observed": {
            "baseline_count": report.baseline_count,
            "pilot_count": report.pilot_count,
            "kpi_count": len(report.comparisons),
            "water_baseline_value": water.baseline_value,
            "expected_water_baseline_value": expected_baseline,
        },
        "boundary": (
            "TESTED applies only to independent reproduction of the bounded KPI/evidence/report "
            "behavior using repository synthetic sample data. It does not validate real-world pilot "
            "measurements, scientific impact, environmental claims, EU LIFE participation, funding, "
            "endorsement, certification, or production deployment."
        ),
    }, indent=2, sort_keys=True))

    return 0 if status == "TESTED" else 2


if __name__ == "__main__":
    raise SystemExit(main())
