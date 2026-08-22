# MyZubster
## 🌐 How the full MyZubster ecosystem works

MyZubster is evolving into a distributed open-source ecosystem that connects real-world observations, personal identity, verified skills and work, blockchain ownership, digital assets, privacy-aware infrastructure and persistent virtual worlds.

The complete public architecture is documented here:

👉 [MyZubster Full System Architecture](docs/system/README.md)

The system currently connects or explores:

- 🪪 decentralized personal identity and verified wallets;
- 🧑‍💻 skills, work, contributions and bounty evidence;
- 📱 Android mobile access for work, skills and field activity;
- 🪙 MYZ economy and blockchain token infrastructure;
- 👽 MyZubster Character NFTs and digital identity;
- 🛒 NFT marketplace with on-chain payment and ownership verification;
- 🎨 comics, visual stories and creator economy;
- 🔐 escrow and independently verified settlement layers;
- 🪙 Monero/XMR privacy-oriented settlement tracks;
- 🧅 Tor / Onion access and distributed service discovery;
- 📦 IPFS / IPNS public and content-addressed distribution;
- 🌍 mapping, biodiversity and real-world observations;
- 🤖 AI, robotics, IoT and automation;
- 🌌 metaverse / multiverse identity, assets and persistent ownership;
- 🧩 an open-source multi-repository architecture designed for community contribution.
Android mobile direction

The Android application is intended to make MyZubster usable in real-world work and contribution scenarios.

The mobile workflow is designed around:

PROFILE
  ↓
SKILLS
  ↓
WORK / BOUNTIES
  ↓
FIELD EVIDENCE
  ↓
VERIFICATION
  ↓
SKILL HISTORY
  ↓
REWARD / SETTLEMENT

The Android client is intended to progressively provide access to:

personal identity and profile;
skills and verified work history;
available tasks and bounties;
photos, observations and field evidence;
contribution verification;
MYZ balances and rewards;
verified blockchain wallets;
Character NFTs and owned digital assets;
marketplace activity;
decentralized and privacy-aware services where appropriate.

Mobile components must clearly distinguish between functionality that is already released and functionality that remains under development.

Transparency and maturity

MyZubster intentionally distinguishes between:

✅ verified / tested functionality;
🚧 development functionality;
🧪 experimental infrastructure;
🗺️ future roadmap components.

Open-source documentation, code, tests and independently verifiable evidence take precedence over promotional claims.

The objective is to make the complete architecture publicly understandable and reproducible without exposing private keys, wallet seeds, credentials, infrastructure secrets or unnecessary personal information.


### System flow

```text
REAL WORLD
    ↓
IDENTITY
    ↓
SKILLS / WORK / CONTRIBUTIONS
    ↓
VERIFICATION
    ↓
MYZ / REWARDS / SETTLEMENT
    ↓
NFT ASSETS
    ↓
MARKETPLACE
    ↓
METAVERSE / MULTIVERSE
<p align="center">
  <img src="assets/readme/myzubster-core.png" alt="MyZubster ecosystem overview" width="100%">
</p>

> **Open-source infrastructure for connecting real-world observations, verifiable evidence, collaborative bounties and privacy-aware digital workflows.**

MyZubster is an evolving open-source ecosystem that turns observations from the real world — photos, places, environmental data, services and technical contributions — into structured, reviewable and reusable information.

The project connects **mapping, evidence, bounties, IPFS/IPNS, AI/automation, IoT/robotics and optional external settlement layers** while keeping verification, privacy and safety boundaries explicit.

> 🌍 **Multilingual documentation:** [English · Italiano · Español · Français · Deutsch · Português · 中文 · 日本語 · 한국어 · العربية · हिन्दी · Русский · Türkçe · Bahasa Indonesia · Polski · Українська · বাংলা · اردو · فارسی · Kiswahili](docs/i18n/README.md)

## Why MyZubster?

A photo can be more than a photo. A contribution can be more than a GitHub issue. MyZubster explores a workflow where real-world observations can become structured evidence, be connected to collaborative tasks, reviewed, published as sanitized public data and — where explicitly defined — associated with platform rewards or independently verified external settlement.

```text
OBSERVE → DOCUMENT → CONNECT → COLLABORATE → VERIFY → PUBLISH → REWARD / SETTLEMENT
```

## How it works

![How MyZubster works](assets/readme/how-it-works.png)

```text
users / contributors
       |
       v
   App / Web
       |
       v
 Core MyZubster
   |    |     |
   v    v     v
 map  bounty  observations/media
          \    /
           \  /
            v
       verification
            |
            v
    sanitized snapshots
        IPFS / IPNS

optional external settlement boundary:
Core → Gateway → payment/treasury → independent verifier
```

### 1. Observe
Document something useful from the real world: a public place, environmental observation, plant, urban service, technical experiment or other authorized contribution.

### 2. Document
Attach structured information such as captions, timestamps, permitted location data, media or other evidence required by a workflow.

### 3. Connect
Link the observation to the map, a project, dataset or bounty.

### 4. Collaborate

![MyZubster collaborative voting](assets/readme/myzubster-vote.png)
Contributors can work on explicitly defined tasks with acceptance criteria and evidence requirements.

### 5. Verify
Evidence is reviewed against the task criteria. The existence of a photo, issue, PR or CID alone does not prove successful completion.

### 6. Publish
Public, sanitized information can be exposed as content-addressed snapshots through IPFS/IPNS. Sensitive or unnecessary personal information must stay out of public datasets.

### 7. Reward / settle
**MYZ currently represents an internal reward/accounting ledger.** It must not be described automatically as an on-chain payment. XMR or other external settlement, when a bounty explicitly defines it, remains a separate process and requires independent verification before it can be considered `PAID`.

## 🎨 Create a MyZubster comic — complete contributor workflow

MyZubster welcomes illustrators, designers, storytellers and AI-assisted creators. The goal is not simply to produce promotional art: a MyZubster comic should turn a **real, authorized observation, discovery, contribution or documented platform workflow** into an original visual story whose real-world evidence and fictional elements remain clearly distinguishable.

The current entry point for the core visual guide is [bounty #526 — “Come funziona MyZubster”](https://github.com/MyZubster-Ecosystem/myzubster/issues/526). The wider community program is maintained in [`MyZubster-Visual`](https://github.com/MyZubster-Ecosystem/MyZubster-Visual/issues/1).

### Step 1 — Choose what you want to create

You can create:

- a visual explanation of how MyZubster works;
- a cyberpunk story inspired by your own MyZubster discovery or contribution;
- a short Discovery Spark;
- a multi-page Discovery Episode;
- a connected Discovery Series;
- a world/character guide tied to documented discoveries;
- multilingual versions of an accepted visual story.

Do not invent a real platform capability, payment, partnership, user metric or environmental result merely for the story. Fiction is welcome, but it must be recognizable as fiction.

### Step 2 — Find or document the real connection

Before drawing, identify the source material. Examples include a public/authorized plant or environmental observation, a place, a garden, a technical contribution, a completed workflow, a public dataset, a robot/IoT experiment or another safe MyZubster-related discovery.

Record only the evidence needed for the story. Remove unnecessary personal information, secrets, precise sensitive locations, wallet addresses, credentials and restricted-area details.

### Step 3 — Claim the bounty before starting

On the relevant GitHub issue, comment:

```text
CLAIM
Creator / public alias: <name>
Series/title: <working title>
Language: <language>
Style: <visual style>
Workflow: human-made / AI-assisted / mixed
Real MyZubster connection: <short description>
Planned deliverable: <pages/panels/assets>
First draft ETA: <date>
Rights/consent: I confirm I can submit the material used.
```

Wait for the maintainer to confirm that there is no conflicting active claim. For bounty #526, a first draft is recommended within **72 hours of an accepted claim**. If there is no update, the task may be reopened to another contributor.

### Step 4 — Plan the story

For the “How MyZubster works” comic, the seven stages should remain recognizable:

```text
OBSERVE
  ↓
DOCUMENT
  ↓
CONNECT
  ↓
COLLABORATE
  ↓
VERIFY
  ↓
PUBLISH
  ↓
REWARD / SETTLEMENT
```

A useful storyboard is:

1. **Observe** — the character finds or documents something useful in the real world.
2. **Document** — permitted photos/data/context become structured evidence.
3. **Connect** — the evidence is linked to the map, project, dataset or bounty.
4. **Collaborate** — contributors work against explicit acceptance criteria.
5. **Verify** — evidence is reviewed; existence of a file or PR alone is not proof of completion.
6. **Publish** — sanitized public information can become a reusable snapshot/dataset.
7. **Reward / settlement** — MYZ may record an internal reward; external settlement is a separate independently verified process.

### Step 5 — Create the visual

Human-made, AI-assisted and mixed workflows are allowed when the relevant bounty permits them. Regardless of tooling:

- create original material and respect copyright/licensing;
- keep characters, captions and UI readable on mobile as well as desktop;
- do not expose prompts/workflows containing secrets or private data;
- do not represent an AI-generated fictional screenshot as real evidence;
- keep real-world evidence visually or textually distinguishable from fictional/cyberpunk scenes;
- represent MYZ accurately as the current internal reward/accounting layer;
- represent XMR/token/external settlement, when relevant, as separate and independently verified.

For bounty #526, the expected minimum is **4–8 panels/pages plus a cover, or an equivalent highly readable visual composition**.

### Step 6 — Export everything needed for reuse

Unless the bounty says otherwise, provide:

```text
README/web version: PNG or WebP, optimized
High-resolution version: PNG or equivalent lossless/high-quality format
Editable source OR documented regeneration workflow
Author/rights/license note
Optional sanitized public evidence/CID
```

Suggested paths for the core comic are:

```text
docs/comic/myzubster-how-it-works.png
docs/comic/myzubster-how-it-works-hires.png
docs/comic/README.md
```

If AI tools were used, document enough of the workflow to allow maintainers to understand or regenerate the asset without publishing private credentials, private source material or unnecessary personal data.

### Step 7 — Self-review before submission

Check every item:

- [ ] I created/originally assembled the submitted work and can grant the required rights.
- [ ] The real MyZubster connection is explained.
- [ ] Real evidence and fictional narrative are distinguishable.
- [ ] The visual does not claim unreleased features as production-ready.
- [ ] MYZ is not presented as an automatic blockchain payment.
- [ ] Any external settlement is shown as a separate verified process.
- [ ] No secret, credential, private key, wallet seed or unnecessary personal data is present.
- [ ] No sensitive/restricted location or security detail is exposed.
- [ ] The visual is readable on desktop and mobile.
- [ ] Source files or regeneration instructions are included.
- [ ] Evidence/screenshots/render previews are ready for the PR.

### Step 8 — Submit through a pull request

Fork or branch the repository, add the assets and documentation, then open a PR. For bounty #526, include:

```text
Closes #526

Creator: <alias>
Workflow: human-made / AI-assisted / mixed
Real-world connection: <summary>
Assets added: <paths>
Rights/license: <summary>
Evidence: <links or repository paths>
```

In the PR description, walk through the acceptance criteria one by one. Include render previews/screenshots so reviewers do not have to reconstruct the asset locally just to understand the submission.

### Step 9 — Review and corrections

The maintainer checks architecture accuracy, readability, rights, privacy/safety, evidence and the bounty-specific criteria. A submission can move to `UNDER_REVIEW`, require changes, be verified or be rejected with reasons.

A merge by itself does **not** prove a reward or external payment.

### Step 10 — Reward lifecycle

The canonical lifecycle remains:

```text
PROPOSED
→ VALIDATED
→ APPROVED
→ FUNDED (when required)
→ ACTIVE
→ SUBMITTED
→ UNDER_REVIEW
→ VERIFIED / REJECTED
→ REWARD_RECORDED
→ SETTLEMENT_PENDING / SETTLED (only when applicable)
```

Current comic/community bounty amounts are **proposed definitions until the applicable approval and verification gates are satisfied**. MYZ is an internal reward/accounting ledger. An issue, claim, uploaded image, PR, merge, publication or ledger entry must never be presented as proof of an external payment.

### Quick start for a new comic contributor

```text
1. Open the comic bounty/program issue
2. Read scope + acceptance criteria
3. Comment CLAIM
4. Wait for claim confirmation
5. Document a safe real MyZubster connection
6. Storyboard the comic
7. Create original visuals
8. Export README + high-resolution assets
9. Add source/regeneration notes
10. Self-review privacy, rights and technical claims
11. Open PR + evidence
12. Respond to review
13. Verification happens
14. Reward is recorded only if all applicable gates pass
```

**Do not start from the assumption that a bounty is automatically paid. Start from the deliverable, evidence and verification criteria.**

## What can be built with it?

Current and experimental tracks include:

- 🗺️ real-world mapping and GeoJSON datasets;
- 🌱 environmental observations, biodiversity and urban-green workflows;
- 📷 verifiable photo/media contributions;
- 🎯 collaborative bounty workflows;
- 🧾 public evidence snapshots through IPFS/IPNS;
- 🔐 privacy-aware integrations and optional Monero/XMR settlement layers;
- 🤖 AI-assisted automation with human/security boundaries;
- 📡 IoT, sensors and robotics experiments;
- 🧑‍💻 open-source contributor workflows and integrations.

Not every track is production-ready. See **Project status** below.

## Project status

**MVP / active development and validation.**

MyZubster spans multiple repositories and maturity levels. Components may be production-oriented, under development, experimental, simulated or proposed. Documentation should never turn a roadmap item into a released feature merely because it appears in an issue or article.

| Area | Current documentation status |
|---|---|
| Core observations / mapping | Development / validation |
| Bounty workflow | Development / validation |
| MYZ reward accounting | Internal ledger |
| IPFS/IPNS public snapshots | Development / integration |
| Gateway / external settlement | Separate integration boundary |
| Monero/XMR | External settlement track; verify independently |
| AI / automation | Experimental + development tracks |
| IoT / robotics | Prototype / experimental tracks |
| LIFE 2026 work | Exploration / pre-candidature |

For repository boundaries and canonical architecture, see [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md).

## Quick start

### Requirements

- Node.js 20+
- MongoDB local or Atlas
- Python 3 for components that require it

```bash
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster
npm ci
npm test
npm run build --if-present
```

Use the repository's environment templates/placeholders where available. **Never commit real `.env` secrets, private keys, wallet seeds or production credentials.**

## Contribute

There are several ways to participate:

1. explore the repository and documentation;
2. run the project locally and report reproducible problems;
3. improve tests, documentation, accessibility or translations;
4. contribute to an open issue or bounty whose scope you understand;
5. submit a PR with evidence/tests appropriate to the task;
6. help improve datasets using only public or explicitly authorized observations.

![MyZubster contribution organization with Linear and Canvas](assets/readme/contribution-organization-linear-canvas.png)

### Bounties

![MyZubster bounty system](assets/readme/myzubster-bounty.png)

![Discuss, design and solve MyZubster bounties with MYZ](assets/readme/bounty-myz-discussion.png)

The canonical rules live in [`BOUNTIES.md`](BOUNTIES.md). Canonical public reward and settlement status lives in [`REWARDS_LEDGER.md`](REWARDS_LEDGER.md).

```text
PROPOSED
 → VALIDATED
 → APPROVED
 → FUNDED (when required)
 → ACTIVE
 → SUBMITTED
 → UNDER_REVIEW
 → VERIFIED / REJECTED
 → REWARD_RECORDED
 → SETTLEMENT_PENDING / SETTLED
```

A GitHub issue, assignment, PR, merge or application reward record **is not proof of an external payment**.

Security-related contributions require explicit authorization and responsible disclosure. Do not test third-party systems without permission.

## Safety, privacy and evidence

MyZubster is designed around public/authorized observation and verifiable contribution. Do not submit or publish:

- private keys, wallet seeds or credentials;
- unnecessary personal/confidential information;
- precise sensitive locations;
- restricted-area or security-system details;
- material obtained through unauthorized access;
- evidence requiring trespassing or bypassing access controls.

Public IPFS metadata must be sanitized before publication.

## External public sources & project history

MyZubster's public evolution has also been documented outside this repository. These sources are useful as a **public chronology of ideas and development claims**, but author publications do not replace code, tests, CI or independent verification.

### DEV Community — Daniel Ioni

- [Building MyZubster: An Open-Source Skill Exchange Platform with Monero Payments](https://dev.to/danielioni/building-myzubster-an-open-source-skill-exchange-platform-with-monero-payments-5dco)
- [I built a Monero payment platform with Admin Panel, WebSocket, and advanced security](https://dev.to/danielioni/i-built-a-monero-payment-platform-with-admin-panel-websocket-and-advanced-security-57ji)
- [MyZubster Architecture Deep Dive](https://dev.to/danielioni/myzubster-architecture-deep-dive-3fbi)
- [How I Integrated Kali Linux and DeepSeek (Local AI) to Build a Self-Defending Security Bot for MyZubster](https://dev.to/danielioni/how-i-integrated-kali-linux-and-deepseek-local-ai-to-build-a-self-defending-security-bot-for-47lk)
- [Building an AI Automation System for MyZubster](https://dev.to/danielioni/building-an-ai-automation-system-for-myzubster-4k2)

### LinkedIn

- [Public post on AI agents in the physical world and MyZubster](https://www.linkedin.com/posts/daniel-ioni-62b2b9423_github-danielioni-creatormyzubstergateway-activity-7485379054464835584-vEOI)

### External discovery

During August 2026, MyZubster content and/or bounty pages were observed in external indexes and aggregators including KMP Weekly, ContributeHub/Orion, TensorHack, JS Good First Issues Finder, TechForDev, Tech Spindle and other software/content discovery services. These are treated as **discovery signals only** — not evidence of endorsement, active users, partnerships, funding or completed settlement.

Notable external discovery signals include:

- **Zenn (Japan)** — an independent technical analysis of 122 OSS bounty opportunities referenced `MyZubster-Ecosystem` as a recurring source of indexed bounty issues and noted that, in one snapshot of its ranking, 8 of the top 10 results came from the organization. The analysis also highlighted that multiple bounty-labeled issues did not expose an explicit reward amount. This is a useful external quality signal: bounty pages should be machine-readable and transparent enough to show reward amount, currency/rail, funding state, eligibility, acceptance criteria, verification and settlement conditions.
- **JS Good First Issues Finder** — indexes MyZubster JavaScript contribution opportunities from repositories including `MyZubster-Marketplace` and `MyZubsterGateway`, providing an additional discovery path for first-time and external contributors.
- **ContributeHub / Orion** — indexed multiple MyZubster bounty opportunities across ecosystem areas, including EVA IONI, Arduino/IoT, urban-garden workflows, escrow and payment-related tasks, increasing discoverability among external open-source contributors.
- **TensorHack** — surfaced MyZubster development opportunities, including Monero/XMR wallet-related work and MyZubsterWeb bounties, showing that issue metadata is being consumed by additional external opportunity aggregators.
- **KMP Weekly** — indexed the MyZubster NFC payments guide in the Kotlin Multiplatform ecosystem, providing an external technical-community discovery signal beyond MyZubster-owned channels.
- **Tech Spindle** — indexed *Building an AI Automation System for MyZubster* as an automation project and assigned its own impact/innovation scoring. Because the page is derived from the original DEV publication, it is recorded as external indexing/classification rather than independent technical validation.
- **TechForDev** — indexed/re-published MyZubster material including *MyZubster is Now Live! A Decentralized Global Map for Plants and Animals* and, on 13 August 2026, *Urban Lab: Building a Smart Scooter with AI and Reinforcement Learning*. These pages provide additional propagation/discovery signals, but are treated as syndication rather than independent reporting.
- **WorldProgramming.org** — indexed/re-published *From Urban Gardens to Clean Streets: Building a Decentralized Robot Ecosystem with MyZubster and Monero*, adding another external content-discovery path while remaining derivative of the original publication.
- **WorldProgramming / WPS — TAZ DAY** — indexed/re-published *MYZUBSTER TAZ DAY — From Open Source to a Real-World Robotics Test in Riccione*, derived from a DEV Community publication dated **10 August 2026**. The item is recorded as evidence that the TAZ DAY concept/publication exists and that the project publicly framed it as a real-world robotics test. It is **not**, by itself, proof of a production-ready robot fleet, completed physical deployment or independently measured field result.
- **WorldProgramming / WPS — robot/space-sector article** — indexed/re-published *MyZubster: 36 Robot Projects, 119 XMR in Bounties, and a New Space Sector*, also derived from a DEV Community publication dated **10 August 2026**. The published figures — including **36 robot projects** and **119 XMR in bounties** — are treated here as **historical/publication claims or declared allocation/scope**, not as proof that 36 physical robots were built or that 119 XMR were funded, paid or independently verified. Any external settlement claim must be reconciled with canonical bounty records and independent settlement evidence before being described as `PAID`.

### Public-history interpretation rule

For historical articles, mirrors and syndicated posts, MyZubster uses the following distinction:

```text
ARTICLE / INDEX EXISTS
        ≠
IMPLEMENTATION VERIFIED
        ≠
PHYSICAL DEPLOYMENT VERIFIED
        ≠
REWARD RECORDED
        ≠
EXTERNAL SETTLEMENT VERIFIED / PAID
```

Numbers appearing in a historical publication may describe roadmap scope, software/project counts, proposed bounty pools, internal accounting, experiments or author-reported results. They must not be promoted into current canonical metrics unless the repository links them to reproducible evidence or an appropriate independent verifier.

Because external aggregators may automatically interpret GitHub issues, every public bounty should clearly state its **reward (or explicitly say that no external reward is committed), currency/payment rail, funding state, current status, acceptance criteria, eligibility, verification process and settlement conditions**. Indexing by an external service does not imply endorsement, funding, partnership or successful payment.

A further discovery signal was observed through **TriploHub / Central de Inteligência WebMCP**, which indexed Portuguese-language material describing the MyZubster MCP Server and its agent/automation, payment, robotics and IoT-related development claims. This is recorded as external indexing only and does **not** constitute independent validation of the implementation, adoption or partnership.

**Artemida.team** also surfaced MyZubster Robot material for a Russian-speaking audience through an automated DEV.to/RSS-style content ingest. This is recorded as an additional international discovery/mirroring signal, not as independent editorial coverage, endorsement or technical validation.

## LIFE 2026 exploration

MyZubster is exploring the EU **LIFE Programme 2021–2027** as a possible framework for environmental pilots involving observations, urban biodiversity, water/resource efficiency, IoT/robotics, geospatial evidence, citizen science and replication.

**Status: exploration / pre-candidature / partner discovery.** This repository does not claim LIFE funding, an approved application or an official EU/CINEA partnership.

Official references:

- [European Commission — LIFE Programme](https://commission.europa.eu/funding-and-tenders/find-funding/eu-funding-programmes/programme-environment-and-climate-action-life_en)
- [CINEA — LIFE](https://cinea.ec.europa.eu/programmes/life_en)
- [EU Funding & Tenders Portal — LIFE](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/programmes/life2027)

## Documentation

- [🌍 Universal / Multilingual Guide](docs/i18n/README.md)
- [Ecosystem Architecture](docs/ECOSYSTEM.md)
- [Bounty System](BOUNTIES.md)
- [Rewards Ledger](REWARDS_LEDGER.md)
- [Documentation Hub](https://github.com/MyZubster-Ecosystem/myzubster-docs)
- [Manuals](https://github.com/MyZubster-Ecosystem/myzubster-manuals)

## Roadmap direction

The long-term direction is to make MyZubster easier for someone new to discover, run, understand and contribute to: clearer onboarding, demonstrable workflows, visual documentation, stronger tests, interoperable public datasets and well-defined boundaries between experimental components and verified production capabilities.

## License

MIT License. See `LICENSE`.

---

**Transparency note:** MyZubster is an evolving project. Code, tests, CI and independently verifiable evidence take precedence over promotional descriptions. Proposed features are not released features; merges are not payments; external mentions are not partnerships; and settlement is not `PAID` until verified according to the applicable rail.
