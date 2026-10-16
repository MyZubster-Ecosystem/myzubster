# MYZ-1615 — Seller funnel evidence contract (draft)

Status: **PROPOSED — not implemented or production-verified**. This document defines a minimal event contract for a PR review. It is not proof that any seller has published or sold anything.

## Observed baseline (2026-10-16)
- PostHog taxonomy includes `journey_marketplace_open`, `journey_login_authenticated`, and `profile_onboarding_completed`; it does not currently expose a dedicated server-side successful listing publication event.
- `src/routes/listingRoutes.js` has `POST /create`, `GET /mine`, `GET /:id`, `PATCH /:id`, and `PATCH /:id/status`. Check the actual router mount before writing test URLs.
- Seller activation notifications and successful login are **not** evidence of a publicly visible listing.
- PostHog has no connected marketplace warehouse table at the time of inspection.

## Event definitions (proposed; server-side only)
| Event | Trigger after confirmed backend state | Do not trigger for |
| --- | --- | --- |
| `seller_activated` | A previously inactive seller becomes active after successful persistent write | pageview, already-active seller, failed request |
| `marketplace_listing_published` | Listing transitions to publicly readable `active` after persisted create or status change | draft, failed write, edit without activation, retry |
| `marketplace_inquiry_created` | Persisted inbound inquiry referencing a listing, if implemented | contact-button click, email draft |
| `marketplace_exchange_completed` | Persisted exchange completion backed by a real workflow, if implemented | checkout visit, unpaid invoice, self-reported click |

**Important:** Do not implement inquiry/completion events until the corresponding state machine exists and is testable.

## Privacy-safe event properties
Use pseudonymous stable `distinct_id` derived from the authenticated user ID and consistent across steps; never email, username, IP, wallet or free text. Allowed event properties: `schema_version: 1`, `environment`, `seller_plan`, `listing_category` (enumerated), `currency` (enumerated), `source` (enumerated), and an opaque `listing_id` where needed. No title, description, address, contact information, token, raw request body, or secrets.

## Deduplication and correctness
- Publish only **after** a successful DB write and confirmation of `active` public visibility.
- Retry of same operation must not create a second conversion event; define a durable idempotency key from the actual state transition, not a transient request ID.
- `paused -> active` may be a reactivation but must not count as a new seller's first published listing. Define separate reactivation event if needed.
- PostHog capture failures must not block marketplace transactions; log only non-sensitive operational error metadata.
- Distinguish staging and production in every query.
- Cross-check aggregate published listing counts with read-only database counts. Events are not a source of truth for inventory.

## Acceptance tests
1. Synthetic Seller-Free account in staging: successful activation once, successful `POST /create`, `GET /:id` confirms public visibility, one publication event.
2. Repeat create request, duplicate delivery, or status toggle: no false first-publication conversions.
3. 401 unauthorized, 402/409 seller-plan restriction, validation 400 and DB 500: zero publication events.
4. Edit via existing `PATCH /:id` updates fields without generating a new publication event.
5. Test that captured properties contain no PII, free text, wallet, credentials or production secrets.
6. Document absent inquiry/exchange steps as **not instrumented**, not zero conversions.
7. Reviewer validates CI output and redacted staging logs before any merge/deploy.

## Next work
Implement a small server-side capture helper with dependency injection/mock for tests, wire to the actual successful seller/listing transitions, and open a separate code PR referencing #1615. Do not contact real customers, create live listings, enable payments, or use production credentials.

Related: #1613 (Seller-Free verification), #1468 (premium analytics), #1615 (tracking issue).
