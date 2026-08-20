# MyZubster Visual

MyZubster Visual is an experimental social/comic layer for the MyZubster ecosystem.

The goal is to let each contributor create a persistent **digital character**, use that character in collaborative comic scenes, and connect the resulting story to a real GitHub conversation, issue or pull request.

> Status: experimental MVP with a working character → storyboard → comic → optional AI render → GitHub collaboration flow. It is not yet a production social platform.

## Try the MVP

When the MyZubster Express app is running, open:

```text
/visual
```

The page lets a user:

- create a sanitized character profile locally;
- generate a four-panel storyboard from role, scene and collaboration intent;
- render a local comic draft in the browser;
- download character JSON, story JSON and SVG comic;
- explicitly authorize an AI render of the storyboard;
- call the configured server-side image provider;
- download the returned AI image;
- optionally publish an explicitly approved proposal scene to the Visual gallery when gallery writes are enabled;
- open a pre-filled GitHub collaboration Issue containing the storyboard.

Nothing is automatically published and AI generation is never silently faked when provider credentials are missing.

## Current flow

```text
Create Character
        ↓
Local sanitized profile
        ↓
Generate Storyboard
        ↓
Browser comic / SVG
        ↓
Explicit likeness authorization
        ↓
Optional AI comic render
        ↓
Optional approved gallery publication
        ↓
GitHub collaboration Issue
        ↓
Human discussion
        ↓
Optional PR / implementation
```

## Character consistency

The AI adapter builds a **character lock** from the visual traits in the profile and instructs the image model to preserve face, hair, clothing, accessories, approximate age and body proportions across panels.

This improves consistency but is not a mathematical guarantee. Future iterations can use explicitly authorized reference images and iterative editing to strengthen continuity across scenes.

## Image provider

The first server-side adapter uses the OpenAI Images API. Configuration and safety boundaries are documented in [`IMAGE_GENERATION.md`](IMAGE_GENERATION.md).

No API key is sent to the browser or stored in public character/story metadata.

## Gallery

The approved gallery is available at:

```text
/visual/gallery
```

Gallery writes are disabled by default and require both:

```text
VISUAL_GALLERY_WRITE_ENABLED=true
character.consent.public_gallery=true
```

A gallery entry remains a creative proposal. It is not evidence of a partnership, contract, endorsement or commitment.

## GitHub collaboration model

Issues are the conversational layer. Generated comics are presentation; GitHub contains the explicit proposal and reviewable discussion.

Pull requests are appropriate for versioned character profiles, stories, documentation and implementation changes.

## Privacy and consent

- Do not put unnecessary personal information into public character files or story metadata.
- If a character is based on a real person, that person must choose or approve use of their likeness.
- AI generation requires an explicit likeness/character authorization flag.
- Gallery publication requires a separate explicit public-gallery consent.
- Consent for one scene does not imply consent for unrelated future uses.

## Implemented in this MVP

- Character JSON schema and examples.
- Collaboration Issue template.
- `/visual` Create Character UI.
- Local sanitized JSON preview/export.
- Four-panel storyboard generator.
- Browser comic preview and SVG export.
- Storyboard-aware GitHub Issue handoff.
- Server-side AI image provider abstraction.
- OpenAI image-generation adapter with server-side key handling.
- Character-lock prompt construction.
- Explicit likeness authorization before AI rendering.
- `/api/visual/gallery` API.
- `/visual/gallery` approved-scene gallery.
- Gallery writes disabled by default.
- Smoke/API tests for Visual routes and provider-unconfigured behavior.

## Next

- GitHub OAuth and verified handle binding.
- Server-side schema validation.
- Editable dialogue/storyboard controls.
- Durable object storage for generated images.
- Database-backed gallery metadata.
- Authorized reference-image editing for stronger character consistency.
- Moderation/review workflow before public gallery publication.
- Multi-character collaborative scenes.

## Design principle

```text
CHARACTER → STORY → COMIC → CONVERSATION → COLLABORATION → OPTIONAL IMPLEMENTATION
```

The creative layer starts a conversation. GitHub provides reviewability and history. Neither generated content nor an Issue should be presented as proof that a real-world partnership exists.
