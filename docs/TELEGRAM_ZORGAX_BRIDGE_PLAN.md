# Telegram Bots ↔ MyZubster ↔ Zorgax Bridge Plan

Status: Proposed / implementation plan  
Scope: Telegram bot integration with the existing MyZubster ecosystem  
Related production bridge: `docs/META_MESSENGER_ZORGAX_BRIDGE.md`  
Operations reference: `docs/META_MESSENGER_OPERATIONS_RUNBOOK.md`

## 1. Purpose

This document defines how Telegram bots can become another conversational gateway into MyZubster without creating a separate AI architecture for every social platform.

The goal is to reuse the principles already proven by the Facebook Messenger ↔ MyZubster ↔ Zorgax bridge:

- Zorgax is the conversational guide;
- MyZubster remains the source of truth for application state;
- known routes and commercial facts are grounded or deterministic;
- external messaging platforms are gateways, not authoritative data stores;
- media, community and Metaverse destinations can be reached from conversation;
- security, deduplication, observability and graceful fallback are first-class concerns.

Telegram should therefore become a second channel connected to the same MyZubster/Zorgax core rather than a parallel product with duplicated business logic.

## 2. Target architecture

```text
                         ┌──────────────────────┐
                         │      MyZubster       │
                         │ application truth    │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │        Zorgax / Channel Core      │
                  │ context · routing · grounding     │
                  └───────────────┬───────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
      ┌───────▼────────┐                      ┌───────▼────────┐
      │ Meta Messenger │                      │ Telegram Bot   │
      │ webhook / Send │                      │ webhook / API  │
      └───────┬────────┘                      └───────┬────────┘
              │                                       │
      Facebook Community                        Telegram users
```

The desired logical flow for Telegram is:

```text
Telegram User
    ↓
Telegram Bot API
    ↓
POST /api/telegram/zorgax/webhook
    ↓
Secret validation / normalization / deduplication
    ↓
Shared MyZubster channel router
    ↓
┌──────────────────────────────────────────────┐
│ Deterministic application route when known  │
│ Otherwise → Zorgax conversational service   │
└──────────────────────────────────────────────┘
    ↓
Marketplace · Seller · Metaverse · LIFE Pilot
Community · Culture/Subculture · Comic Universe
    ↓
Telegram Bot API
    ↓
Telegram response
```

## 3. Product objective

Telegram should allow a person to discover and continue interacting with MyZubster before, during and after a physical event or online interaction.

Examples:

```text
User: What is MyZubster?
Zorgax: [short introduction + useful next step]

User: Take me to the Metaverse.
Zorgax: [grounded Metaverse explanation + canonical link]

User: I want to become a Seller.
Zorgax: [Seller guidance]

User: How much does it cost?
Zorgax: [continues Seller context using grounded commercial state]

User: Show me the comic.
Bridge: [public Comic image + grounded Comic Universe response]
```

The channel should also be usable as a continuity layer for communities formed around events, music, art, recycling initiatives, Culture/Subculture spaces and LIFE activities.

## 4. Culture and Subculture continuity

A core use case is preserving community connections after a physical gathering ends.

Conceptually:

```text
Physical event
    ↓
Music / art / people / shared activity
    ↓
Recycling and local action
    ↓
QR / Telegram Bot / Messenger entry point
    ↓
Zorgax
    ↓
MyZubster Culture or Subculture
    ↓
Community / Metaverse / LIFE Pilot
    ↓
Future initiatives and events
```

Telegram groups and bots can provide a practical communication surface, while MyZubster should remain the durable ecosystem layer for identities, experiences, canonical content and application state.

The design must not depend on any specific historical movement or community being formally affiliated with MyZubster. Cultural references can provide inspiration or context, but the platform must not imply endorsement or partnership without verified authorization.

## 5. One Zorgax core, multiple channel adapters

The preferred implementation is to separate channel-specific transport logic from shared assistant logic.

```text
src/
  routes/
    metaMessengerRoutes.js
    telegramZorgaxRoutes.js

  services/
    zorgaxAssistantService.js
    messaging/
      channelRouter.js
      conversationContext.js
      canonicalDestinations.js
      commercialGrounding.js
      mediaRouter.js
```

This structure is illustrative. Existing code should be refactored incrementally rather than moved solely to match this document.

### Channel adapters should own

- webhook authentication/validation;
- platform update normalization;
- platform-specific sender/chat identifiers;
- platform-specific reply APIs;
- formatting limits;
- platform-specific media payloads;
- platform-specific retries and errors.

### Shared MyZubster/Zorgax core should own

- canonical destinations;
- application-backed facts;
- intent routing rules;
- commercial grounding;
- Comic Universe semantics;
- Culture/Subculture navigation;
- Metaverse navigation;
- assistant channel policy where platform-independent;
- safety and fiction/evidence boundaries.

## 6. Proposed Telegram endpoints

### Health/status

```text
GET /api/telegram/zorgax/status
```

The response should expose only non-secret state, for example:

```json
{
  "ok": true,
  "configured": true,
  "webhook": true,
  "autoReply": true,
  "zorgax": true,
  "comicMedia": true,
  "cultureRouting": true,
  "metaverseRouting": true
}
```

### Telegram webhook

```text
POST /api/telegram/zorgax/webhook
```

The route should:

1. validate a configured webhook secret;
2. parse the Telegram `Update`;
3. reject/ignore unsupported updates safely;
4. deduplicate by `update_id`;
5. normalize supported input;
6. invoke deterministic routing or Zorgax;
7. reply through the Telegram Bot API;
8. log outcome without leaking tokens or private content.

## 7. Proposed environment variables

Use names such as:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_WEBHOOK_SECRET
TELEGRAM_BOT_USERNAME
```

Optional channel-specific configuration may be added later if justified.

Rules:

- never commit token/secret values;
- never expose them from `/status`;
- never place them in screenshots, docs, PR descriptions or runtime logs;
- rotate immediately if a credential is accidentally exposed;
- keep production and preview/development credentials separated where practical.

## 8. Telegram webhook security

When registering the webhook, configure Telegram's webhook secret token and validate the incoming secret header before processing updates.

The application should reject webhook requests whose configured secret does not match.

Additional controls:

- HTTPS production endpoint only;
- bounded request body size;
- strict JSON parsing;
- deduplication using `update_id`;
- no Bot Token in URLs written to logs;
- rate/error monitoring;
- no trust in user-supplied usernames or display names as stable identity.

The Telegram Bot Token is a credential for outbound API access and must not be treated as webhook authentication by itself.

## 9. Update normalization

The adapter should initially support:

- private text messages;
- bot commands;
- callback queries from inline keyboards;
- photo messages;
- document/media messages where a safe fallback is possible.

Potential later support:

- group/supergroup messages;
- channel posts;
- edited messages;
- membership events;
- forum topics.

Do not enable broad group auto-replies by default. A bot that responds to every group message can create noise, privacy problems and rate pressure. Group behavior should be explicitly designed, for example command-only, mention-only or reply-to-bot mode.

## 10. Private chat versus group behavior

### Private chat

Default behavior can be conversational auto-reply:

```text
User → Bot → Zorgax → User
```

### Group / supergroup

Recommended initial behavior:

```text
/command
@bot mention
reply to bot
explicit inline action
```

Only these triggers should invoke Zorgax unless a group administrator deliberately enables a broader mode.

This keeps Zorgax useful without dominating community conversations.

## 11. Telegram commands

Suggested minimal command surface:

```text
/start       Introduce MyZubster and Zorgax
/help        Show concise capabilities
/marketplace Open Marketplace guidance
/seller      Start Seller guidance
/metaverse   Explain/open the Metaverse
/life        Explain LIFE Pilot
/comic       Show Comic Universe content
/culture     Explore Culture/Subculture paths
/privacy     Explain what the bot processes
```

Commands are shortcuts, not separate business logic. They should map into the same shared routing layer used by natural-language requests.

## 12. Canonical MyZubster destinations

The Telegram adapter should use the same application destinations as Messenger:

```text
MyZubster:             https://www.myzubster.com/
Marketplace / Seller: https://www.myzubster.com/marketplace
Metaverse:            https://www.myzubster.com/metaverse
LIFE Pilot:           https://www.myzubster.com/life-pilot
Community / login:    https://www.myzubster.com/social-login
Comic Universe:       https://www.myzubster.com/fumetto
```

Culture/Subculture destinations should be added only when their canonical application routes are confirmed in code. Do not invent permanent URLs in the bot layer.

## 13. Metaverse bridge

Telegram should provide a conversational entry point into the MyZubster Metaverse.

Example:

```text
User: Where can we meet after the event?
    ↓
Zorgax recognizes community / Metaverse intent
    ↓
Explains available MyZubster path
    ↓
Provides canonical Metaverse destination
```

Telegram itself remains the messaging transport. The Metaverse remains a MyZubster experience.

The bot must not claim that a Telegram group, external event, organizer or cultural community has an official Metaverse space unless MyZubster application state verifies it.

## 14. Event → recycling → community continuity

A future event workflow can use both Messenger and Telegram:

```text
EVENT
  │
  ├── QR → Messenger → Zorgax
  │
  └── QR → Telegram Bot → Zorgax
                       │
                       ▼
                 MyZubster Core
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
   Culture        LIFE / recycling   Metaverse
       │               │                │
       └───────────────┼────────────────┘
                       ▼
                  Community
                       │
                       ▼
               Next real activity
```

Possible legitimate uses include:

- publish event cleanup/recycling instructions;
- direct volunteers to a LIFE Pilot activity;
- preserve links and public resources after the event;
- connect participants to relevant Culture/Subculture spaces;
- provide a route to future events or community projects;
- let Zorgax explain where to continue the interaction.

Do not use the bot to represent unverified environmental outcomes. Recycling or impact claims should be grounded in actual LIFE/application records where such records exist.

## 15. Conversation context

Telegram should initially follow the same conservative principle as Messenger: short-term context is useful, but persistent identity/memory should not be implied unless it actually exists.

A context key should use platform scope, for example:

```text
telegram:<bot-id>:<chat-id>:<user-id>
```

Do not expose raw identifiers in normal logs. Hash or otherwise minimize them where operationally possible.

For group chats, chat context and individual-user context should be considered separately to avoid accidentally mixing one participant's private history into another participant's response.

## 16. Application truth before generative output

The Messenger ADR applies unchanged to Telegram:

> When MyZubster has authoritative application state for a fact or route, that state takes precedence over unconstrained model generation.

Examples:

- Seller pricing;
- canonical URLs;
- availability of Comic Universe content;
- Culture/Subculture existence;
- event metadata;
- LIFE/recycling records;
- Metaverse destinations;
- verified partnerships or affiliations.

Zorgax can explain these facts. It must not invent them.

## 17. Commercial grounding

Telegram must reuse the same Seller/commercial grounding policy as Messenger.

If the configured default Seller plan remains EUR 9.90/month, the bot may state that grounded value while directing users to the Marketplace to verify current live configuration.

The bot must not invent:

- commissions;
- payment fees;
- discounts;
- refund policies;
- subscriptions that do not exist;
- special event offers that have not been configured.

Commercial state should eventually be read from one shared application service rather than copied into separate channel prompts.

## 18. Comic Universe media

Telegram can mirror the successful Messenger media route:

```text
/comic or natural-language Comic request
    ↓
Shared Comic intent / deterministic route
    ↓
Select approved public visual
    ↓
Telegram sendPhoto
    ↓
Grounded caption / follow-up
    ↓
https://www.myzubster.com/fumetto
```

The same boundary applies:

**FICTION / CONCEPT artwork is narrative media, not evidence of real-world events.**

If media delivery fails, send a text fallback containing the canonical Comic Universe link.

## 19. Media privacy

Do not automatically download or analyze every file sent to the Telegram bot.

Initial behavior should be conservative:

- recognize that a photo/document was received;
- preserve only metadata needed for routing/operations;
- do not claim Zorgax saw content that was not actually retrieved;
- do not persist Telegram file URLs unnecessarily;
- require an explicit product decision before enabling file-content analysis.

Telegram file identifiers and file paths should be treated as channel data, not public asset URLs.

## 20. Inline keyboards and deep links

Telegram provides useful navigation primitives.

Suggested inline actions:

```text
[ Marketplace ] [ Metaverse ]
[ LIFE Pilot ]   [ Comic Universe ]
[ Culture ]      [ Help ]
```

Buttons should map to deterministic callback data, not user-visible URLs when a conversational step is useful.

Deep links can later support campaign/event entry points such as a start parameter that identifies a public event or Culture context. Any such parameter must be validated against MyZubster state rather than trusted directly from the URL.

## 21. Multi-bot strategy

There are two possible approaches.

### Option A — one main Zorgax bot

```text
@MyZubsterZorgaxBot
```

Advantages:

- one identity;
- simpler operations;
- shared commands and context;
- lower credential/configuration overhead.

Recommended for the first implementation.

### Option B — multiple specialized bots

Examples could include bots dedicated to events, LIFE, Culture or Marketplace.

This should only be introduced when there is a concrete product reason. Specialized bots must still call the shared MyZubster/Zorgax core instead of copying prompts and business logic.

## 22. Observability

Use a dedicated log prefix, for example:

```text
[telegram-zorgax]
```

Useful structured fields:

```text
event=update_received
updateType=message|callback_query|...
source=private|group|supergroup
mode=zorgax|deterministic
intent=comic|seller|metaverse|culture|...
mediaRequested=true|false
mediaSent=true|false
deduplicated=true|false
responseSent=true|false
```

Do not log:

- bot tokens;
- webhook secrets;
- full private message history by default;
- unnecessary Telegram user PII;
- private file URLs.

## 23. Deduplication and idempotency

Telegram updates have an `update_id`. The bridge should use it as the primary deduplication key.

A warm-instance TTL cache can be used for the first implementation, matching the Messenger approach, but production scale may eventually justify a distributed idempotency store.

Do not assume webhook delivery is exactly once.

## 24. Failure handling

If Zorgax fails:

```text
I can't complete that request right now. You can continue on MyZubster: https://www.myzubster.com/
```

The exact user-facing copy should follow the user's language and remain short.

If Telegram media sending fails, retry only according to a bounded policy and then degrade to text.

If a deterministic MyZubster route is unavailable, do not ask the LLM to invent a replacement URL.

## 25. Rate limiting and abuse controls

Before broad public launch, add channel-level protections:

- per-chat/user request limits;
- global concurrency limits for Zorgax calls;
- bounded retry policy;
- maximum accepted message size;
- group mention/command gating;
- spam and duplicate suppression;
- temporary degradation to deterministic help links when AI capacity is unavailable.

Rate-limit responses should remain useful and not expose internal infrastructure details.

## 26. Privacy and identity

Telegram identifiers must not automatically become MyZubster account identities.

If account linking is introduced later, it should use an explicit authenticated flow:

```text
Telegram user
    ↓
/link command
    ↓
short-lived MyZubster authorization URL
    ↓
user authenticates on MyZubster
    ↓
explicit consent to link
    ↓
server-side link record
```

Never link accounts solely because usernames, display names or phone numbers appear similar.

## 27. Proposed implementation phases

### Phase 1 — private-chat MVP

- create Telegram bot through the official Bot management flow;
- configure production webhook and secret;
- implement `/status` and webhook routes;
- normalize private text and commands;
- connect to Zorgax;
- reuse canonical destinations and commercial grounding;
- add deduplication and logs;
- test `/start`, Seller and Metaverse flows.

### Phase 2 — deterministic media and navigation

- Comic Universe `sendPhoto` route;
- inline keyboard navigation;
- Culture/Subculture routing when canonical routes exist;
- LIFE/event navigation;
- language-consistent fallbacks.

### Phase 3 — community/group mode

- mention/command-only group operation;
- admin-controlled enablement;
- group-safe context isolation;
- event-specific public deep links;
- moderation/abuse controls as needed.

### Phase 4 — cross-channel continuity

Evaluate a privacy-safe MyZubster conversation/session layer that can support Messenger, Telegram and future channels without equating platform identities automatically.

## 28. Production smoke tests

### Start

```text
/start
```

Expected: short Zorgax/MyZubster introduction and useful navigation.

### Natural language

```text
Ciao Zorgax
```

Expected: Italian response.

### Seller context

```text
Voglio diventare Seller
Quanto costa?
```

Expected: second message retains short-term Seller context and uses grounded commercial information.

### Metaverse

```text
Portami nel Metaverse di MyZubster
```

Expected: grounded explanation and canonical Metaverse destination.

### Comic

```text
Mostrami il fumetto di MyZubster
```

Expected: approved public image attempted via Telegram plus Comic Universe link and FICTION / CONCEPT semantics where relevant.

### Culture

```text
Come posso continuare a parlare con le persone dopo un evento?
```

Expected: Zorgax explains available MyZubster community/Culture paths without inventing a Culture or event that has not been created.

### Duplicate update

Replay the same `update_id` in a controlled test.

Expected: no duplicate user-facing response.

## 29. Deployment checklist

Before enabling the webhook in production:

- Bot Token stored securely in production environment;
- webhook secret generated and stored securely;
- status endpoint does not expose secrets;
- webhook endpoint deployed over HTTPS;
- secret validation tested;
- deduplication tested;
- basic Zorgax response tested;
- Seller grounding tested;
- Metaverse link tested;
- Comic media/fallback tested;
- logs inspected for token/PII leakage;
- group behavior disabled or explicitly gated;
- rollback procedure identified.

## 30. Incident checklist

If the bot stops replying:

1. verify production deployment health;
2. check `/api/telegram/zorgax/status`;
3. inspect `[telegram-zorgax]` runtime logs;
4. confirm Telegram webhook configuration;
5. verify the webhook secret validation path;
6. verify Bot Token validity without exposing it;
7. separate inbound webhook failure from outbound Bot API failure;
8. test a deterministic command such as `/help`;
9. test Zorgax separately if transport is healthy;
10. rollback the latest bridge change if a regression is confirmed.

## 31. Credential rotation

If `TELEGRAM_BOT_TOKEN` is exposed:

- revoke/regenerate it through the official Telegram bot-management flow;
- update the production secret store;
- redeploy/restart as required;
- verify outbound API calls;
- inspect repository history, logs and public posts for exposure;
- do not restore the compromised value.

If `TELEGRAM_WEBHOOK_SECRET` is exposed:

- generate a new random secret;
- update production configuration;
- re-register the Telegram webhook with the new secret;
- verify valid requests succeed and the old secret fails.

## 32. Shared documentation strategy

The final documentation set should be organized as:

```text
docs/
  META_MESSENGER_ZORGAX_BRIDGE.md
  META_MESSENGER_OPERATIONS_RUNBOOK.md
  TELEGRAM_ZORGAX_BRIDGE_PLAN.md
```

After Telegram is implemented in production, add:

```text
TELEGRAM_ZORGAX_OPERATIONS_RUNBOOK.md
```

Do not describe the Telegram bridge as production-ready until the implementation, webhook security, smoke tests and deployment have actually been completed.

## 33. Architectural principle

The long-term goal is not:

```text
Facebook bot + Telegram bot + future bot + duplicated AI logic
```

It is:

```text
                       MyZubster
                           │
                        Zorgax
                           │
                  Shared Channel Core
                    /      |       \
             Messenger  Telegram  Future channels
```

This preserves one ecosystem, one application truth layer and one conversational guide while allowing people to enter from the communication platform they already use.

## 34. Definition of done for the first Telegram bridge

The first production milestone is complete when:

- a real Telegram user can message the official bot privately;
- the webhook validates the configured secret;
- duplicate updates do not generate duplicate replies;
- Zorgax answers in the user's language;
- Seller follow-up context works;
- known commercial facts are grounded;
- the Metaverse is reachable through the canonical route;
- Comic media is delivered or degrades safely to text;
- unsupported media receives an honest fallback;
- secrets and unnecessary PII do not appear in logs;
- operational documentation reflects the deployed implementation.

At that point Telegram becomes a second documented conversational gateway into MyZubster, alongside Facebook Messenger.
