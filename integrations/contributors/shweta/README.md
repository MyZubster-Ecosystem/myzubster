# Shweta verifier bridge

This integration independently reproduces the jurisdiction-capability checkpoint from:

- contributor: `Shweta-singh24`
- repository: `Shweta-singh24/MyZubsterGateway`
- commit: `82461433e0c5bfee9aa369b4a71e9331261cf803`
- upstream PR: `MyZubster-Ecosystem/MyZubsterGateway#1385`
- PR state: closed, not merged

## What the verifier checks

`verifier_check.py` clones the contributor repository at the exact commit and verifies:

1. JavaScript syntax for all five changed files.
2. Explicit allow behavior for known capabilities in `GLOBAL` and `HK`.
3. Explicit deny behavior for all tested capabilities in `CN_MAINLAND`.
4. Fail-closed behavior for unknown jurisdictions.
5. Fail-closed behavior for unknown capabilities.
6. Wiring of Tari and XMR transfer/settlement routes through `jurisdictionGate`.
7. HTTP 403 deny path and the `JURISDICTION_POLICY_DENIED` error code in middleware.

## Run

```bash
python3 integrations/contributors/shweta/verifier_check.py
```

The script prints a JSON evidence record and exits non-zero if any check fails.

## Evidence boundary

A `TESTED` result means only that MyZubster independently reproduced the technical behavior of the exact contributor checkpoint.

It does not mean the PR was merged or deployed, and it is not a legal-compliance or security certification.

## Repository security baseline

The repository-wide npm audit blockers were resolved separately in PR #1510 and merged to `main` at `aa5aa8883a993c99b50e233bea29c5da2f3497f0`. This verifier does not own dependency-security claims; its CI should be evaluated against that shared baseline.
