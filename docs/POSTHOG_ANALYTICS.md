# PostHog analytics

MyZubster forwards privacy-safe funnel events from `/api/zorgax/assistant/track` to PostHog.

## Required Vercel environment

- `POSTHOG_PROJECT_TOKEN` — PostHog project token for the MyZubster project.
- `POSTHOG_HOST` — optional; defaults to `https://eu.i.posthog.com`.

No email address, wallet address, raw message content, or authentication token is sent by this funnel adapter.

The adapter disables person-profile processing and uses either the authenticated MyZubster user id or the short-lived funnel-session id as `distinct_id`.

## Initial funnel

Recommended first funnel:

1. `profile_onboarding_open`
2. `profile_onboarding_profile_loaded`
3. `profile_onboarding_completed`
4. `profile_onboarding_enter_metaverse_click`

Existing events such as `zorgax_open`, `zorgax_first_message`, `marketplace_demo_open`, and seller checkout events are forwarded through the same endpoint.


## Unified authenticated journey

The privacy-safe tracking endpoint also accepts a compact cross-product journey:

- `journey_login_authenticated`
- `journey_profile_open`
- `journey_profile_completed`
- `journey_zorgax_open`
- `journey_metaverse_open`
- `journey_marketplace_open`

When a valid MyZubster token is available, the backend uses the internal user id as the PostHog `distinct_id` (`user:<id>`). Email addresses are not sent as analytics properties. Anonymous activity continues to use the short-lived funnel session id.
