# MyZubster Interactive Canonical Entities

The public MyZubster frontend exposes all 12 canonical entities at `/entities` (aliases: `/agents` and `/assistants`). The same page is also reachable from the main portal.

## Flow

1. The browser loads the bundled canonical registry so the roster is immediately available.
2. It synchronizes with `GET /api/entities` when the API is reachable.
3. Selecting an entity loads its mission, workflow, capabilities, boundaries, repository, suggestions and runtime status.
4. A message is sent to `POST /api/entities/:slug/chat`.
5. The API uses the entity-specific system prompt with Ollama when configured.
6. If Ollama is unavailable, the API returns a deterministic, role-specific guided response. If the API itself is unreachable, the browser produces the same class of local guidance without transmitting or storing the message.

## API

- `GET /api/entities`
- `GET /api/entities/:slug`
- `GET /api/entities/:slug/status`
- `GET /api/entities/bounties`
- `GET /api/entities/:slug/bounties`
- `POST /api/entities/:slug/chat` with `{ "message": "..." }`

The direct `/entity-bounties` view and the **Bounty & visual** tab expose the completion program for every entity. See [`ENTITY_BOUNTY_SYSTEM.md`](ENTITY_BOUNTY_SYSTEM.md) for reward boundaries, milestones, deliverables and the evidence-first review flow.

Environment variables:

- `OLLAMA_URL` — Ollama endpoint
- `ENTITY_OLLAMA_MODEL` — model used by the entity hub; falls back to `OLLAMA_MODEL`, then `qwen2.5:3b`
- `ENTITY_CHAT_TIMEOUT_MS` — 5–120 second provider timeout (default 45 seconds)

## Privacy and governance

- Conversations are held only in React state and disappear on refresh.
- The generic entity API does not store server-side conversation memory.
- Rendered model text is plain React text; HTML is not injected.
- Chat requests are rate-limited and validated.
- Entity boundaries explicitly separate facts, inference, missing evidence and narrative lore.
- MYZ remains an internal accounting/reward record. No automatic external settlement is represented.

## Test

```bash
npm test -- --runInBand tests/entities.test.js
cd frontend && npm ci && npm run build
```
