#!/usr/bin/env python3
"""Independent current-main verifier for Aming9303 signed payment webhooks.

Canonical contribution:
- PR #891
- contributor commit cee464b6a69e621442b30a57d2d56933988827e2
- merge commit be78e0cf9081c3346aa0c61e022acd297d745619

TESTED, when emitted by this script, applies only to the bounded signed-webhook
regression checks executed against the checked-out MyZubster code.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
TEST_FILE = ROOT / "tests/paymentWebhooks.test.js"
SERVICE_FILE = ROOT / "backend/src/services/paymentWebhooks.js"

CONTRIBUTOR_COMMIT = "cee464b6a69e621442b30a57d2d56933988827e2"
MERGE_COMMIT = "be78e0cf9081c3346aa0c61e022acd297d745619"

TARGET_TESTS = [
    "sends a signed payment confirmation event",
    "retries a network failure without changing the delivery id",
    "refuses unsigned configured webhook endpoints",
    "receiver verifies the signature, timestamp, and delivery id exactly once",
    "receiver rejects stale signed events before claiming the delivery id",
]

REQUIRED_SOURCE_SNIPPETS = {
    "hmac_sha256": "createHmac('sha256'",
    "constant_time_compare": "timingSafeEqual",
    "delivery_id_binding": "Webhook delivery ID does not match the signed event",
    "timestamp_window": "Webhook event is outside the accepted timestamp window",
    "replay_rejection": "Webhook delivery has already been processed",
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
    if shutil.which("node") is None or shutil.which("npm") is None:
        raise SystemExit("FAIL: node and npm are required")

    if not TEST_FILE.exists() or not SERVICE_FILE.exists():
        raise SystemExit("FAIL: payment webhook source/test files are missing")

    service = SERVICE_FILE.read_text(encoding="utf-8")
    source_checks = {k: v in service for k, v in REQUIRED_SOURCE_SNIPPETS.items()}

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

    pattern = "|".join(TARGET_TESTS)
    test = run([
        "npx", "jest", "tests/paymentWebhooks.test.js",
        "--runInBand", "--testNamePattern", pattern,
    ])

    tests_ok = test.returncode == 0
    source_ok = all(source_checks.values())
    status = "TESTED" if tests_ok and source_ok else "FAILED"

    print(json.dumps({
        "status": status,
        "scope": "Aming9303 signed payment-webhook regression on current MyZubster code",
        "contributor": "Aming9303",
        "source_pr": "MyZubster-Ecosystem/myzubster#891",
        "contributor_commit": CONTRIBUTOR_COMMIT,
        "merge_commit": MERGE_COMMIT,
        "repository_head": head,
        "source_checks": source_checks,
        "targeted_tests": TARGET_TESTS,
        "jest": {
            "command": "npx jest tests/paymentWebhooks.test.js --runInBand --testNamePattern <five signed-webhook cases>",
            "passed": tests_ok,
            "output_tail": test.stdout[-5000:],
        },
        "expected_behavior": {
            "signed_event": "HMAC-SHA256 header present over exact JSON body",
            "retry": "transient failure retries without changing delivery ID",
            "unsigned_endpoint": "configured webhook without secret is rejected",
            "replay": "second processing of same delivery ID is rejected",
            "stale_event": "event outside timestamp window is rejected before replay claim",
        },
        "boundary": (
            "TESTED applies only to independent reproduction of the bounded signed-webhook "
            "behavior above. It does not validate external receiver infrastructure, "
            "payment settlement, wallet security, production delivery guarantees, or "
            "broader application security."
        ),
    }, indent=2, sort_keys=True))

    return 0 if status == "TESTED" else 2


if __name__ == "__main__":
    raise SystemExit(main())
