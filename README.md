# MyZubster

<p align="center">
  <img src="assets/readme/myzubster-core.png" alt="MyZubster ecosystem overview" width="100%">
</p>

> **Open-source infrastructure for real-world observations, verifiable evidence, collaborative workflows, privacy-aware automation and reproducible pilots.**

MyZubster turns authorized real-world observations — photos, places, environmental data, services and technical contributions — into structured information that can be connected, reviewed, validated and reused.

**Current state:** MVP / active development and validation. Some components are operational, others experimental or in active implementation. A roadmap, issue, PR, merge, discussion or automated test is not by itself proof of deployment, partnership, adoption, funding or external payment.

## 👤 Daniel Ioni — Founder & Builder

Daniel Ioni (`DanielIoni-creator`) is the creator and lead builder of **MyZubster**, an open digital ecosystem focused on interoperability, immersive experiences, open-source development and the emerging **MyZubster LIFE 2027** initiative.

Alongside MyZubster development, public contribution work includes upstream pull requests or contribution branches involving **Vircadia World**, **Decentraland JS SDK Toolchain**, **Monero Docs** and experimental **WebXR Samples** work.

The contribution-first workflow is:

```text
STUDY → FORK → BUILD → TEST → UPSTREAM PR → REVIEW → INTEROPERABILITY
```

Open pull requests and fork branches are independent open-source contributions; they do **not** imply partnership, endorsement, affiliation, acceptance upstream or formal contributor status with the respective projects.

## 🧭 Start here

| I want to… | Start here |
|---|---|
| Understand MyZubster | This README → **How MyZubster works** |
| Join the community | [`JOIN.md`](JOIN.md) |
| Contribute code/docs/design | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Understand ecosystem architecture | [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) |
| Understand bounties | [`BOUNTIES.md`](BOUNTIES.md) |
| Understand internal rewards | [`REWARDS_LEDGER.md`](REWARDS_LEDGER.md) |
| Understand treasury boundaries | [`TREASURY.md`](TREASURY.md) |
| Read the XMR stagenet implementation status | [`docs/XMR-STAGENET-SETTLEMENT.md`](docs/XMR-STAGENET-SETTLEMENT.md) |
| See public community evidence | [`docs/PUBLIC-COMMUNITY-ACTIVITY.md`](docs/PUBLIC-COMMUNITY-ACTIVITY.md) |
| Submit independent evidence | [Community evidence issue #715](https://github.com/MyZubster-Ecosystem/myzubster/issues/715) |
| Follow globalization | [`docs/GLOBALIZATION_ROADMAP_2026_2028.md`](docs/GLOBALIZATION_ROADMAP_2026_2028.md) |
| Read multilingual docs | [`docs/i18n/README.md`](docs/i18n/README.md) |
| Follow public discovery/history | [`docs/PUBLIC-TIMELINE.md`](docs/PUBLIC-TIMELINE.md) |
| Explore documentation hub | [myzubster-docs](https://github.com/MyZubster-Ecosystem/myzubster-docs) |
| Read manuals | [myzubster-manuals](https://github.com/MyZubster-Ecosystem/myzubster-manuals) |
| Open the public website | [myzubster.com](https://www.myzubster.com/) |
| Explore DAO public area | [myzubster.com/dao](https://www.myzubster.com/dao) |
| Explore the Chronicle | [myzubster.com/fumetto](https://www.myzubster.com/fumetto) |

> 🌍 **Languages:** English · Italiano · Español · Français · Deutsch · Português · 中文 · 日本語 · 한국어 · العربية · हिन्दी · Русский · Türkçe · Bahasa Indonesia · Polski · Українська · বাংলা · اردو · فارسی · Kiswahili — see [`docs/i18n/README.md`](docs/i18n/README.md).

## ⚙️ How MyZubster works

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
                             │
                             ▼
                   Independent Verifier
```

## 💸 XMR stagenet settlement — active implementation

MyZubster now has a concrete implementation track for the first **verifiable Monero stagenet settlement** in [`MyZubsterGateway`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway).

Public implementation evidence:

- [`MyZubsterGateway#1403`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/1403) — P0 implementation / E2E validation gate;
- [`MyZubsterGateway#1404`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/1404) — runtime + tests for the first verifiable XMR stagenet path;
- [`docs/XMR-STAGENET-SETTLEMENT.md`](docs/XMR-STAGENET-SETTLEMENT.md) — canonical implementation-status document.

### Current runtime guarantees

The current Gateway implementation includes:

- **stagenet-only** gating for the first real E2E path;
- canonical positive integer **XMR atomic amount** handling;
- strict **64-hex TXID validation**;
- explicit separation between the transaction **submitter** and an **independent verifier**;
- submission logic that may produce `SUBMITTED`, but cannot self-declare `PAID`;
- fail-closed handling when verification is unavailable or invalid;
- recipient, amount, network and TXID consistency checks;
- minimum-confirmation enforcement;
- idempotent/replay-aware submission behavior;
- negative-path tests for malformed amount, wrong network, duplicate submit, missing verifier, verifier timeout, wrong recipient, wrong amount, wrong TXID and insufficient confirmations;
- a successful path to `PAID` only after independent evidence matches the expected settlement.

The settlement lifecycle is deliberately evidence-first:

```text
PENDING
  ↓
ACCEPTED
  ↓
SUBMITTED
  ↓
CONFIRMED
  ↓
PAID
```

Recovery/failure states may include `UNSETTLED`, `FAILED` and `DISPUTED`.

### Critical trust boundary

A wallet/provider response alone is **not** finality.

```text
AUTHORIZED SETTLEMENT INTENT
        ↓
SUBMITTER / WALLET RPC
        ↓
TXID
        ↓
INDEPENDENT VERIFIER
        ↓
MATCH NETWORK + RECIPIENT + AMOUNT + TXID + CONFIRMATIONS
        ↓
CONFIRMED
        ↓
PAID
```

If the verifier is unavailable, times out or returns inconsistent evidence, the settlement must remain non-final rather than inferring success.

### Automated validation status

On the current XMR implementation branch, the principal functional CI workflows have passed, including the main `CI`, `CI Boost`, quality and lint/typecheck checks. A separate performance workflow has reported a failure and is tracked independently rather than being represented as proof of settlement failure or success.

Automated tests prove behavior under the tested conditions. They do **not** prove that a real external transaction has already happened.

### Next gate: real stagenet E2E

The next milestone is to wire the runtime contracts to:

1. an authorized `monero-wallet-rpc` configured for **stagenet**;
2. a separately configured read-only / independent verification source;
3. one tiny-value real stagenet transaction;
4. a sanitized evidence package proving the lifecycle without publishing wallet seeds, private keys, passwords or other secrets.

Until that real transaction is executed and independently verified, the correct status is:

> **runtime + automated tests implemented; real stagenet transaction still pending validation.**

Mainnet is explicitly outside this milestone. Passing stagenet tests is not authorization to activate production/mainnet settlement.

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

Public GitHub contribution does not require a private invitation. Contributors may participate using a public alias, subject to GitHub and project rules.

Contribution paths include:

- 🧑‍💻 **Develop** — code, tests, API, frontend/backend, DevOps, documentation;
- 🎨 **Create** — UX, visuals, characters, storytelling, translations;
- 📷 **Observe** — authorized/public observations and provenance-aware media;
- 🔬 **Research** — datasets, environment, IoT, GIS, privacy and technical verification;
- 🧪 **Test** — reproduce bugs and workflows, accessibility and usability;
- 🌎 **Participate** — start with [`JOIN.md`](JOIN.md) and a small public mission.

Participation is voluntary. A contribution, character, issue or PR does not automatically imply employment, partnership, payment or endorsement.

## 🤝 External upstream contributions

MyZubster follows a **contribute first, integrate second** approach when interacting with independent open-source ecosystems. These entries are public technical contributions or contribution branches; they do **not** imply partnership, endorsement, affiliation or adoption.

| Upstream project | Contribution | Public evidence | Current evidence status |
|---|---|---|---|
| **Vircadia World** | Documentation clarifying external integration boundaries, API separation, identity boundaries, licensing and reproducible provenance. | [vircadia/vircadia-world PR #17](https://github.com/vircadia/vircadia-world/pull/17) | **Upstream PR open / under review** |
| **Decentraland JS SDK Toolchain** | Fix preserving CRDT state-sync retries when a state response comes from a non-authoritative peer, with a regression test. | [decentraland/js-sdk-toolchain PR #1556](https://github.com/decentraland/js-sdk-toolchain/pull/1556) | **Upstream PR open / review required** |
| **Monero Docs** | Wallet RPC documentation clarification for the `get_transfers` `pending` parameter. | [monero-project/monero-docs PR #389](https://github.com/monero-project/monero-docs/pull/389) | **Upstream PR open / checks + review pending** |
| **Immersive Web / WebXR Samples** | Experimental `visibility-mask-change` sample work prepared in a fork branch. | [`feat/visibility-mask-change-sample`](https://github.com/DanielIoni-creator/webxr-samples/tree/feat/visibility-mask-change-sample) | **Fork branch prepared; no upstream PR claimed** |

```text
FORK / BRANCH
    ↓
UPSTREAM PR SUBMITTED
    ↓
UPSTREAM REVIEW
    ↓
UPSTREAM ACCEPTED / MERGED
```

Only the final state may be described as accepted upstream.

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

## 📰 Independent external mentions

Public third-party discovery is tracked separately from MyZubster-owned publications and upstream contribution status. These references are public discovery evidence, not proof of partnership or technical validation.

| External source | Independent mention | Evidence |
|---|---|---|
| **KMP Weekly** | Listed **“📱 NFC Payments in MyZubster: A Complete Guide”** in its Kotlin Multiplatform news/tutorial feed. | [KMP Weekly](https://kmpweekly.com/) |
| **Shamyl Bin Mansoor — DEV Community** | Published **“From Robot Photos to 3D Meshes: Building a Photogrammetric Reconstruction Pipeline with MyZubster Robots”**. | [DEV profile](https://dev.to/shamylbm) |
| **kuroji — Zenn** | An independent OSS-bounty scanner analysis reported strong MyZubster representation in its no-explicit-cash-amount ranking before per-repository capping. | [Zenn article](https://zenn.dev/kuroji/articles/oss-bounty-122-to-8) |
| **GyaanSetu Javascript — LinkedIn** | Presented MyZubster as a real-world visual map using photo → repository → geographic/GPS data → public gallery flows. | [LinkedIn post](https://www.linkedin.com/posts/gyaansetu-javascript_%F0%9D%97%95%F0%9D%98%82%F0%9D%97%B6%F0%9D%97%B9%F0%9D%97%B1%F0%9D%97%B6%F0%9D%97%BB%F0%9D%97%B4-%F0%9D%97%A0%F0%9D%98%86%F0%9D%97%AD%F0%9D%98%82%F0%9D%97%AF%F0%9D%98%80%F0%9D%98%81%F0%9D%97%B2%F0%9D%97%BF-%F0%9D%97%AE%F0%9D%98%80-activity-7495442870036819968-dVyV) |
| **ShipRadar** | Indexed MyZubster bounty/program opportunities. Third-party USD/payout labels are not authoritative MyZubster evidence. | [ShipRadar](https://shipradar.com/) |

External mentions are treated as **public discovery evidence**, not as proof of deployment, partnership, endorsement or independent technical reproduction unless stronger reproducible evidence is available.

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
| External upstream contributions | Public evidence tracked; open PRs are not treated as accepted upstream |
| Bounty workflow | Development / validation |
| MYZ reward accounting | Internal ledger |
| **XMR settlement runtime** | **Implemented on stagenet validation branch with automated negative-path verification tests** |
| **Real XMR stagenet E2E** | **Next validation gate; real tiny-value transaction not yet claimed complete** |
| **XMR mainnet settlement** | **Not activated / outside current milestone** |
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

### Core repository

Requirements:

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

### Gateway / settlement implementation

```bash
git clone https://github.com/MyZubster-Ecosystem/MyZubsterGateway.git
cd MyZubsterGateway
npm ci
npm test
```

The active XMR implementation is tracked on `feat/xmr-stagenet-e2e` and PR #1404 until merged.

Never commit real `.env` secrets, credentials, private keys, wallet seeds, confidential datasets or restricted partner material.

## 🗂️ Repository / documentation map

### Community
- [`JOIN.md`](JOIN.md) — first contributor entry point
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution rules
- [`docs/PUBLIC-COMMUNITY-ACTIVITY.md`](docs/PUBLIC-COMMUNITY-ACTIVITY.md) — evidence-first public participation
- [Issue #715](https://github.com/MyZubster-Ecosystem/myzubster/issues/715) — submit independent evidence

### Architecture, rewards & settlement
- [`docs/ECOSYSTEM.md`](docs/ECOSYSTEM.md) — ecosystem architecture
- [`BOUNTIES.md`](BOUNTIES.md) — bounty rules
- [`REWARDS_LEDGER.md`](REWARDS_LEDGER.md) — reward-accounting model
- [`TREASURY.md`](TREASURY.md) — treasury policy/boundaries
- [`docs/XMR-STAGENET-SETTLEMENT.md`](docs/XMR-STAGENET-SETTLEMENT.md) — XMR stagenet implementation, verification and mainnet gate
- [`MyZubsterGateway#1403`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/issues/1403) — real stagenet E2E validation issue
- [`MyZubsterGateway#1404`](https://github.com/MyZubster-Ecosystem/MyZubsterGateway/pull/1404) — XMR runtime + automated tests

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

For external settlement specifically:

- never commit wallet seeds or spend keys;
- keep wallet/RPC credentials out of repositories;
- do not expose unrestricted wallet RPC endpoints;
- keep mainnet disabled unless separately authorized and reviewed;
- never treat a DB state, issue closure, merge or provider response as payment proof;
- require independent transaction verification before `PAID`.

## 🧩 What counts as proof?

MyZubster uses an evidence ladder:

```text
CLAIM
  < DOCUMENTED IMPLEMENTATION
  < REPRODUCIBLE TEST
  < INDEPENDENT REPRODUCTION
  < AUTHORIZED REAL-WORLD PILOT
```

For external XMR settlement, use the more specific ladder:

```text
IMPLEMENTED
    ↓
AUTOMATED TESTS PASS
    ↓
STAGENET RUNTIME WIRED
    ↓
REAL STAGENET TX SUBMITTED
    ↓
INDEPENDENTLY VERIFIED
    ↓
REPRODUCIBLE E2E EVIDENCE
```

Repository code and tests take precedence over promotional descriptions. Discussions are not partnerships. Merges are not payments. Internal reward accounting is not external settlement. A roadmap milestone is not a completed milestone until evidence exists.

## License

MIT License. See [`LICENSE`](LICENSE).

---

### MyZubster North Star

> **One reproducible public vertical slice, one real measurable authorized pilot, one public replication protocol, then independent international replication.**

**Build in public. Verify independently. Replicate responsibly.**