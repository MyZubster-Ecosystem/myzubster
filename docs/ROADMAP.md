# MyZubster Readiness Roadmap

_Last reviewed: 2026-08-21_

## Current status

MyZubster can currently be presented as an **MVP / architecture demonstration**.

PR #408 (`fix: verify bounty payment before paid state`) has been merged into `main`. It added an explicit payment lifecycle (`PENDING`, `SUBMITTED`, `CONFIRMED`, `FAILED`, `CANCELLED`), adapter/verifier contracts and fail-closed behavior when an independent verifier is not configured.

That merge completes an important payment-state boundary, but it does **not** make the payment stack production-ready. No real wallet/RPC provider was bundled by PR #408, and the remaining P0–P2 requirements below still need to be completed and verified.

## P0 — Before any production payment

### Completed
- [x] Merge PR #408 after review of the payment-state verification boundary.
- [x] Add an explicit payment lifecycle and require transaction evidence before confirmation.
- [x] Keep confirmation fail-closed when an independent verifier is not configured.

### Current focus
- [ ] Re-check current GitHub Actions/workflow state and resolve any active `action_required`, failing or blocked checks. The previous roadmap note is treated as stale until re-verified against current runs.
- [ ] Configure an independent verifier in a non-production integration environment.
- [ ] Add integration tests proving a payment cannot transition from `SUBMITTED` to `CONFIRMED` without independently verified evidence.
- [ ] Add/verify Treasury reservation semantics before submission.
- [ ] Add/verify Treasury release and refund semantics for success, failure and cancellation paths.
- [ ] Add/verify reconciliation between internal payment state, Treasury state and independently verified external settlement state.
- [ ] Validate concurrent reservation/allocation cannot overspend any asset.
- [ ] Add replay/idempotency tests so duplicate verification or callback events cannot confirm or settle twice.
- [ ] Run one end-to-end bounty/payment flow in a controlled environment:
  `bounty/submission → verification → reserve → submit → independent verify → confirm → reconcile`.

### P0 exit criteria
P0 is complete only when the end-to-end flow above passes with both positive and negative-path tests, and no adapter can independently mark a payment as confirmed without verifier evidence.

## P1 — Payment rails
- [ ] Enable real MYZ settlement only with an independently verified provider path.
- [ ] Enable XMR Treasury/payment rail only after real transaction verification is available.
- [ ] Enable token rails only with chain ID + contract address + canonical amount verification.
- [ ] Test timeout, duplicate, retry, cancellation, expiry and reconciliation flows.
- [ ] Document per-rail evidence requirements and failure semantics.

## P2 — Deployment
- [ ] Fix and verify deployment-provider authentication/configuration.
- [ ] Review secrets and environment variables.
- [ ] Verify health checks, monitoring, logs, backups and rollback.
- [ ] Run full CI on the release candidate.
- [ ] Verify production deployment preserves the same fail-closed verifier boundary established in P0.

## P3 — External bounty activation
- [ ] Keep organizational/public-sector bounties in `PROPOSED` until an external agreement or funding source is verified.
- [ ] Move to `APPROVED` only after the responsible organization confirms scope.
- [ ] Move to `FUNDED` only after Treasury funding is actually reserved.
- [ ] Never infer sponsorship from the presence of a GitHub issue.

## Parallel product work

These tracks can progress while P0–P2 are being hardened, but they must not be used to imply production payment readiness:

- Escrow monitoring dashboard;
- frontend integration for verified bounty/payment state;
- publication workflow for announcements with explicit escrow/funding state;
- Photo & Visual Map Phase 1 (GPS markers, thumbnails, filters, city/street pages);
- VPS automation for Drive staging → metadata validation → web media → GeoJSON/index generation.

## Recommended execution order

```text
Roadmap cleanup
      ↓
P0 verifier + Treasury
      ↓
End-to-end bounty/payment test
      ↓
Escrow dashboard + frontend
      ↓
P1 payment rails
      ↓
P2 deployment
      ↓
Visual Map Phase 1 hardening / expansion
```

## Presentation status

The project can be presented as an **MVP / architecture demonstration** today. It should **not** be presented as a fully production-ready multi-asset payment network until P0–P2 are complete and independently verifiable end-to-end evidence is available.