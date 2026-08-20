# MyZubster Visual MVP — Implementation Notes

## What works in this branch

- `/visual` serves a standalone Create Character interface from the existing Express app.
- Character metadata is created locally in the browser.
- Users can export the generated character as JSON.
- The UI generates a pre-filled GitHub Issue URL for a collaboration proposal.
- The repository contains a JSON Schema, example character, example story and an Issue template.
- A Supertest smoke test verifies that `/visual` serves the interface.

## What is intentionally not implemented yet

- No image-generation API is called.
- No GitHub OAuth/login is performed by this page.
- No profile is automatically committed or published to GitHub.
- No user photo is uploaded or persisted.
- No personal data is sent to a MyZubster backend by this MVP.
- No collaboration request is automatically accepted or converted into a real partnership.

## Next technical milestones

1. GitHub OAuth with minimum required scopes.
2. Server-side validation against `visual/schemas/character.schema.json`.
3. Optional persistence with explicit privacy controls.
4. Comic storyboard generation endpoint.
5. Image-generation provider abstraction with consent and moderation boundaries.
6. Story gallery and versioned character pages.
7. Issue/PR linking through the GitHub API after explicit user action.

The MVP should remain transparent about the difference between generated creative content, GitHub collaboration metadata and real-world partnership commitments.
