#!/usr/bin/env python3
"""Independent current-main verifier for foxxx009 KPI/evidence framework.

Canonical contribution:
- PR #894
- contributor commit 70cb32c6500525df4056859525fe215b95188a02
- merge commit 50f70aab6dc9a909f65b81cb70d932706143afec

TESTED, when emitted by this script, applies only to independent reproduction
of the bounded KPI/evidence/report behavior on the checked-out MyZubster code.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CONTRIBUTOR_COMMIT = "70cb32c6500525df4056859525fe215b95188a02"
MERGE_COMMIT = "50f70aab6dc9a909f65b81cb70d932706143afec"

TARGET_TESTS = [
    "test_report_includes_disclaimers",
    "test_report_distinguishes_baseline_and_pilot",
    "test_report_writes_json_and_markdown",
    "test_report_includes_no_fabricated_claims",
    "test_report_flags_missing_data_not_fabricates",
]

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
    if shutil.which("python3") is None:
        raise SystemExit("FAIL: python3 is required")

    report_file = ROOT / "myzpkpi/report.py"
    if not report_file.exists():
        raise SystemExit("FAIL: myzpkpi/report.py is missing")

    source = report_file.read_text(encoding="utf-8")
    source_checks = {k: v in source for k, v in REQUIRED_SOURCE_SNIPPETS.items()}
    head = run(["git", "rev-parse", "HEAD"]).stdout.strip()

    install = run(["python3", "-m", "pip", "install", "-q", "pytest"])
    if install.returncode != 0:
        print(json.dumps({
            "status": "FAILED",
            "stage": "pytest_install",
            "repository_head": head,
            "output_tail": install.stdout[-4000:],
        }, indent=2))
        return 2

    expr = " or ".join(TARGET_TESTS)
    test = run([
        "python3", "-m", "pytest", "-q",
        "tests/test_report.py",
        "-k", expr,
    ])

    with tempfile.TemporaryDirectory(prefix="foxxx-kpi-") as tmp:
        out = Path(tmp)
        cli = run([
            "python3", "-m", "myzpkpi",
            "--records", "data/samples/records.csv",
            "--evidence", "data/samples/evidence.json",
            "--catalog", "data/config/kpi_catalog.json",
            "--out-dir", str(out),
        ])
        report_json = out / "report.json"
        report_md = out / "report.md"
        cli_ok = cli.returncode == 0 and report_json.exists() and report_md.exists()
        report_data = json.loads(report_json.read_text(encoding="utf-8")) if report_json.exists() else {}
        md = report_md.read_text(encoding="utf-8") if report_md.exists() else ""

    semantic_checks = {
        "baseline_count_3": report_data.get("baseline_count") == 3,
        "pilot_count_2": report_data.get("pilot_count") == 2,
        "synthetic_disclaimer_present": "synthetic" in " ".join(report_data.get("disclaimers", [])).lower(),
        "no_eu_funding_claim": "eu funding" not in md.lower(),
        "no_official_approval_claim": "officially approved" not in md.lower(),
        "evidence_section_present": "Evidence Referenced" in md,
    }

    tests_ok = test.returncode == 0
    source_ok = all(source_checks.values())
    semantic_ok = all(semantic_checks.values())
    status = "TESTED" if tests_ok and source_ok and cli_ok and semantic_ok else "FAILED"

    print(json.dumps({
        "status": status,
        "scope": "foxxx009 KPI/evidence/report regression on current MyZubster code using synthetic sample data",
        "contributor": "foxxx009",
        "source_pr": "MyZubster-Ecosystem/myzubster#894",
        "contributor_commit": CONTRIBUTOR_COMMIT,
        "merge_commit": MERGE_COMMIT,
        "repository_head": head,
        "source_checks": source_checks,
        "semantic_checks": semantic_checks,
        "pytest": {
            "passed": tests_ok,
            "targeted_tests": TARGET_TESTS,
            "output_tail": test.stdout[-5000:],
        },
        "cli_report_generation": {
            "passed": cli_ok,
            "output_tail": cli.stdout[-3000:],
        },
        "boundary": (
            "TESTED applies only to independent reproduction of the bounded KPI/evidence/report "
            "behavior using the repository's synthetic sample data. It does not validate real-world "
            "pilot measurements, scientific impact, environmental claims, EU LIFE participation, "
            "funding, endorsement, certification, or production deployment."
        ),
    }, indent=2, sort_keys=True))

    return 0 if status == "TESTED" else 2


if __name__ == "__main__":
    raise SystemExit(main())
