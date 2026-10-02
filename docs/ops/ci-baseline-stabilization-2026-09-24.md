# CI baseline stabilization — 2026-09-24

This branch is intentionally separate from PR #1383 (Zorgax monetization + ETH/MetaMask).

## Current baseline failures observed from CI #1560

The following suites remain red while the payment/monetization suites touched by #1383 are green:

- tests/paymentDashboard.test.js
- backend/src/routes/zorgax-party.acceptance.test.js
- tests/zorgax.test.js
- tests/zorgaxAssistantService.test.js
- tests/zorgaxAccessService.test.js
- tests/zorgaxAIUsageService.test.js
- tests/zorgaxUnitEconomics.test.js
- test/zorgaxSocialLoginUi.test.js
- test/zorgaxStripeCardCheckoutUi.test.js
- test/zorgaxCulturalApi.test.js
- tests/kefirHandDelivery.node.test.js
- test/metaverseObservability.test.js
- tests/kefirMarketplaceContract.test.js
- backend/src/services/realtimeGateway.test.js

## Scope

- restore deterministic baseline CI without weakening assertions;
- fix regressions in the owning modules rather than muting tests;
- preserve security fail-closed behavior;
- keep payment/ETH work out of this branch;
- make small grouped commits by subsystem.

## Order of work

1. deterministic/string-contract tests;
2. service behavior regressions;
3. timeout/open-handle failures;
4. re-run full CI;
5. only then re-run Continuous Evidence Gate.

This document is the scope anchor for the dedicated baseline-CI repair PR.
