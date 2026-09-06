# ZORGAX Party Mode — Safety & Acceptance Gate

Tracking: Linear MYZ-113

This document defines the executable acceptance boundary for the current ZORGAX Party Mode implementation.

## Implemented Party Mode slices

- Z1 PartyContext: server-built, bounded public context
- Z2 Community/Event Assistant: grounded read-only answers from PartyContext
- Z3 Room/session telemetry: bounded operational state with safe degradation
- Z4 Creator capability gateway: allowlisted commands, server-side authorization, confirmation and idempotency
- Z5 Moderation queue: authenticated reporting, human-review triage and audit
- Z6 Archive handoff: approved/consented public assets and live-capability expiry

## Safety gate

The automated Z7 acceptance test covers:

1. client identity/session claims do not become verified identity;
2. private identity, token, raw session and concealed-location fields fail PartyContext validation;
3. prompt/context injection cannot override restricted-data handling;
4. privileged creator commands require server-authoritative role checks;
5. consequential commands require explicit confirmation and idempotency;
6. Party Mode exposes no autonomous permanent-ban capability;
7. archive handoff requires admin confirmation and rejects unsafe URL schemes;
8. public archive views surface only approved + consent-verified assets;
9. anonymous callers cannot invoke privileged command/report/archive routes;
10. telemetry excludes sensitive operational/user data and degrades visibly when shared storage is unavailable.

## Explicitly incomplete upstream dependencies

Passing this gate does **not** mean the entire Social Life / WebXR roadmap is complete.

The following remain explicit upstream gaps:

- MYZ-82: block/mute/realtime moderation enforcement — `not-yet-enforced`
- MYZ-88: production WebXR room/session lifecycle — not yet the authoritative room lifecycle
- MYZ-97: replay/highlights engine — `not-modeled`

Z7 validates that the currently implemented Party Mode slices preserve these boundaries and do not claim unavailable capabilities.

## Completion rule

MYZ-113 can be marked Done when:

- the Z7 acceptance test passes in CI/staging;
- required deployment checks are green;
- the PR is mergeable and merged;
- no test or implementation introduces private identity/location leakage, autonomous high-impact moderation, unrestricted tool execution, or false claims that missing upstream capabilities exist.
