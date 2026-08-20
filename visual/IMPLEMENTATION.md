# MyZubster Visual MVP — Implementation Notes

## What works in this branch

- `/visual` serves the Create Character + Comic interface from the existing Express app.
- Character metadata is created locally in the browser.
- Users can export the generated character as JSON.
- A deterministic four-panel storyboard is generated locally from the character role, scene type and collaboration intent.
- The storyboard is rendered as a comic preview in the browser.
- Users can export the story metadata as JSON.
- Users can export the comic as a standalone SVG asset.
- The GitHub collaboration Issue URL is updated to include the generated storyboard.
- The repository contains a JSON Schema, example character, example story and an Issue template.
- A Supertest smoke test verifies that `/visual` exposes the character/comic workflow controls.

## Current pipeline

```text
Create Character
      ↓
Sanitized character JSON
      ↓
Generate Comic
      ↓
Local four-panel storyboard
      ↓
Browser comic preview
      ↓
Download story JSON / comic SVG
      ↓
Open pre-filled GitHub collaboration Issue
```

This stage is intentionally client-side and deterministic. It gives the project a working comic artifact flow without requiring credentials or a third-party image API.

## What is intentionally not implemented yet

- No external AI image-generation API is called.
- No GitHub OAuth/login is performed by this page.
- No profile, story or image is automatically committed or published to GitHub.
- No user photo is uploaded or persisted.
- No personal data is sent to a MyZubster backend by this MVP.
- No collaboration request is automatically accepted or converted into a real partnership.

## Next technical milestones

1. GitHub OAuth with minimum required scopes.
2. Server-side validation against `visual/schemas/character.schema.json`.
3. Optional persistence with explicit privacy controls.
4. Editable dialogue/storyboard controls.
5. Optional AI image-generation provider abstraction with consent and moderation boundaries.
6. Character visual-consistency references for approved likenesses.
7. Story gallery and versioned character pages.
8. Explicit Issue/PR publishing through the GitHub API after user action.

The MVP must keep a clear distinction between generated creative content, GitHub collaboration metadata and real-world partnership commitments.
