# Stripe Connect test rollout gate

Status: **TEST MODE ONLY — do not enable live payouts from this document.**

## Current state

MyZubster Seller onboarding is free-first (`SELLER_FREE`). A seller can publish without a card or subscription. Payment onboarding is requested only when a paid transaction or payout is attempted. The target platform commission is 2% on eligible paid transactions; FREE/BARTER activity has no commission.

The current Seller model stores legacy Stripe customer/subscription/checkout fields, but it does not yet store a Stripe Connect account or Connect onboarding state. The current Seller webhook primarily handles legacy subscription/invoice events. Therefore Connect must be implemented and verified in Stripe test mode before any live payout activation.

## Required implementation

1. Extend `SellerMembership` with Connect state, at minimum:
   - `stripeConnectAccountId`
   - `stripeConnectDetailsSubmitted`
   - `stripeConnectChargesEnabled`
   - `stripeConnectPayoutsEnabled`
   - `stripeConnectOnboardedAt`

2. Add an authenticated Connect onboarding endpoint that:
   - requires an active `SELLER_FREE` seller;
   - creates or reuses one Stripe Connect account;
   - creates an Account Link using configured return/refresh URLs;
   - never exposes the Stripe secret key to the client.

3. Add an authenticated Connect status endpoint that retrieves the account from Stripe and synchronizes the local readiness flags.

4. For a real paid Marketplace transaction, create the Stripe payment using the selected Connect charge model and calculate the platform fee from the existing `calculatePlatformCommission()` policy. The expected platform commission is 2% of the eligible gross paid amount. FREE/BARTER must bypass Stripe and produce zero platform commission.

5. Extend webhook handling for the Connect/payment events required by the chosen charge model. Webhooks must be signature verified and idempotent. At minimum synchronize Connect account readiness and successful/failed Marketplace payment state.

6. Add regression/integration tests covering:
   - seller remains free before earnings;
   - Connect onboarding is requested only for paid transaction/payout readiness;
   - repeated onboarding reuses the seller Connect account;
   - 2% fee calculation is applied once;
   - FREE/BARTER has no fee;
   - webhook replay does not duplicate a transaction or commission;
   - payout is not treated as ready until Stripe reports the required account capabilities.

## Environment gate

Test/preview must use Stripe test credentials and a test webhook secret. Return/refresh URLs must point to the appropriate preview/test frontend. No live Connect account creation or live payout should be performed while validating this plan.

## Acceptance test

Use a Stripe test seller and a Stripe test buyer. Complete Connect onboarding, create one paid Marketplace transaction, confirm the expected 2% platform fee, confirm seller-side funds/readiness in Stripe test mode, replay the webhook to verify idempotency, then verify a FREE/BARTER listing does not invoke payment onboarding or commission.

Only after all tests pass and the production account/compliance configuration is explicitly reviewed should live Connect/payout configuration be considered.
