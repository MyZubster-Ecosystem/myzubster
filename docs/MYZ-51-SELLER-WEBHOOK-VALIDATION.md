# MYZ-51 — Seller webhook and entitlement validation

Validation snapshot: 2026-09-07.

## Verified

- Production Seller webhook accepted a POST with HTTP 200 in Vercel runtime logs.
- No runtime error cluster was found for `/api/marketplace/seller/webhook` in the checked production window.
- Stripe webhook signatures are verified before processing; invalid signatures return HTTP 400.
- `active` and `trialing` subscriptions map to `ACTIVE` Seller membership.
- `canceled` maps to `CANCELLED`; `past_due`, `unpaid`, and `paused` map to `SUSPENDED`; `incomplete_expired` maps to `EXPIRED`.
- `invoice.payment_failed` suspends the Seller membership.
- Seller-only listing creation requires an `ACTIVE`, non-expired Seller membership.
- Stripe-backed cancellation requests `cancel_at_period_end=true` and retains the membership expiry boundary.

## Remaining hardening before MYZ-51 is Done

1. Add explicit duplicate Stripe event idempotency. `stripeLastEventId` is recorded, but processing does not currently short-circuit a previously processed event ID.
2. Protect against out-of-order events so an older subscription event cannot overwrite a newer entitlement state.
3. Add automated tests for:
   - duplicate event delivery;
   - out-of-order subscription events;
   - `customer.subscription.deleted` / cancellation downgrade;
   - `invoice.payment_failed` suspension;
   - failed/incomplete payment never granting Seller access.
4. Re-run production-safe verification after hardening and record non-sensitive event/log evidence.

## Completion rule

Do not mark MYZ-51 complete, and do not use it to unblock MYZ-52, until the remaining lifecycle/idempotency checks are implemented and verified.
