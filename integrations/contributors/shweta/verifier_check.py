#!/usr/bin/env python3
"""Independent verifier for Shweta-singh24 MyZubsterGateway checkpoint.

Tests commit 82461433e0c5bfee9aa369b4a71e9331261cf803 from the contributor fork.
The checkpoint is a closed, unmerged PR snapshot; TESTED here means independent
technical reproduction of the policy behavior, not merge/deployment/certification.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from pathlib import Path

REPO = "https://github.com/Shweta-singh24/MyZubsterGateway.git"
COMMIT = "82461433e0c5bfee9aa369b4a71e9331261cf803"

FILES = [
    "middleware/jurisdictionGate.js",
    "routes/benzinaXmr.js",
    "routes/tari.js",
    "services/jurisdiction.constants.js",
    "services/jurisdiction.service.js",
]


def run(cmd: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        cmd,
        cwd=cwd,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )


def main() -> int:
    if shutil.which("git") is None:
        raise SystemExit("FAIL: git is required")
    if shutil.which("node") is None:
        raise SystemExit("FAIL: node is required")

    with tempfile.TemporaryDirectory(prefix="myzubster-shweta-") as tmp:
        root = Path(tmp) / "gateway"

        run(["git", "clone", "--no-checkout", REPO, str(root)])
        run(["git", "checkout", "--detach", COMMIT], cwd=root)

        actual_commit = run(["git", "rev-parse", "HEAD"], cwd=root).stdout.strip()
        if actual_commit != COMMIT:
            raise SystemExit(f"FAIL: expected {COMMIT}, got {actual_commit}")

        syntax = []
        for rel in FILES:
            run(["node", "--check", rel], cwd=root)
            syntax.append({"path": rel, "status": "PASS"})

        policy_test = r"""
const { Jurisdiction, Capability } = require('./services/jurisdiction.constants');
const { isCapabilityAllowed } = require('./services/jurisdiction.service');

const caps = [
  Capability.WALLET_TRANSFER,
  Capability.EXCHANGE_FLOW,
  Capability.EXTERNAL_SETTLEMENT,
  Capability.PROVIDER_CRYPTO,
];

const results = [];
function expect(name, actual, expected) {
  results.push({ name, actual, expected, passed: actual === expected });
  if (actual !== expected) {
    console.error(JSON.stringify(results, null, 2));
    process.exit(2);
  }
}

for (const cap of caps) {
  expect(`GLOBAL:${cap}`, isCapabilityAllowed(Jurisdiction.GLOBAL, cap), true);
  expect(`HK:${cap}`, isCapabilityAllowed(Jurisdiction.HK, cap), true);
  expect(`CN_MAINLAND:${cap}`, isCapabilityAllowed(Jurisdiction.CN_MAINLAND, cap), false);
}

expect('UNKNOWN_JURISDICTION', isCapabilityAllowed('UNKNOWN', Capability.WALLET_TRANSFER), false);
expect('UNKNOWN_CAPABILITY', isCapabilityAllowed(Jurisdiction.GLOBAL, 'unknown_capability'), false);

console.log(JSON.stringify(results));
"""
        policy = json.loads(run(["node", "-e", policy_test], cwd=root).stdout)

        middleware = (root / "middleware/jurisdictionGate.js").read_text(encoding="utf-8")
        tari = (root / "routes/tari.js").read_text(encoding="utf-8")
        xmr = (root / "routes/benzinaXmr.js").read_text(encoding="utf-8")

        wiring_checks = {
            "middleware_returns_403_on_deny": "res.status(403)" in middleware,
            "middleware_error_code_present": "JURISDICTION_POLICY_DENIED" in middleware,
            "tari_wallet_transfer_gate": "jurisdictionGate(Capability.WALLET_TRANSFER)" in tari,
            "tari_external_settlement_gate": "jurisdictionGate(Capability.EXTERNAL_SETTLEMENT)" in tari,
            "xmr_wallet_transfer_gate": "jurisdictionGate(Capability.WALLET_TRANSFER)" in xmr,
            "xmr_external_settlement_gate": "jurisdictionGate(Capability.EXTERNAL_SETTLEMENT)" in xmr,
        }

        wiring_ok = all(wiring_checks.values())
        policy_ok = all(item["passed"] for item in policy)
        status = "TESTED" if wiring_ok and policy_ok else "FAILED"

        print(json.dumps({
            "status": status,
            "scope": "Shweta jurisdiction capability verifier checkpoint",
            "contributor": "Shweta-singh24",
            "repository": REPO,
            "source_commit": actual_commit,
            "source_pr": "MyZubster-Ecosystem/MyZubsterGateway#1385",
            "source_pr_state": "CLOSED_UNMERGED",
            "syntax_checks": syntax,
            "policy_checks": policy,
            "wiring_checks": wiring_checks,
            "boundary": (
                "TESTED applies only to independent technical reproduction of this "
                "closed, unmerged checkpoint. It does not establish upstream merge, "
                "production deployment, legal compliance, or security certification."
            ),
        }, ensure_ascii=False, indent=2, sort_keys=True))

        return 0 if status == "TESTED" else 2


if __name__ == "__main__":
    raise SystemExit(main())
