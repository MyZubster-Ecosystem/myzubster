# MyZubster

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
Contributors can work on explicitly defined tasks with acceptance criteria and evidence requirements.

### 5. Verify
Evidence is reviewed against the task criteria. The existence of a photo, issue, PR or CID alone does not prove successful completion.

### 6. Publish
Public, sanitized information can be exposed as content-addressed snapshots through IPFS/IPNS. Sensitive or unnecessary personal information must stay out of public datasets.

### 7. Reward / settle
**MYZ currently represents an internal reward/accounting ledger.** It must not be described automatically as an on-chain payment. XMR or other external settlement remains separate and independently verified.

## Project status

**MVP / active development and validation, moving toward a first verifiable real-world pilot.**

| Area | Current status |
|---|---|
| Core observations / mapping | Development / validation |
| Bounty workflow | Development / validation |
| MYZ reward accounting | Internal ledger |
| IPFS/IPNS public snapshots | Development / integration |
| Gateway / external settlement | Separate integration boundary |
| AI / automation | Development / experimental |
| IoT / robotics | Prototype / experimental |
| Zorgax LIFE evidence automation | Specification complete; implementation tracked |
| LIFE 2027 | Pre-candidature / consortium and pilot development |
| Real-world environmental pilot | Partner/data discovery; site not yet formally selected |

The execution principle remains:

```text
BUILD → STABILIZE → VERIFY → DEMONSTRATE → PILOT → SCALE
```

## Public community activity

MyZubster now maintains a public, evidence-first view of attributable GitHub participation: [Public GitHub Community Activity](docs/PUBLIC-COMMUNITY-ACTIVITY.md).

The page records only interactions supported by public repository evidence (for example PRs, issues/reports or attributable review activity). **Passive repository visitors are not identified**, and website analytics must not be used to deanonymize them.

Current public evidence includes external contributions from `Aming9303` and `Luzijano`, a public security interaction from `Cub4nH1`, and additional publicly documented contributor/review activity. The adoption scorecard deliberately distinguishes contribution from stronger claims such as independent integration, deployment or verified adoption.

## 🌱 LIFE 2027 — work completed and current direction

MyZubster is preparing a **LIFE 2027-aligned environmental pilot architecture**. This work is preparatory: it does not imply LIFE funding, EU endorsement, an approved application or a formally completed consortium.

### Completed / documented

- LIFE concept and consortium work has been moved to the **2027 planning horizon**, with the official call/topic/deadline still to be confirmed from authoritative LIFE sources.
- A working **LIFE concept note**, consortium-role matrix, technical/data architecture, scientific briefing and decision agenda have been prepared for partner discussions.
- The technical pilot flow has been defined around auditable evidence rather than unverified impact claims.
- Six LIFE operational character/role archetypes have been documented for the MyZubster workflow: Scientific Coordinator, Water Data Steward, Technical Data Validator, Replication & Policy Lead, Pilot Operator and Mediterranean Replication Partner.
- Visual documentation for the LIFE character layer has been added under `docs/life-2026/characters/` as historical/working material while the active planning horizon moves to LIFE 2027.
- The **Zorgax LIFE Automation v1** specification has been created and implementation is tracked in issue #713.
- The **ChatGPT × Zorgax automation v2** research/routing specification is tracked in issue #714.
- LIFE-oriented technical bounties/specifications cover baseline/KPI evidence, IoT sensing, human-in-the-loop validation, automation safety, environmental dashboards and pilot replication.
- A reusable Agrosistemi data-onboarding specification has been prepared to turn partner data availability into schemas, provenance, validation rules, governance and a first controlled ingestion test.

### Target technical evidence chain

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

Zorgax may automate bounded processing, routing, provenance and draft evidence, but it must not invent missing values, approve scientific claims, publish restricted partner data or replace human approval for consequential decisions.

### Consortium / territory status

Current work has progressed from generic partner discovery to concrete technical/scientific discussions. Public repository wording intentionally distinguishes **documented interest or discussion** from a formally executed partnership.

- **Agrosistemi:** written availability has been received to participate in the project work and systematically contribute data for development of the MyZubster database; exact datasets, rights, formats, validation responsibilities and final consortium role still require definition/formalization.
- **University/scientific track:** a scientific discussion is scheduled/underway to define methodology, KPI validation, pilot design and possible scientific coordination. A meeting or discussion is not represented here as a formal partnership until documented as such.
- **Other institutional/industrial contacts:** remain discussion/proposed tracks unless separately supported by verifiable agreement.
- **Pilot territory/site:** not yet represented as formally selected. The project intends to choose one primary pilot with an accessible stakeholder, minimum viable dataset, measurable KPI, manageable integration risk and an initial sandbox path.

### Next LIFE milestone

The immediate objective is not to add more speculative features. It is to demonstrate one controlled end-to-end pilot slice:

```text
partner-authorized sample data
        → Zorgax ingestion
        → provenance + validation
        → approved KPI/evidence record
        → human scientific/technical review
        → institutional dashboard/report
```

Phase 1 should use synthetic or explicitly authorized non-sensitive data. Real partner data must remain outside public GitHub unless publication rights and data-governance conditions are explicitly documented.

## What can be built with it?

Current and experimental tracks include mapping/GeoJSON datasets, environmental observations, verifiable media contributions, bounty workflows, IPFS/IPNS evidence snapshots, AI-assisted automation, IoT/sensors/robotics and controlled environmental pilot workflows.

Not every track is production-ready. Roadmap issues and documentation are not proof of deployed functionality.

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

Never commit real `.env` secrets, private keys, wallet seeds, production credentials or confidential partner datasets.

## Contribute

Contributors can run the project locally, report reproducible issues, improve tests/documentation/accessibility/translations, work on scoped issues/bounties and help build synthetic or explicitly authorized datasets.

Canonical bounty rules: [`BOUNTIES.md`](BOUNTIES.md) · Treasury: [`TREASURY.md`](TREASURY.md) · Rewards: [`REWARDS_LEDGER.md`](REWARDS_LEDGER.md)

## Safety, privacy and evidence

MyZubster is designed around public/authorized observation and verifiable contribution. Do not publish credentials, private keys, unnecessary personal/confidential information, sensitive locations, restricted-area/security details or material obtained without authorization. Public evidence must be sanitized before publication.

## LIFE references and repository work

Relevant implementation/work-planning issues include:

- #395 — execution roadmap: Stabilize → MVP → Pilot → Scale
- #510 — LIFE vertical slice: observation → registry → evidence → institutional dashboard
- #533 — pilot baseline, KPI & evidence framework
- #534 — IoT sensing & auditable environmental data adapter
- #535 — human-in-the-loop AI recommendation/intervention log
- #536 — automation safety & manual override layer
- #537 — environmental pilot dashboard & KPI evidence view
- #538 — pilot replication package
- #711 — LIFE stakeholder-character UI integration
- #713 — Zorgax LIFE Automation v1 implementation
- #714 — ChatGPT × Zorgax v2 research and automation implementation

Official LIFE information must be verified against European Commission/CINEA/Funding & Tenders sources before proposal claims or deadlines are treated as final.

## Documentation

- [🌍 Universal / Multilingual Guide](docs/i18n/README.md)
- [Ecosystem Architecture](docs/ECOSYSTEM.md)
- [Public GitHub Community Activity](docs/PUBLIC-COMMUNITY-ACTIVITY.md)
- [Bounty System](BOUNTIES.md)
- [Treasury Policy](TREASURY.md)
- [Rewards Ledger](REWARDS_LEDGER.md)
- [Public Discovery Timeline](docs/PUBLIC-TIMELINE.md)
- [Documentation Hub](https://github.com/MyZubster-Ecosystem/myzubster-docs)
- [Manuals](https://github.com/MyZubster-Ecosystem/myzubster-manuals)

## Roadmap direction

The current North Star is a reproducible public vertical slice plus **one real, measurable and authorized pilot**, with partner roles, KPI, provenance and evidence that can be independently reviewed.

## License

MIT License. See `LICENSE`.

---

**Transparency note:** MyZubster is an evolving project. Code, tests, CI and independently verifiable evidence take precedence over promotional descriptions. Proposed features are not released features; discussions are not partnerships; merges are not payments; and external settlement is not `PAID` until independently verified.