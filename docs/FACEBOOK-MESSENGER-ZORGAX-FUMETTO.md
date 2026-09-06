# Facebook Messenger → MyZubster → Zorgax → Fumetto / Chronicle

MyZubster connects the public community entry points on Facebook and Messenger with the MyZubster production backend, Zorgax conversational assistance and the public Fumetto / Chronicle experience.

## What each component does

### Facebook page

The MyZubster Community Facebook page is a public discovery and community entry point. It can introduce people to the project, publish updates and direct users toward Messenger, the website, the open-source repository and the Chronicle.

A Facebook page or social login is an access/discovery layer only. It does not by itself prove identity, membership, partnership, authorization or adoption.

### Messenger bridge

Messenger messages are designed to enter MyZubster through the Meta webhook exposed by the production backend.

```text
FACEBOOK PAGE
     ↓
MESSENGER
     ↓
META WEBHOOK
     ↓
MYZUBSTER PRODUCTION
```

Public endpoints:

- Messenger webhook: https://www.myzubster.com/api/meta/messenger/webhook
- Messenger bridge status: https://www.myzubster.com/api/meta/messenger/status
- Main website: https://www.myzubster.com/

The bridge validates the Meta integration boundary and routes supported messages into the MyZubster application layer. Secrets such as the Meta page access token, app secret and webhook verification token remain environment-managed and are never committed to GitHub.

### Zorgax

Zorgax is the conversational and orchestration layer. Its role is to understand supported requests, explain MyZubster, help users navigate public resources and direct them toward relevant areas such as the Chronicle, Metaverse, Marketplace, LIFE-oriented documentation, GitHub or Telegram.

Conceptually:

```text
MESSENGER MESSAGE
      ↓
MYZUBSTER BACKEND
      ↓
ZORGAX
      ↓
CONTEXT / ROUTING / PUBLIC INFORMATION
      ↓
MESSENGER RESPONSE OR MYZUBSTER DESTINATION
```

Zorgax must not invent facts, partnerships, identities, event authorization, payments, measurements or evidence. Sensitive or consequential actions remain subject to the relevant authorization and human-review boundaries.

### Fumetto / Chronicle

The Fumetto, also described as the Chronicle, is a public visual and narrative entry point into the MyZubster ecosystem:

- https://www.myzubster.com/fumetto

It helps explain the project through visual storytelling and can act as a destination for users discovering MyZubster from Facebook, Messenger, Telegram or the main website.

The intended discovery flow is:

```text
FACEBOOK POST / PAGE
        ↓
     MESSENGER
        ↓
 MYZUBSTER BRIDGE
        ↓
      ZORGAX
        ↓
 EXPLAINS / GUIDES
   ↙      ↓       ↘
FUMETTO  SITE    GITHUB
          ↓
   OTHER PUBLIC AREAS
```

This means Facebook is not a separate MyZubster system. It is one of several community entry points into the same open ecosystem.

## Multi-channel community model

```text
FACEBOOK / MESSENGER ─┐
TELEGRAM BOT          ├──→ MYZUBSTER PRODUCTION ─→ ZORGAX
WEB / FUMETTO         ┤             │
GITHUB                ┘             ├──→ METAVERSE
                                    ├──→ MARKETPLACE
                                    ├──→ LIFE / PROJECTS
                                    └──→ PUBLIC DOCUMENTATION
```

Telegram entry points currently documented by the project:

- MyZubster Bot: https://t.me/myzubster_bot
- Flytek Raver Bot: https://t.me/FlytekRaverBot

Core repository:

- https://github.com/MyZubster-Ecosystem/myzubster

## Operational evidence vs. claims

Runtime requests observed on the Vercel-hosted production project can show that Messenger, social-auth, Zorgax, Stripe, Telegram and Metaverse endpoints are receiving application traffic. Request counts are not the same as unique visitors, adoption, successful conversations or verified partnerships.

The correct evidence model is therefore:

```text
REQUEST / WEBHOOK RECEIVED
        ↓
TECHNICAL ACTIVITY EVIDENCE
        ↓
END-TO-END RESPONSE VERIFIED
        ↓
FEATURE OPERATIONAL EVIDENCE

NOT automatically:
VISITOR = USER = CONTRIBUTOR = PARTNER
```

## Current status

MyZubster is an MVP under active development and validation. The Messenger bridge backend and public status endpoint exist in production, while full public end-to-end behavior must be described only when it has been independently verified under the current Meta configuration.

The goal is a connected community experience where a person can discover MyZubster on Facebook, continue through Messenger, receive guidance from Zorgax, explore the Fumetto/Chronicle and move into the wider open-source ecosystem without hiding the evidence and authorization boundaries behind the automation.
