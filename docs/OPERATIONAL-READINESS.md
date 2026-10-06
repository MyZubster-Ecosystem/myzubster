# MyZubster Operational Readiness

This document defines a conservative, evidence-first path for deciding whether the canonical MyZubster repository is merely documented, testable, deployed, or operationally healthy.

## Readiness ladder

1. **Documented** — architecture and expected behavior are described.
2. **Testable** — local automated tests can reproduce expected behavior.
3. **Buildable** — dependencies install and the declared build path completes.
4. **Deployable** — a deployment provider accepts the current revision.
5. **Reachable** — the deployed endpoint responds over the public network.
6. **Healthy** — explicit health checks report expected application state.
7. **Operationally verified** — repeated checks, logs and human review support the claim that the intended workflow is functioning.

No single badge, deploy preview, issue, PR, merge, HTTP 200 response or internal ledger entry proves the entire system is operational.

## Current canonical checks

The repository already contains tests and CI workflows. `scripts/production-smoke.js` adds a small read-only HTTP smoke layer that can be run locally or by GitHub Actions without credentials.

Default local usage:

```bash
node scripts/production-smoke.js
```

The checker accepts:

```text
SMOKE_BASE_URL=https://www.myzubster.com
SMOKE_PATHS=/
SMOKE_TIMEOUT_MS=15000
```

Use only endpoints that are safe to query with GET. Do not put credentials, tokens, wallet material, private endpoints or personal data into workflow variables or committed configuration.

## Verified public target decision — 2026-08-23

The public web surface resolves at `https://www.myzubster.com`. The apex domain `https://myzubster.com` is also publicly reachable but redirects toward the `www` host in observed requests. The recommended production smoke target is therefore:

```text
https://www.myzubster.com
```

The conservative default `SMOKE_PATHS` is:

```text
/
```

Backend-specific paths such as `/health` or `/api/dashboard` should only be added after their actual deployment target is independently confirmed.

## Production interpretation

A successful `/` check proves only that the configured public endpoint is reachable and returns a successful HTTP response.

If a verified backend target exposes `/health`, the checker can additionally validate `success=true` and `status=ok`. If a verified backend target exposes `/api/dashboard`, it can validate the documented dashboard contract. These paths remain opt-in so a frontend-only deployment is not incorrectly marked unhealthy.

## Evidence to retain for a release

For a materially important release, retain links to the exact commit, CI result, deployment result and smoke run. If a real external settlement is part of a release claim, retain its independent settlement evidence separately; application state or an internal MYZ reward record is not sufficient.

## Failure policy

A failed smoke check means the configured endpoint/path did not satisfy the minimal check at that time. It does not automatically identify the root cause. Investigate deployment provider status, DNS/TLS, routing, application logs and upstream dependencies before making a production claim.

## Human gate

Production readiness remains a human decision. Automation should surface reproducible evidence and failures, not promote experimental components or roadmap items into production status automatically.
