# MyZubster

<p align="center">
  <img src="assets/readme/myzubster-core.png" alt="MyZubster ecosystem overview" width="100%">
</p>

> **Open-source infrastructure for real-world observations, verifiable evidence, collaborative workflows, privacy-aware automation and reproducible pilots.**

MyZubster turns authorized real-world observations — photos, places, environmental data, services and technical contributions — into structured information that can be connected, reviewed, validated and reused.

**Current state:** MVP / active development and validation. Some components are operational, others experimental or specified for future implementation. A roadmap, issue or discussion is not proof of deployment, partnership, adoption or funding.

## 🧭 Start here — complete MyZubster index

| I want to… | Start here |
|---|---|
| Understand MyZubster | This README → **How MyZubster works** |
| Join the community | [`JOIN.md`](JOIN.md) |
| Contribute code/docs/design | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Find work / missions | [GitHub Issues](https://github.com/MyZubster-Ecosystem/myzubster/issues) |
| Submit independent evidence | [Community evidence issue #715](https://github.com/MyZubster-Ecosystem/myzubster/issues/715) |
| See public community evidence | [`docs/PUBLIC-COMMUNITY-ACTIVITY.md`](docs/PUBLIC-COMMUNITY-ACTIVITY.md) |
| Understand ecosystem architecture | [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) |
| Follow globalization | [`docs/GLOBALIZATION_ROADMAP_2026_2028.md`](docs/GLOBALIZATION_ROADMAP_2026_2028.md) |
| Read multilingual docs | [`docs/i18n/README.md`](docs/i18n/README.md) |
| Understand bounties | [`BOUNTIES.md`](BOUNTIES.md) |
| Understand internal rewards | [`REWARDS_LEDGER.md`](REWARDS_LEDGER.md) |
| Understand treasury boundaries | [`TREASURY.md`](TREASURY.md) |
| Follow public discovery/history | [`docs/PUBLIC-TIMELINE.md`](docs/PUBLIC-TIMELINE.md) |
| Explore documentation hub | [myzubster-docs](https://github.com/MyZubster-Ecosystem/myzubster-docs) |
| Read manuals | [myzubster-manuals](https://github.com/MyZubster-Ecosystem/myzubster-manuals) |
| Open the public website | [myzubster.com](https://www.myzubster.com/) |
| Explore DAO public area | [myzubster.com/dao](https://www.myzubster.com/dao) |
| Explore the Chronicle | [myzubster.com/fumetto](https://www.myzubster.com/fumetto) |

> 🌍 **Languages:** English · Italiano · Español · Français · Deutsch · Português · 中文 · 日本語 · 한국어 · العربية · हिन्दी · Русский · Türkçe · Bahasa Indonesia · Polski · Українська · বাংলা · اردو · فارسی · Kiswahili — see [`docs/i18n/README.md`](docs/i18n/README.md).

## ⚙️ How MyZubster works

![How MyZubster works](assets/readme/how-it-works.png)

An original seven-panel Italian field guide and high-resolution edition are available in
[`docs/comic/`](docs/comic/README.md).

The core operating model is:

```text
OBSERVE
   ↓
DOCUMENT
   ↓
CONNECT TO MAP / DATASET / MISSION
   ↓
COLLABORATE
   ↓
VERIFY EVIDENCE
   ↓
PUBLISH SANITIZED / AUTHORIZED OUTPUT
   ↓
REWARD ACCOUNTING
   ↓
OPTIONAL INDEPENDENT EXTERNAL SETTLEMENT
```

### 1 — Observe
A contributor records an authorized real-world observation: for example a public place, environmental measurement, plant, service, media contribution or technical test.

### 2 — Document
The observation is enriched with the information required by its workflow: timestamp, permitted location information, media, structured fields, source/provenance and supporting evidence.

### 3 — Connect
The record can be associated with mapping, a dataset, a project, a bounty/mission or another MyZubster workflow.

### 4 — Collaborate
Developers, researchers, designers, testers and other contributors can work through public issues and explicitly scoped tasks.

### 5 — Verify
Evidence is evaluated against stated acceptance criteria. A photo, issue, PR, CID, database row or automated output does **not** by itself prove successful completion.

### 6 — Publish
Only authorized and appropriately sanitized information should become public. Content-addressed publication through IPFS/IPNS is part of the ecosystem direction; confidential partner data and unnecessary personal information stay outside public datasets.

### 7 — Reward / settlement
`MYZ` currently represents internal reward/accounting logic. It must not automatically be represented as an on-chain payment. XMR or another external settlement mechanism is a separate boundary and requires actual independent verification.

## 🏗️ Architecture at a glance

```text
                    PEOPLE / CONTRIBUTORS
                             │
                    Web / App / GitHub
                             │
                             ▼
                      MYZUBSTER CORE
                ┌────────────┼────────────┐
                ▼            ▼            ▼
          Observations      Map       Missions/Bounties
                │            │            │
                └────────────┼────────────┘
                             ▼
                    Evidence / Provenance
                             │
                   ┌─────────┴─────────┐
                   ▼                   ▼
                Zorgax             Human Review
                   │                   │
                   └─────────┬─────────┘
                             ▼
                  Validated / Sanitized Output
                   ┌─────────┼─────────┐
                   ▼         ▼         ▼
               Dashboard   IPFS/IPNS  Reports
                             │
                  optional separate boundary
                             ▼
                Gateway / External Settlement
```

## 🤖 Zorgax — automation boundary

Zorgax is the automation/orchestration track of MyZubster. Its intended role is to help with bounded processing such as routing, schema checks, normalization, provenance preparation, anomaly detection and draft evidence.

For environmental/LIFE-oriented workflows:

```text
AUTHORIZED DATA / SENSORS
          ↓
        INGEST
          ↓
     SCHEMA CHECK
          ↓
    NORMALIZATION
          ↓
      PROVENANCE
          ↓
    DRAFT EVIDENCE
          ↓
   TECHNICAL REVIEW
          ↓
   SCIENTIFIC REVIEW
          ↓
    VALIDATED KPI
          ↓
 DASHBOARD / REPORTABLE EVIDENCE
```

Zorgax must not invent missing measurements, silently approve scientific claims, publish restricted partner data, authorize consequential governance actions or replace required human review.

Implementation planning is tracked in **#713 — Zorgax LIFE Automation v1** and **#714 — ChatGPT × Zorgax v2 research/automation**.

## 🏛️ DAO / governance

MyZubster exposes a public DAO/governance area at [myzubster.com/dao](https://www.myzubster.com/dao).

The governance direction separates:

```text
COMMUNITY INPUT
      ↓
PROPOSAL / EVIDENCE
      ↓
ZORGAX-ASSISTED PREPARATION
      ↓
HUMAN / GOVERNANCE REVIEW
      ↓
AUTHORIZED ACTION
```

Automation is assistance, not authority. Scientific validation, formal partnerships, treasury operations and other consequential decisions require explicit controls appropriate to the action.

## 🌍 Open Community

Public GitHub contribution does not require a private invitation. Contributors may participate using a public alias, subject to GitHub and project rules. An application account is only required for application functions that actually require authentication.

Contribution paths include:

- 🧑‍💻 **Develop** — code, tests, API, frontend/backend, DevOps, documentation;
- 🎨 **Create** — UX, visuals, characters, storytelling, translations;
- 📷 **Observe** — authorized/public observations and provenance-aware media;
- 🔬 **Research** — datasets, environment, IoT, GIS, privacy and technical verification;
- 🧪 **Test** — reproduce bugs and workflows, accessibility and usability;
- 🌎 **Participate** — start with [`JOIN.md`](JOIN.md) and a small public mission.

Participation is voluntary. A contribution, character, issue or PR does not automatically imply employment, partnership, payment or endorsement.

## 📊 Public evidence & adoption

MyZubster separates anonymous interest from attributable public participation and stronger adoption evidence.

```text
Website analytics
→ anonymous interest

GitHub PR / issue / review / reproducible test
→ attributable public participation

Independent reproduction / integration
→ stronger adoption evidence

Authorized real-world pilot
→ operational evidence
```

See [`docs/PUBLIC-COMMUNITY-ACTIVITY.md`](docs/PUBLIC-COMMUNITY-ACTIVITY.md) and submit reproducible external evidence through [issue #715](https://github.com/MyZubster-Ecosystem/myzubster/issues/715).

Passive visitors must not be deanonymized or correlated with GitHub identities without an explicit legitimate privacy-respecting basis.

## 🌱 LIFE 2027 direction

MyZubster is preparing an environmental pilot architecture toward a possible **LIFE 2027** pathway. This is pre-candidature work: it does **not** imply LIFE funding, European Commission/CINEA endorsement, an approved application or a completed consortium.

Completed/documented preparation includes:

- working concept note and consortium-role modelling;
- technical/data architecture and scientific briefing;
- KPI/provenance/evidence workflow;
- LIFE operational character/role archetypes;
- Zorgax LIFE automation specification;
- partner-data onboarding specification;
- IoT, validation, dashboard and replication work packages/issues;
- planning for one controlled end-to-end reference pilot.

Current discussions with scientific, technical, industrial and territorial actors must be described according to their actual documented status. Interest, meetings and data discussions are not represented as formal partnerships until formally agreed.

Target vertical slice:

```text
AUTHORIZED SAMPLE DATA
        ↓
ZORGAX INGESTION
        ↓
PROVENANCE + VALIDATION
        ↓
APPROVED KPI / EVIDENCE
        ↓
HUMAN SCIENTIFIC + TECHNICAL REVIEW
        ↓
INSTITUTIONAL DASHBOARD / REPORT
```

Real partner data must remain outside public GitHub unless publication rights and data-governance conditions explicitly permit publication.

## 🌐 Globalization roadmap 2026–2028

The public roadmap is [`docs/GLOBALIZATION_ROADMAP_2026_2028.md`](docs/GLOBALIZATION_ROADMAP_2026_2028.md).

```text
OPEN SOURCE
    ↓
OPEN COMMUNITY
    ↓
VERIFIED ITALIAN REFERENCE PILOT
    ↓
PUBLIC REPLICATION KIT
    ↓
FIRST INDEPENDENT INTERNATIONAL NODE
    ↓
MULTI-REGION REPLICATION
    ↓
INTERNATIONAL GOVERNANCE
    ↓
MYZUBSTER GLOBAL NETWORK
```

The March 2027 target is **one verifiable Italian vertical slice + a public Replication Kit + at least one external actor beginning an independent international reproduction**. This is a target, not a claim of completion.

## 📌 Project status index

| Area | Status |
|---|---|
| Core observations / mapping | Development / validation |
| Public website | Deployed / evolving |
| Open Community / contributor paths | Public |
| Community evidence page | Public |
| Bounty workflow | Development / validation |
| MYZ reward accounting | Internal ledger |
| IPFS/IPNS public snapshots | Development / integration |
| Gateway / external settlement | Separate integration boundary |
| Zorgax AI / automation | Development / experimental |
| DAO public surface | Public; governance implementation evolving |
| IoT / robotics | Prototype / experimental |
| LIFE evidence automation | Specified; implementation tracked |
| LIFE 2027 | Pre-candidature / consortium + pilot development |
| Environmental reference pilot | Partner/data discovery; site not formally selected |
| Global Replication Kit | Roadmap target |
| International independent node | Roadmap target; not yet claimed |

Execution principle:

```text
BUILD → STABILIZE → VERIFY → DEMONSTRATE → PILOT → REPLICATE → SCALE
```

## 🧪 Quick start for developers

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

Never commit real `.env` secrets, credentials, private keys, wallet seeds, confidential datasets or restricted partner material.

## 🗂️ Repository / documentation map

### Community
- [`JOIN.md`](JOIN.md) — first contributor entry point
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution rules
- [`docs/PUBLIC-COMMUNITY-ACTIVITY.md`](docs/PUBLIC-COMMUNITY-ACTIVITY.md) — evidence-first public participation
- [Issue #715](https://github.com/MyZubster-Ecosystem/myzubster/issues/715) — submit independent evidence

### Architecture & operation
- [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) — ecosystem architecture
- [`BOUNTIES.md`](BOUNTIES.md) — bounty rules
- [`REWARDS_LEDGER.md`](REWARDS_LEDGER.md) — reward-accounting model
- [`TREASURY.md`](TREASURY.md) — treasury policy/boundaries

### Internationalization & history
- [`docs/i18n/README.md`](docs/i18n/README.md) — multilingual documentation
- [`docs/GLOBALIZATION_ROADMAP_2026_2028.md`](docs/GLOBALIZATION_ROADMAP_2026_2028.md) — globalization roadmap
- [`docs/PUBLIC-TIMELINE.md`](docs/PUBLIC-TIMELINE.md) — public discovery timeline

### External documentation repositories
- [MyZubster Documentation Hub](https://github.com/MyZubster-Ecosystem/myzubster-docs)
- [MyZubster Manuals](https://github.com/MyZubster-Ecosystem/myzubster-manuals)

### LIFE / pilot implementation references
- #395 — Stabilize → MVP → Pilot → Scale
- #510 — LIFE vertical slice
- #533 — baseline, KPI & evidence framework
- #534 — IoT sensing & auditable environmental data adapter
- #535 — human-in-the-loop AI recommendation/intervention log
- #536 — automation safety & manual override
- #537 — environmental dashboard & KPI evidence
- #538 — pilot replication package
- #711 — LIFE stakeholder-character UI integration
- #713 — Zorgax LIFE Automation v1
- #714 — ChatGPT × Zorgax v2
- #715 — public independent evidence entry point

## 🔐 Safety, privacy & evidence rules

MyZubster is designed around public or explicitly authorized observation and verifiable contribution.

Do not publish:

- credentials, tokens or secrets;
- private keys or wallet seeds;
- unnecessary personal/confidential information;
- restricted partner datasets;
- sensitive locations or restricted-area/security information;
- material obtained or published without authorization.

Public evidence must be sanitized. Provenance should explain where information came from and under which conditions it may be used.

## 🧩 What counts as proof?

MyZubster uses an evidence ladder:

```text
CLAIM
  < DOCUMENTED IMPLEMENTATION
  < REPRODUCIBLE TEST
  < INDEPENDENT REPRODUCTION
  < AUTHORIZED REAL-WORLD PILOT
```

Repository code and tests take precedence over promotional descriptions. Discussions are not partnerships. Merges are not payments. Internal reward accounting is not external settlement. A roadmap milestone is not a completed milestone until evidence exists.

## License

MIT License. See [`LICENSE`](LICENSE).

---

### MyZubster North Star

> **One reproducible public vertical slice, one real measurable authorized pilot, one public replication protocol, then independent international replication.**

**Build in public. Verify independently. Replicate responsibly.**

**Transparency note:** Proposed features are not released features; discussions are not partnerships; merges are not payments; and external settlement is not `PAID` until independently verified.
