# How the MyZubster Metaverse Works

> A canonical onboarding and measurement guide for MyZubster Metaverse.

MyZubster Metaverse is an open digital layer that connects the MyZubster ecosystem with interactive spaces, Space Station, missions, creator/marketplace experiences and community participation.

This page explains the intended user journey. It does **not** claim that the Metaverse is already widely adopted, fully decentralized, or understood by the general public. Those claims require measurable evidence.

## The journey

### 1. MyZubster

Start with MyZubster as the public ecosystem and identity/navigation layer. Users should be able to understand what the project is, what is live, and where authoritative documentation lives.

### 2. Metaverse

The Metaverse is the interactive layer. It can expose spaces, presence, characters, community experiences and interfaces to other MyZubster capabilities. Server-side systems remain authoritative for identity, inventory, payment and reward state.

### 3. Space Station

Space Station is a connected experimental and collaboration environment. It can host evidence-driven technical work, simulations, LIFE-oriented workflows, privacy experiments and other ecosystem modules. A prototype or experiment must be labelled as such rather than presented as production capability.

### 4. Missions and contribution

Missions can connect users to real work such as GitHub issues, documented tasks and eligible contribution opportunities. The authoritative issue or repository remains the source of truth. Client-side Metaverse actions must never fabricate completion, eligibility, bounty settlement or payment state.

### 5. Marketplace and creators

Creator and marketplace experiences can make services, digital goods and ecosystem projects discoverable inside immersive spaces. Listings, seller identity, prices, availability and payment state must come from authoritative MyZubster services rather than being invented by the Metaverse client.

### 6. Community spaces

Personal rooms, community spaces and events should build on explicit ownership, access control, moderation, capacity and lifecycle rules. Privacy and abuse controls come before growth-oriented realtime features.

## What a new user should understand

After this onboarding, a user should be able to explain that:

1. MyZubster is the broader ecosystem.
2. The Metaverse is an interactive interface into parts of that ecosystem, not a replacement for authoritative backend systems.
3. Space Station is a connected environment for experimentation and collaboration.
4. Missions connect virtual discovery to verifiable external work and evidence.
5. Marketplace experiences must reflect real listing and payment state.
6. Open source applies to eligible software, documentation and content—not to people, identities, cultures or third-party rights.

## Measuring understanding

MyZubster should measure understanding without unnecessary collection of personal data.

### Funnel

A privacy-respecting onboarding funnel should measure aggregate events such as:

- `metaverse_onboarding_view`
- `metaverse_space_station_open`
- `metaverse_missions_open`
- `metaverse_marketplace_open`
- `metaverse_contribution_docs_open`
- `metaverse_return_visit`

Do not include chat contents, authentication tokens, wallet secrets, private profile fields or unnecessary identifiers in analytics payloads.

### Success indicators

Track:

- visits to the canonical onboarding page;
- return rate where privacy-respecting measurement permits it;
- click-through from onboarding to Space Station, missions and marketplace;
- first meaningful interaction where technically measurable;
- contributor first-task completion without direct assistance;
- qualitative feedback about concepts users found clear or confusing.

Developer/contributor adoption and general-public adoption must be reported separately.

## Feedback questions

Useful lightweight questions include:

- What do you think the MyZubster Metaverse connects to?
- What is Space Station for?
- Where does authoritative mission or payment state come from?
- Which part of the onboarding was unclear?
- What would you try next: Space Station, missions, marketplace or community spaces?

Feedback should be optional and should not request sensitive information.

## Evidence rule

Do not publish claims such as “MyZubster is popular”, “users understand the Metaverse”, or “the Metaverse is decentralized” without current measurable evidence supporting the specific claim.

Prefer precise statements such as:

- contributor activity increased during a defined period;
- a documented number of users reached a specific onboarding step;
- a defined percentage of respondents correctly understood a concept;
- multiple independently operated nodes were technically verified.

## Related documentation

- [How MyZubster works](COME_FUNZIONA.md)
- [Architecture](ARCHITECTURE.md)
- [Contributor guide](CONTRIBUTORS.md)
- [Bounty board](BOUNTY-BOARD.md)
- [Open Knowledge Domains Framework](OPEN-KNOWLEDGE-DOMAINS-FRAMEWORK.md)
- [Open Source Religion & Belief Framework](OPEN-SOURCE-RELIGION-BELIEF-FRAMEWORK.md)

## Linear

Implementation and measurement work is tracked in **MYZ-54 — Measure whether users understand MyZubster Metaverse**.
