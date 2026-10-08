# Shweta MyZubsterGateway — independent VPS security checkpoint

## Scope

This runbook independently reruns the existing verifier for the public contributor checkpoint:

- contributor: `Shweta-singh24`
- repository: `Shweta-singh24/MyZubsterGateway`
- commit: `82461433e0c5bfee9aa369b4a71e9331261cf803`
- upstream PR: `MyZubster-Ecosystem/MyZubsterGateway#1385`
- upstream PR state: closed, not merged

A PASS means only that the bounded policy/wiring behavior is independently reproduced at that exact commit. It is not a security audit, legal-compliance certification, production deployment claim, or upstream merge claim.

## Safety

Run only from the clean verification checkout:

```bash
cd /opt/myzubster/core/myzubster
```

Do not run from `/root/myzubster`. Do not restart services, modify firewall rules, expose ports, or print secrets.

## Preflight

```bash
git rev-parse HEAD
python3 --version
node --version
git --version
```

## Run

```bash
cd /opt/myzubster/core/myzubster
python3 integrations/contributors/shweta/verifier_check.py | tee /tmp/shweta-gateway-verifier.json
```

Expected bounded result:

```text
"status": "TESTED"
"source_commit": "82461433e0c5bfee9aa369b4a71e9331261cf803"
"source_pr_state": "CLOSED_UNMERGED"
```

The output should also show all syntax checks as PASS, all deterministic policy checks as passed, and every wiring check as true.

## Cleanup

The verifier clones the contributor fork into a Python temporary directory and removes it automatically when the process exits.

The optional `/tmp/shweta-gateway-verifier.json` output contains only public/sanitized verifier evidence and may be removed after recording the checkpoint:

```bash
rm -f /tmp/shweta-gateway-verifier.json
```
