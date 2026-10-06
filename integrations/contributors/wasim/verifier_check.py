#!/usr/bin/env python3
"""Independent current-main verifier for wasim-builds fail-closed admin-auth contribution.

Contributor source:
- PR #860
- contributor commit d378adbbd9690cfbac081758000bb95d64fe7fb1
- merge commit 9c36d5be450e12345ff9251a40ab4df38839a7fe

TESTED, when produced by this script, applies only to independent reproduction
of the bounded fail-closed admin-auth behavior on the checked-out MyZubster code.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
TEST_FILE = ROOT / "backend/tests/payment.test.js"

EXPECTED_SNIPPETS = {
    "unconfigured_admin_key_503": "fails closed when the admin key is not configured",
    "missing_admin_key_401": "rejects requests without the admin key",
    "incorrect_admin_key_401": "rejects incorrect admin credentials",
    "correct_admin_key_200": "accepts correct configured credentials",
}

CONTRIBUTOR_COMMIT = "d378adbbd9690cfbac081758000bb95d64fe7fb1"
MERGE_COMMIT = "9c36d5be450e12345ff9251a40ab4df38839a7fe"


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
    if shutil.which("node") is None or shutil.which("npm") is None:
        raise SystemExit("FAIL: node and npm are required")

    if not TEST_FILE.exists():
        raise SystemExit(f"FAIL: missing {TEST_FILE}")

    source = TEST_FILE.read_text(encoding="utf-8")
    source_checks = {
        name: snippet in source for name, snippet in EXPECTED_SNIPPETS.items()
    }

    head = run(["git", "rev-parse", "HEAD"]).stdout.strip()

    install = run(["npm", "ci"])
    if install.returncode != 0:
        print(json.dumps({
            "status": "FAILED",
            "stage": "npm_ci",
            "repository_head": head,
            "output_tail": install.stdout[-4000:],
        }, indent=2))
        return 2

    pattern = (
        "fails closed when the admin key is not configured|"
        "rejects requests without the admin key|"
        "rejects incorrect admin credentials|"
        "accepts correct configured credentials"
    )
    test = run([
        "npx", "jest", "backend/tests/payment.test.js",
        "--runInBand", "--testNamePattern", pattern,
    ])

    tests_ok = test.returncode == 0
    source_ok = all(source_checks.values())
    status = "TESTED" if tests_ok and source_ok else "FAILED"

    print(json.dumps({
        "status": status,
        "scope": "wasim-builds fail-closed admin-auth regression on current MyZubster code",
        "contributor": "wasim-builds",
        "source_pr": "MyZubster-Ecosystem/myzubster#860",
        "contributor_commit": CONTRIBUTOR_COMMIT,
        "merge_commit": MERGE_COMMIT,
        "repository_head": head,
        "source_checks": source_checks,
        "jest": {
            "command": "npx jest backend/tests/payment.test.js --runInBand --testNamePattern <four fail-closed auth cases>",
            "passed": tests_ok,
            "output_tail": test.stdout[-5000:],
        },
        "expected_behavior": {
            "admin_key_unconfigured": 503,
            "admin_key_missing": 401,
            "admin_key_incorrect": 401,
            "admin_key_correct": 200,
        },
        "boundary": (
            "TESTED applies only to independent reproduction of the bounded "
            "fail-closed admin-auth behavior. It is not a security certification, "
            "penetration test, production authorization, or payment-settlement validation."
        ),
    }, indent=2, sort_keys=True))

    return 0 if status == "TESTED" else 2


if __name__ == "__main__":
    raise SystemExit(main())
