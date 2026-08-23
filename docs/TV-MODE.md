# MyZubster TV Mode

`public/tv.html` is the large-screen, remote-first web surface used by the Android TV / Google TV wrapper.

## Purpose

The TV surface follows the clarity-first narrative:

`OBSERVE -> REPORT -> ACT -> VERIFY -> IMPACT`

It introduces the simple public story before exposing broader MyZubster modules.

## Interaction

- Large typography and high-contrast focus states.
- Arrow-key / D-pad navigation between primary actions.
- Enter/select activates the focused native link.
- Responsive fallback for narrow displays.
- The native wrapper loads the canonical HTTPS URL `https://www.myzubster.com/tv.html`.

## Evidence boundary

This page is documentation/UI, not evidence. Chronicle imagery and documentation visuals must never be presented as proof of physical action, deployment, payment, partnership or adoption. Real-world evidence requires its own provenance and verification.

## Status

`DOCUMENTATION_VISUAL / TV_SURFACE / DEVICE_QA_REQUIRED`

A successful Android build does not prove real-device behavior. A physical Google TV / Android TV QA pass remains required before compatibility is marked verified.
