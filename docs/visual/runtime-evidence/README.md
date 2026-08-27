# Visual #014 — Runtime / Deployment Evidence

This view prevents source/configuration evidence from being mistaken for live runtime evidence.

## Evidence ladder

`SOURCE EXISTS → CI CHECKED → DEPLOY ATTEMPTED → RUNTIME VERIFIED → CONTINUOUSLY VERIFIED`

Each transition requires stronger evidence than the previous one.

## Current public Gateway example

`MyZubsterGateway/.github/workflows/deploy-production.yml` publicly defines production validation logic including tests, build, a public Zargox API check, optional hosted Gateway health checks, optional VPS deployment, post-deploy verification and rollback.

That verifies the workflow/configuration exists. It does **not** by itself verify the latest workflow result or current runtime health.

## Guardrails

- workflow file ≠ successful workflow run;
- successful CI ≠ deployed production;
- deployment attempt ≠ healthy runtime;
- one health response ≠ continuous availability;
- provider URL ≠ verified external settlement;
- runtime health ≠ payment finality.

Source: https://github.com/MyZubster-Ecosystem/MyZubsterGateway/blob/main/.github/workflows/deploy-production.yml
