# MyZubster Readiness Roadmap

## P0 — Before any production payment
- [ ] Close PR #408 after CI/security checks are green and the requested boundary fixes are reviewed.
- [ ] Resolve the current GitHub Actions `action_required` state on the payment PR/workflows.
- [ ] Complete independent verifier configuration and integration tests.
- [ ] Ensure no payment adapter can submit without an independent verifier.
- [ ] Add/verify Treasury reservation, release/refund and reconciliation semantics.
- [ ] Validate concurrent allocation cannot overspend any asset.

## P1 — Payment rails
- [ ] Enable real MYZ settlement only with an independently verified provider path.
- [ ] Enable XMR Treasury/payment rail only after real transaction verification is available.
- [ ] Enable token rails only with chain ID + contract address + canonical amount verification.
- [ ] Test timeout, duplicate, retry, cancellation, expiry and reconciliation flows.

## P2 — Deployment
- [ ] Fix and verify deployment-provider authentication/configuration.
- [ ] Review secrets and environment variables.
- [ ] Verify health checks, monitoring, logs, backups and rollback.
- [ ] Run full CI on the release candidate.

## P3 — External bounty activation
- [ ] Keep organizational/public-sector bounties in `PROPOSED` until an external agreement or funding source is verified.
- [ ] Move to `APPROVED` only after the responsible organization confirms scope.
- [ ] Move to `FUNDED` only after Treasury funding is actually reserved.
- [ ] Never infer sponsorship from the presence of a GitHub issue.

## Presentation status

The project can be presented as an **MVP / architecture demonstration** today. It should not be presented as a fully production-ready multi-asset payment network until P0–P2 are complete.