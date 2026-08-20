# MyZubster Visual MVP — Implementation Notes

## What works in this branch

- `/visual` serves the Create Character and local storyboard/comic workflow.
- Character metadata is created locally in the browser.
- Users can export character JSON, story JSON and a standalone SVG comic.
- The generated storyboard can be handed off into a pre-filled GitHub collaboration Issue.
- AI rendering is available through `POST /api/visual/generate-image` when a server-side provider is configured.
- The first provider adapter uses the OpenAI Images API and keeps the API key server-side.
- AI rendering requires explicit `authorized_likeness` consent.
- Character-lock prompt instructions ask the image model to keep visual identity stable across panels.
- `/visual/gallery` renders explicitly published proposal scenes.
- Gallery writes are disabled unless `VISUAL_GALLERY_WRITE_ENABLED=true` and separate public-gallery consent is present.
- Tests cover the Visual page, gallery page and transparent failure when AI provider credentials are missing.

## Required AI configuration

```bash
VISUAL_IMAGE_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_IMAGE_MODEL=gpt-image-1.5
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=medium
```

See `visual/IMAGE_GENERATION.md` for details.

## What is intentionally not production-ready

- No GitHub OAuth/login yet.
- No automatic commits or publishing to GitHub.
- No user photo upload or reference-image editing yet.
- Gallery storage currently uses a runtime JSON file rather than durable object storage/database metadata.
- No moderation queue before gallery publication beyond explicit consent and server write-enable configuration.
- Character consistency is prompt-based rather than reference-image/edit based.
- No collaboration request is automatically accepted or converted into a real partnership.

## Next technical milestones

1. GitHub OAuth with minimum required scopes.
2. Server-side validation against `visual/schemas/character.schema.json`.
3. Object storage for generated image assets and hashed asset manifests.
4. Database-backed gallery metadata.
5. Explicitly authorized reference-image editing for stronger character continuity.
6. Moderation/review state before public publication.
7. Multi-character scene editor and story versioning.
8. Issue/PR linking through the GitHub API after explicit user action.

The MVP remains explicit about the difference between generated creative content, GitHub collaboration metadata and real-world partnership commitments.
