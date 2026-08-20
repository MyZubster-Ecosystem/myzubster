# MyZubster Visual — AI image generation

MyZubster Visual can optionally render a generated storyboard through a configured server-side image provider.

## Current provider

The first adapter targets the OpenAI Images API. The default model is `gpt-image-1.5`, configurable through an environment variable.

Required configuration:

```bash
VISUAL_IMAGE_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_IMAGE_MODEL=gpt-image-1.5
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=medium
```

Optional timeout:

```bash
OPENAI_IMAGE_TIMEOUT_MS=120000
```

API keys must stay server-side and must never be exposed in `public/`, committed to Git, embedded in character JSON or sent to the browser.

## Endpoint

```text
POST /api/visual/generate-image
```

Request body:

```json
{
  "character": { "...": "sanitized character profile" },
  "story": { "...": "generated storyboard" }
}
```

The request is rejected unless `character.consent.authorized_likeness` is explicitly true.

The prompt includes a **character lock** describing stable visual traits and instructing the image model to keep face, hair, clothing, accessories, approximate age and body proportions consistent across the comic panels.

This improves continuity but does not guarantee perfect visual identity consistency. Stronger continuity can later be implemented using explicitly authorized reference images and iterative image editing rather than independent text-to-image generations.

## Gallery

Approved proposal scenes can be exposed through:

```text
GET /api/visual/gallery
GET /visual/gallery
```

Writing is disabled by default. To allow explicit publication:

```bash
VISUAL_GALLERY_WRITE_ENABLED=true
```

Publication also requires `character.consent.public_gallery=true`.

The current MVP stores gallery entries in `data/visual-gallery.json` at runtime. This is intentionally simple and should be replaced by durable object storage + database metadata before production use. Base64 image data can be large, so production deployments should store image assets separately and keep only stable asset URLs and hashes in gallery metadata.

## Safety and representation boundaries

- Do not generate a real person's likeness without authorization.
- Do not treat generated scenes as proof of a partnership, endorsement or contract.
- Do not send private keys, credentials or unnecessary personal data to an image provider.
- Gallery publication must remain an explicit user action.
- A provider failure must be shown as a failure; the UI must not substitute a fake AI result.

## Provider abstraction

The integration lives in `src/services/visualImageProvider.js`. Additional providers can be added behind the same `generateComicImage()` contract without changing the browser workflow.
