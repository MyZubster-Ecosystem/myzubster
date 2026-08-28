# MyZubster TV — Character Creation Guide

> Status: **design/implementation guide**. The complete self-service flow must be verified end-to-end on a real Google TV / Android TV device before it is described as production-ready.

## Overview

MyZubster TV is intended to let an authenticated user create, personalize, save, and later edit their own MyZubster character using only a TV remote.

The target flow is:

```text
OPEN APP → SIGN IN → MY CHARACTER → CREATE → CUSTOMIZE → REVIEW → SAVE → CHARACTER REGISTRY
```

A character is considered successfully created only when it is persisted server-side, associated with the correct user, available from the Character Registry, and still present after the TV app is closed and reopened.

---

# User Guide

## 1. Open MyZubster TV

Launch MyZubster from the Google TV or Android TV home screen.

Use the directional pad on the remote to move between controls and press **OK / Select** to confirm.

## 2. Sign in

Complete the MyZubster sign-in flow if required.

Character ownership must be linked to the authenticated account. A user must not be able to create or edit a character belonging to another account.

## 3. Open “My Character”

From the TV interface, navigate to:

```text
Profile → My Character
```

If no character exists yet, select:

```text
Create your character
```

## 4. Choose a name

Enter a display name using the Android TV on-screen keyboard.

Recommended rules:

- use a public alias rather than private personal data;
- keep the name short enough to display comfortably on TV;
- avoid secrets, wallet addresses, credentials, or sensitive information.

## 5. Customize the character

The Character Builder may expose options such as:

- avatar or visual style;
- role;
- mission;
- interests;
- public alias;
- other approved visual attributes.

Every control must be reachable with the D-pad. No required action may depend only on mouse hover, touch, or a physical keyboard.

## 6. Review the preview

Before saving, review the character summary:

- name;
- avatar;
- mission;
- roles;
- public alias;
- other visible profile information.

Select **Edit** to change something or **Create Character** to continue.

## 7. Save the character

When the user confirms creation, the TV client sends the character request to the backend.

The server should return at least:

```json
{
  "id": "CHARACTER_ID",
  "name": "Display name",
  "status": "proposed",
  "createdAt": "ISO-8601 timestamp"
}
```

Possible lifecycle states include:

- `proposed` — created and awaiting review;
- `under_review` — moderation or validation is in progress;
- `active` — approved and available as an active character;
- `rejected` — rejected with a reason;
- `archived` — no longer active.

## 8. Reopen and edit

After creation, reopening:

```text
Profile → My Character
```

should load the same persisted character.

When editing is supported, select **Edit**, make the changes, and save them. Changes that affect moderated fields may return the character to a review state.

---

# Technical Guide

## Architecture

The intended end-to-end path is:

```text
TV UI
  ↓
authenticated session
  ↓
Character Builder
  ↓
server-side validation
  ↓
Character onboarding API
  ↓
Character Registry
  ↓
TV confirmation / reload
```

A local-only TV profile is not sufficient. The character must be persisted outside the device.

## Recommended data model

A character record should contain at least:

```text
id
ownerUserId
name
publicAlias?
status
roles[]
mission?
visual
createdAt
updatedAt
```

The backend, not the TV client, must derive `ownerUserId` from the authenticated session.

## Recommended API surface

Creation:

```http
POST /api/characters
```

Update:

```http
PATCH /api/characters/:id
```

Fetch current user's character:

```http
GET /api/characters/me
```

The exact routes may differ from the implementation, but ownership and authorization rules must remain server-enforced.

## Server-side validation

Validate at least:

- required fields;
- name length and allowed format;
- allowed roles and visual options;
- maximum description sizes;
- identifier uniqueness;
- authenticated ownership;
- unsafe or unsupported content;
- payload size;
- rate limits.

Never trust values supplied by the TV client simply because they came from the official application.

## Character Registry integration

The persisted character must remain compatible with the existing MyZubster Character Registry format.

If registry entries are represented as manifests, generated entries must follow the repository schema and must not overwrite files owned by another user.

The existing contributor-character workflow demonstrates registry onboarding, but that alone does **not** prove that the TV self-service path is implemented or verified.

## Moderation boundary

Creation and public activation should be treated as separate operations when moderation is required.

A safe default lifecycle is:

```text
CREATE → proposed → review → active
```

Automated activation may be added only when validation and abuse controls are sufficient.

## TV accessibility requirements

The Character Builder should meet these minimum requirements:

- visible focus state on every actionable control;
- predictable D-pad navigation order;
- no keyboard trap;
- large TV-friendly targets;
- readable text at typical viewing distance;
- no mandatory hover interactions;
- support for the Android TV on-screen keyboard;
- clear Back-button behavior;
- confirmation before discarding unsaved edits.

## Security requirements

The flow must prevent:

- unauthenticated creation unless explicitly intended;
- editing another user's character;
- client-controlled ownership IDs;
- injection through text fields;
- arbitrary registry file overwrite;
- moderation bypass;
- unvalidated visual uploads;
- mass character creation/spam.

Apply authentication, authorization, validation, and rate limiting server-side.

---

# End-to-End Verification Checklist

The feature should not be marked verified until all of the following pass on a physical Google TV / Android TV device:

- [ ] App launches successfully.
- [ ] User can sign in.
- [ ] “My Character” is reachable using only the remote.
- [ ] Character Builder opens.
- [ ] Every field and control is D-pad reachable.
- [ ] On-screen keyboard works for text input.
- [ ] Avatar/style selection works.
- [ ] Character preview is readable on TV.
- [ ] Save action reaches the backend.
- [ ] Backend returns a persistent character ID.
- [ ] Character appears in the Character Registry or canonical character store.
- [ ] Ownership is associated with the signed-in user.
- [ ] App can be closed completely.
- [ ] Reopening the app loads the same character.
- [ ] Editing the character persists correctly.
- [ ] A second user cannot edit the first user's character.
- [ ] Invalid and abusive payloads are rejected safely.

---

# Definition of Done

The TV character feature is complete only when an authorized user can:

```text
create → personalize → save → reload → edit
```

their own character using only the TV remote, with server-side persistence and correct Character Registry ownership.

Until the physical-device end-to-end test passes, documentation should describe the feature as **implemented/in progress** rather than **verified production functionality**.
