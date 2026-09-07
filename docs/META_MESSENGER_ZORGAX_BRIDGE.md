# Meta Messenger ↔ MyZubster ↔ Zorgax Bridge

Status: Production integration  
Scope: Facebook Page Messenger for MyZubster Community  
Primary implementation: `src/routes/metaMessengerRoutes.js`

## 1. Purpose

This document describes the production bridge connecting the MyZubster Community Facebook Page to Zorgax. The bridge receives supported Messenger events through Meta webhooks, validates them, normalizes them into safe conversational input, routes known experiences such as the Comic Universe deterministically where appropriate, invokes Zorgax for conversational responses, and sends replies back through the Meta Send API.

The integration is for messages sent to the Facebook Page. It is not a bridge for private conversations belonging to a personal Facebook profile.

## 2. Architecture

```text
Facebook user
    ↓
MyZubster Community Page / Messenger
    ↓
Meta Messenger webhook
    ↓
POST /api/meta/messenger/webhook
    ↓
Signature validation + normalization + deduplication
    ↓
┌───────────────────────────────────────────────┐
│ Known deterministic route?                   │
│   Comic request → Comic Universe media route │
│   Otherwise → Zorgax assistant               │
└───────────────────────────────────────────────┘
    ↓
Meta Send API
    ↓
Messenger response
```

The webhook acknowledges Meta quickly and uses Vercel `waitUntil()` for asynchronous response processing. A successful webhook acknowledgement therefore remains separate from the success or failure of downstream Zorgax/Meta Send API processing.

## 3. Endpoints

### Status

`GET /api/meta/messenger/status`

The status response exposes non-secret integration capabilities such as configuration state, automatic inbound replies, supported inbound event categories, deduplication, conversation-memory mode, Comic media support, Comic Universe URL, and the webhook URL.

### Webhook verification

`GET /api/meta/messenger/webhook`

Meta uses this endpoint during webhook subscription verification. The route checks `hub.mode`, compares `hub.verify_token` against the configured verification token using a timing-safe comparison, and returns `hub.challenge` only when verification succeeds.

### Incoming events

`POST /api/meta/messenger/webhook`

Incoming POST requests must have a valid `X-Hub-Signature-256` generated with the Meta App Secret. Invalid signatures receive HTTP 401. Valid requests are normalized, queued with `waitUntil()`, and acknowledged with HTTP 200.

## 4. Environment variables

The bridge currently depends on these Meta-related variables:

```text
META_WEBHOOK_VERIFY_TOKEN
META_APP_SECRET
META_PAGE_ACCESS_TOKEN
META_GRAPH_API_VERSION
```

`META_GRAPH_API_VERSION` has an application fallback when not explicitly configured.

Never commit the values of tokens or secrets to Git. Documentation, issues, pull requests, screenshots and logs should refer only to variable names unless a value is explicitly safe and public.

## 5. Meta configuration

The Meta application must be connected to the intended Facebook Page and configured so Messenger events reach:

```text
https://www.myzubster.com/api/meta/messenger/webhook
```

The verify token entered in Meta must correspond to `META_WEBHOOK_VERIFY_TOKEN` in the production environment.

The Page Access Token used by the application is `META_PAGE_ACCESS_TOKEN`. The App Secret used to verify signed webhook requests is `META_APP_SECRET`.

When changing a production secret or token, update the hosting environment securely and redeploy as required. Never paste secret values into repository files.

## 6. Security controls

### Webhook signature

The bridge validates `X-Hub-Signature-256` against the raw request body with an HMAC-SHA256 generated from `META_APP_SECRET`.

### Timing-safe comparison

Verification values are compared with `crypto.timingSafeEqual()` when their lengths match.

### Echo protection

Events with `event.message.is_echo` are ignored. This prevents the Page's own outbound Messenger messages from recursively generating new Zorgax replies.

### Deduplication

Meta may redeliver webhook events. The bridge fingerprints inbound events and maintains a bounded, time-limited in-memory deduplication cache. The current implementation uses a 10-minute TTL and a maximum of 2,000 recent event fingerprints per warm instance.

### Attachment privacy

For inbound attachments, the bridge passes Zorgax a summary of attachment types rather than exposing attachment URLs. Zorgax is explicitly instructed not to claim it analyzed attachment contents when those contents are unavailable.

## 7. Supported inbound Messenger events

The current normalization layer supports:

- normal text messages;
- quick replies;
- postbacks/buttons;
- attachment-only messages.

Events that contain neither a usable sender nor supported conversational content are ignored. Page echo events and recently duplicated events are also ignored.

For attachment-only or button/postback interactions, Zorgax is instructed to acknowledge what was received and ask a useful follow-up question rather than failing silently.

## 8. Zorgax conversational behavior

For non-deterministic routes, normalized messages are sent to `zorgaxAssistantService` with Messenger-specific channel instructions.

Important channel rules include:

- answer in the language of the user's latest meaningful message;
- keep Messenger responses concise and conversational;
- avoid Markdown formatting;
- give one useful immediate next step;
- use canonical MyZubster destinations when relevant;
- guide onboarding one confirmed step at a time;
- do not invent commercial conditions.

### Short-term conversation context

The bridge keeps a small amount of conversation history keyed by a SHA-256 hash of the sender ID. The current warm-instance implementation keeps up to 10 messages, expires conversations after 30 minutes, and bounds the map to 500 conversations.

This memory is intentionally ephemeral. It is not persistent cross-instance or long-term user memory.

A conversation can therefore behave like:

```text
User: I want to become a Seller.
Zorgax: [Seller guidance]
User: How much does it cost?
Zorgax: [understands the Seller context]
User: OK, how do I start?
Zorgax: [continues the Seller flow]
```

## 9. Commercial-data grounding

Production testing demonstrated why commercial facts must not be left to unconstrained generation.

The Messenger instructions currently define buyer access as free and the configured default Seller plan as EUR 9.90/month. Because live configuration can change, Zorgax must direct users to verify the current Marketplace price.

Zorgax must not invent:

- commissions;
- payment fees;
- discounts;
- refunds;
- unverified commercial terms.

Canonical Marketplace destination:

```text
https://www.myzubster.com/marketplace
```

The broader architectural rule is documented in the ADR below: application truth wins over model speculation.

## 10. Canonical destinations

The Messenger channel currently provides Zorgax with these relevant public destinations:

```text
Marketplace / Seller: https://www.myzubster.com/marketplace
Metaverse:            https://www.myzubster.com/metaverse
LIFE Pilot:           https://www.myzubster.com/life-pilot
Community / login:    https://www.myzubster.com/social-login
Comic Universe:       https://www.myzubster.com/fumetto
```

These should be treated as canonical application routes for the corresponding Messenger intents unless the application architecture changes.

## 11. Comic Universe media bridge

Comic requests have a dedicated deterministic path.

```text
Messenger request
    ↓
wantsComicImage(...)
    ↓
selectComicAsset(...)
    ↓
sendImage(...)
    ↓
comicReply(...)
    ↓
Messenger
```

This route exists because MyZubster already knows that the Comic Universe is public and has known visual assets. A generic LLM response must not override that application state by claiming the Comic Universe is unavailable.

The image is sent through the Meta Send API as an image attachment. If image delivery fails, the error is logged and the textual Comic response can still be sent.

Runtime logging records whether Comic media was requested and whether the image was successfully sent (`imageSent`).

### Fiction / evidence boundary

Comic Universe fiction, concept art and historical-reference visuals are narrative media. They must not be presented as evidence of real-world events.

The public Comic destination is:

```text
https://www.myzubster.com/fumetto
```

## 12. Meta Send API

Outbound responses use the configured Graph API version and Page Access Token. The bridge sends messages with `messaging_type: RESPONSE`.

Supported outbound payloads currently include:

- text responses;
- image attachments for Comic Universe media.

Meta API failures are logged. When the main Zorgax flow fails, the bridge attempts to send a short temporary-unavailability fallback message.

## 13. Observability

Runtime logs use the `[meta-messenger]` prefix.

Successful handling records information such as:

- `message_handled`;
- processing mode (`zorgax` or `comic-deterministic`);
- inbound source (`message`, `quick_reply`, `postback`, `attachment`);
- warm-instance history mode;
- Comic media state;
- image delivery result for the deterministic Comic route.

Important distinction:

```text
HTTP 200 from webhook ≠ downstream response successfully delivered
```

When debugging, inspect both webhook receipt and downstream processing/Meta Send API logs.

## 14. Production test runbook

After a deployment, use a Facebook profile that is not the Page itself and send messages to MyZubster Community.

### Basic conversation

```text
Ciao Zorgax
```

Expected: automatic Zorgax reply in Italian.

### Seller context

```text
Voglio diventare Seller
```

Then, without repeating `Seller`:

```text
Quanto costa?
```

Expected: Zorgax retains short-term Seller context, states the configured default price carefully, does not invent fees, and points to the live Marketplace for verification.

Then:

```text
Ok, come inizio?
```

Expected: one-step-at-a-time onboarding guidance.

### Comic media

```text
Mostrami il fumetto di MyZubster
```

Expected: Comic intent is routed deterministically; an appropriate public Comic image is attempted; the response identifies the Comic Universe and links to `/fumetto`; fiction/concept material is not described as evidence.

### Alternate inbound shapes

Test a quick reply, a Page button/postback, and an attachment-only message.

Expected: each supported event is normalized and receives an automatic response rather than being silently discarded.

### Echo and duplicate protection

Expected: Page-generated echoes do not trigger Zorgax, and repeated delivery of the same Meta message/postback ID is suppressed during the deduplication TTL.

## 15. Troubleshooting

### Meta webhook verification returns 403

Check that:

- Meta is using the correct callback URL;
- `hub.mode` is `subscribe`;
- the verify token entered in Meta matches `META_WEBHOOK_VERIFY_TOKEN`;
- the production environment contains the expected variable and has been redeployed when required.

### Webhook POST returns 401

The Meta request signature did not validate. Check `META_APP_SECRET`, raw-body handling and whether the request is genuinely coming through the expected Meta webhook flow.

### Meta shows webhook success but Messenger receives no reply

A 200 response only confirms webhook acknowledgement. Inspect runtime logs for Zorgax processing errors and Meta Send API errors. Verify that `META_PAGE_ACCESS_TOKEN` is current and valid for the intended Page.

### A real user receives no automatic reply

Check the inbound event shape in runtime logs. The bridge supports text, quick replies, postbacks and attachments, but unsupported event types may be intentionally ignored. Also verify that the event is not an echo or a duplicate delivery.

### Comic text arrives but image does not

Search runtime logs for `comic_image_send_failed` and inspect the logged `imageSent` state. Verify that the selected asset URL is publicly fetchable by Meta and that the Page token can send attachments.

### Zorgax gives an unsupported commercial answer

Treat this as a grounding defect. Do not add more speculative wording. Update the deterministic/project-backed facts or channel rules so the application supplies verified commercial state and the model cannot fill gaps by guessing.

## 16. Development history

The Messenger bridge was developed incrementally. Relevant production work includes:

- PR #1007 — keep Zorgax processing alive after webhook acknowledgement;
- PR #1008 — improve Messenger conversation quality and short-term context;
- PR #1009 — ground Seller pricing answers;
- PR #1010 — connect Comic Universe images;
- PR #1011 — prioritize the public Comic Universe route and expose image-delivery observability;
- PR #1014 — automatically handle all currently supported inbound Page event shapes, with deduplication and attachment-safe normalization.

When behavior changes materially, update this document in the same PR as the implementation where practical.

## 17. Known limitations

- Conversation history is warm-instance memory, not durable storage.
- Deduplication is also warm-instance memory; it is not a distributed idempotency store.
- Attachment contents are not analyzed by this bridge; only attachment types are summarized for Zorgax.
- This integration handles the MyZubster Facebook Page Messenger channel, not personal-profile private messages.
- Meta permissions, tokens, platform rules and Graph API behavior can change independently of this repository.

## 18. Operational checklist

Before declaring a Messenger deployment healthy:

- confirm the production deployment succeeded;
- confirm `/api/meta/messenger/status` reports the expected capabilities;
- verify Meta webhook subscription remains active;
- send a real text message from a non-Page profile;
- test Seller context across multiple turns;
- test the Comic route and image delivery;
- inspect runtime logs for `message_handled` and unexpected Meta Send API failures;
- confirm no echo loop occurs;
- never expose token or secret values while debugging.

---

# ADR-001: Application Truth Before Generative Output

Status: Accepted

## Context

During live Messenger testing, Zorgax correctly retained conversational intent but generated unsupported commercial statements. In another test, the generic assistant claimed that the MyZubster Comic Universe was not publicly available even though the application already had a public Comic route and assets.

Both failures came from asking a generative layer to infer facts that the application already knew more reliably.

## Decision

When MyZubster has authoritative application state for a fact or route, that state takes precedence over unconstrained model generation.

Examples include:

- canonical product/experience URLs;
- configured commercial defaults;
- known public availability of the Comic Universe;
- selected public Comic assets;
- security and webhook behavior.

Use deterministic routing or explicit grounded context for these facts. Use Zorgax primarily for language, conversation, explanation and guidance around the grounded state.

## Consequences

Positive:

- fewer hallucinated commercial claims;
- more predictable Messenger behavior;
- easier testing and observability;
- application state remains the source of truth;
- deterministic media experiences can degrade gracefully when a third-party API fails.

Trade-offs:

- deterministic routes and grounded facts must be maintained when product configuration changes;
- runtime configuration and documentation must remain synchronized;
- persistent conversation memory and distributed deduplication will require additional infrastructure if needed later.
