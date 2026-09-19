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
