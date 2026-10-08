#!/usr/bin/env python3
"""Live interoperability check for the Open Period Care contributor bridge."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MODULE = HERE / "open_period_care_bridge.py"

spec = importlib.util.spec_from_file_location("open_period_care_bridge", MODULE)
if spec is None or spec.loader is None:
    raise RuntimeError(f"Unable to load bridge module from {MODULE}")

bridge = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = bridge
spec.loader.exec_module(bridge)


def main() -> int:
    records = bridge.build_records()

    if len(records) != 3:
        raise SystemExit(f"FAIL: expected 3 records, got {len(records)}")

    expected_paths = {"README.md", "evidence-matrix.md", "knowledge-cards.md"}
    actual_paths = {record.source_path for record in records}
    if actual_paths != expected_paths:
        raise SystemExit(f"FAIL: unexpected source paths: {sorted(actual_paths)}")

    for record in records:
        if record.contributor != "khongten124":
            raise SystemExit(f"FAIL: wrong contributor in {record.source_path}")
        if record.source_commit != "17cf7ca0a941d10e184771e574683785c1dbc8bf":
            raise SystemExit(f"FAIL: wrong source commit in {record.source_path}")
        if len(record.source_sha256) != 64:
            raise SystemExit(f"FAIL: invalid SHA-256 in {record.source_path}")
        if record.bridge_status != "READ_ONLY_NORMALIZED":
            raise SystemExit(f"FAIL: invalid bridge status in {record.source_path}")

    summary = {
        "status": "TESTED",
        "scope": "Open Period Care public evidence fetch + normalization",
        "contributor": "khongten124",
        "project": records[0].project,
        "source_repo": records[0].source_repo,
        "source_branch": records[0].source_branch,
        "source_commit": records[0].source_commit,
        "records": [
            {
                "path": r.source_path,
                "sha256": r.source_sha256,
                "evidence_states": r.evidence_states,
                "bridge_status": r.bridge_status,
            }
            for r in records
        ],
        "boundary": (
            "TESTED applies only to bridge fetch/normalization behavior; "
            "underlying scientific/product claims retain their source evidence states."
        ),
    }

    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
