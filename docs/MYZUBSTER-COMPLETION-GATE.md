# MyZubster Completion Gate

Purpose: provide one canonical, evidence-first checklist for deciding when the current MyZubster public experience can be considered review-ready, merged, deployed, and device-validated.

> `REVIEW-READY != MERGED != DEPLOYED != DEVICE-VERIFIED != ADOPTED`

No item may be promoted to the next state without direct evidence for that state.

## Gate A — Google TV / Android TV

Status owner: PR #641

- [x] Native Android TV scaffold exists.
- [x] `LEANBACK_LAUNCHER` entry point exists.
- [x] Remote/D-pad-oriented TV web surface exists at `public/tv.html`.
- [x] Security Audit passes on the current Android TV branch.
- [x] Repository CI / test / lint passes on the current Android TV branch.
- [x] Android TV debug APK compiles successfully in GitHub Actions.
- [x] APK workflow artifact exists (`myzubster-tv-debug-apk`).
- [x] APK artifact archived to Drive as `MYZUBSTER-TV-DEBUG-APK-001.zip`.
- [ ] Install APK on a real Google TV / Android TV device.
- [ ] Verify launch from TV Apps screen.
- [ ] Verify D-pad focus movement and Enter activation.
- [ ] Verify Back-button behavior.
- [ ] Verify `/tv.html` loads in WebView over HTTPS.
- [ ] Verify Chronicle Universe opens from the TV surface.
- [ ] Verify Chronicle opens from the TV surface.
- [ ] Verify readability from normal TV viewing distance.
- [ ] Capture device screenshots / photos as QA evidence.
- [ ] Record device model + Android/Google TV version without exposing unnecessary personal data.
- [ ] Only after real-device QA: label compatibility `DEVICE_VERIFIED`.

## Gate B — Clarity-first public home

Status owner: PR #640 / Issue #639

- [x] External UX feedback recorded and attributed to the public contributor handle only.
- [x] First-level narrative reduced to: `OBSERVE -> REPORT -> ACT -> VERIFY -> IMPACT`.
- [x] First visit no longer requires understanding internal ecosystem vocabulary first.
- [x] Wider Zorgax / LIFE / robotics / metaverse layers moved deeper in the experience.
- [x] Real evidence and narrative illustration are explicitly separated in copy.
- [ ] Vercel preview reaches `READY` for the latest PR head.
- [ ] Desktop visual QA.
- [ ] Mobile visual QA at narrow width.
- [ ] Keyboard accessibility pass.
- [ ] Verify evidence image provenance and wording.
- [ ] Verify no text implies partnership, payment, adoption, or physical proof beyond available evidence.
- [ ] Mark ready for review only after the above checks.

## Gate C — Chronicle Universe

Status owner: PR #638

- [x] Interactive Chronicle Universe page exists.
- [x] GitHub visual-source concept and provenance links are implemented.
- [x] Story Mode / navigation logic exists.
- [x] Documentation visual vs narrative illustration vs evidence-reference boundary is represented.
- [ ] Confirm current deployment route serves Chronicle Universe rather than frontend fallback.
- [ ] Confirm all intended public GitHub assets load in the deployed browser.
- [ ] Verify browser behavior under GitHub API/rate-limit failure and fallback states.
- [ ] Mobile QA.
- [ ] Accessibility / keyboard QA.
- [ ] Review any `CLASSIFICATION_REVIEW` assets manually.
- [ ] Mark ready for review only after rendered QA.

## Gate D — Contributor PR #634 — workflow comic

Contributor: `@Aming9303`

- [x] Submission contains cover, optimized web edition, high-resolution edition, and provenance README.
- [x] AI-assisted generation workflow and rights/safety notes are documented.
- [x] MYZ is described as internal accounting.
- [x] External settlement remains explicitly separate.
- [x] No wallet / transaction / external-payment claim in the documented submission.
- [x] Maintainer review completed at architecture/provenance level.
- [ ] Human visual inspection of all three raster deliverables.
- [ ] Confirm seven-panel sequence and labels are legible on mobile.
- [ ] Confirm diagrams do not visually imply that experimental components are already deployed.
- [ ] Confirm generated artwork is not presented as real-world evidence.
- [ ] If visual QA passes, submit `APPROVE` review.
- [ ] Merge decision remains human.
- [ ] Reward/accounting decision remains separate from external settlement.

## Gate E — Contributor PR #635 — Proof-of-Contribution policy

Contributor: `@Aming9303`

- [x] Maintainer technical review completed.
- [x] High-risk verifier quorum requirement identified and strengthened.
- [x] Maintainer approval for high-risk cases made structurally required.
- [x] `legal_policy` made structurally required.
- [x] Draft 2020-12 / AJV validation coverage added.
- [x] Settlement boundary explicitly documented.
- [ ] Fix unintended `package-lock.json` root engine drift (`>=18.0.0` -> `24.x`) so lockfile and manifest stay consistent.
- [ ] Re-run focused schema tests after fix.
- [ ] Re-run complete repository test suite after fix.
- [ ] `git diff --check` after fix.
- [ ] Re-review updated head.
- [ ] Approve only if requested changes are actually resolved.
- [ ] Merge decision remains human.

## Gate F — Release / merge discipline

For every PR above:

1. Confirm the exact head SHA being reviewed.
2. Confirm required CI checks correspond to that head or its GitHub PR merge ref.
3. Do not use a previous green run as evidence for a changed head.
4. Resolve substantive review requests before approval.
5. Move Draft -> Ready only after its explicit QA gate is complete.
6. Merge one high-impact PR at a time when practical.
7. After merge, verify CI and deployment again against `main`.
8. Do not equate merge with deployment.
9. Do not equate deployment with real-world adoption.
10. Do not equate MYZ accounting with external payment.

## Gate G — Evidence and archive

- [x] Canonical Drive archive folder is `MyZubster Zorgax Chronicle` (`1eZEWtzaD6iDUFFsUpcp9Ni0nGww8V8vT`).
- [x] TV debug artifact archive recorded.
- [x] External UX-feedback screenshots archived as evidence of feedback received.
- [x] Narrative system visual archived separately from feedback evidence.
- [ ] Add real-device TV QA screenshots after testing.
- [ ] Record provenance for any new GitHub-bound visual before merge.
- [ ] Never classify AI-generated artwork as physical-world evidence.
- [ ] Do not change Drive permissions automatically.

## Completion levels

### LEVEL 1 — CODE COMPLETE
All required implementation is present in PRs and local/static validation has passed where applicable.

### LEVEL 2 — REVIEW READY
Human-rendering / device / accessibility gates required by the PR are complete and review findings are resolved.

### LEVEL 3 — MERGED
The reviewed PR has been merged into the canonical branch.

### LEVEL 4 — DEPLOYED / RELEASED
The merged code is available through its intended deployment or release artifact and the deployment itself is verified.

### LEVEL 5 — REAL-WORLD VERIFIED
For surfaces involving physical devices or real-world events, direct evidence confirms the intended behavior on an actual device or the claimed event in the physical world.

### LEVEL 6 — ADOPTED
Independent users or organizations actually use the capability. This state requires independent evidence and must not be inferred from repository activity, a deployment, an external mention, or a demo.

## Current highest-priority human actions

1. Install and test the PR #641 APK on an actual Google TV / Android TV device.
2. Perform rendered mobile/desktop QA on PR #640.
3. Perform rendered browser QA on PR #638.
4. Inspect the PR #634 raster assets visually.
5. Wait for / review the requested fix on PR #635.

This document is a coordination checklist, not proof that unchecked gates have passed.