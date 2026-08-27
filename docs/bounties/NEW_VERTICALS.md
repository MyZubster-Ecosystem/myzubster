# MyZubster Bounties — New Verticals

Status: **PROPOSED framework**. This document extends the canonical [`BOUNTIES.md`](../../BOUNTIES.md) model to new pilot domains. It does **not** activate, fund, or promise payment for any bounty.

All lifecycle, evidence, privacy, treasury, review and settlement rules in the canonical bounty contract remain authoritative.

## Purpose

Use the same evidence-first bounty lifecycle across Media/Streaming, Sport/Fitness, Music/Festivals, and Culture/Creative pilots while keeping domain-specific acceptance criteria explicit.

Every bounty must still move through the canonical gates (`PROPOSED -> VALIDATED -> APPROVED -> ...`) and external settlement cannot be represented as funded or paid without the required treasury and independent settlement evidence.

## Shared bounty classes

1. **OBSERVE** — collect a bounded baseline or observation with provenance.
2. **REPORT** — transform source evidence into a reproducible KPI/report.
3. **ACT** — implement a narrowly defined improvement/intervention.
4. **VERIFY** — independently validate evidence, methodology, or result.
5. **REPLICATE** — document and test transfer of a verified method to another site/workflow.

A bounty should name its class, vertical, evidence source, acceptance criteria, privacy level, reviewer and reward/funding state.

## Media / Streaming

Suitable scopes:
- establish a reproducible workload/traffic/energy baseline;
- validate carbon/energy factors and their provenance;
- implement a bounded delivery, encoding, caching or workload optimization;
- compare before/after performance without claiming environmental impact beyond the measured evidence;
- independently reproduce a KPI calculation.

Required safeguards:
- no credentials, private analytics exports or user-level viewing histories in public evidence;
- aggregate/anonymize operational data;
- separate measured infrastructure data from modeled emissions factors;
- service-quality regressions must be reported, not hidden.

Example proposed bounty:

```yaml
vertical: media_streaming
class: VERIFY
objective: reproduce one streaming energy/carbon KPI from sanitized pilot evidence
acceptance: independent calculation matches the documented method within an approved tolerance
evidence: sanitized inputs + method/version + reproducible output
reward_state: UNFUNDED
```

## Sport / Fitness

Suitable scopes:
- venue/event energy, water, waste or mobility baselines;
- measurement or survey methodology validation;
- bounded reduction/reuse interventions;
- before/after KPI verification;
- replication packs for another club, venue or event.

Required safeguards:
- no participant health data or unnecessary personal data;
- mobility data must be aggregated and location precision minimized;
- photos/evidence must follow public/authorized-area and consent rules in `BOUNTIES.md`;
- safety-critical facility work is out of scope unless separately authorized and professionally supervised.

Example proposed bounty:

```yaml
vertical: sport_fitness
class: OBSERVE
objective: establish a sanitized venue waste baseline for a defined event window
acceptance: source records reconcile with category totals and documented sampling method
evidence: aggregate weights/counts + methodology + reviewer checklist
reward_state: UNFUNDED
```

## Music / Festivals

Suitable scopes:
- event energy, audience/artist travel, materials, food or waste evidence;
- reusable-production/material inventories;
- methodology for estimating bounded digital-delivery impacts;
- intervention verification at one event/site;
- replication documentation across venues/festivals.

Required safeguards:
- do not publish artist, staff or attendee travel/location data at individual level;
- distinguish measured consumption from estimates;
- vendor evidence must be authorized/sanitized;
- no copyrighted recordings, performances or protected creative assets are required as bounty evidence.

Example proposed bounty:

```yaml
vertical: music_festivals
class: ACT
objective: document and verify one reusable-material intervention at a pilot event
acceptance: baseline, intervention inventory and post-event reconciliation are complete
 evidence: sanitized material-flow records + authorized photos/documents
reward_state: UNFUNDED
```

## Culture / Creative

Suitable scopes:
- venue/production energy and material baselines;
- circular production/reuse inventories;
- logistics or procurement evidence models;
- audience-engagement measurement that does not expose personal data;
- verification and replication of a low-impact production practice.

Required safeguards:
- respect copyright, cultural rights, confidentiality and venue restrictions;
- do not require unpublished creative works as public evidence;
- distinguish operational sustainability evidence from artistic evaluation;
- sensitive collections, restricted spaces and security details are excluded from public bounty evidence.

Example proposed bounty:

```yaml
vertical: culture_creative
class: REPLICATE
objective: produce a reproducible circular-production evidence pack for a second venue
acceptance: second venue can apply the documented method and produce comparable sanitized KPIs
evidence: method + sanitized inventories + comparison report
reward_state: UNFUNDED
```

## Review tiers

- **Tier 1 — normal:** documentation, reproducibility, low-risk public/sanitized evidence; one authorized reviewer may be sufficient when the bounty says so.
- **Tier 2 — domain:** environmental KPI or methodology claims; require a named domain reviewer and explicit method/version evidence.
- **Tier 3 — sensitive:** location-sensitive, operationally sensitive, financial/settlement or other high-risk evidence; manual review and the stricter canonical controls apply.

The repository must not claim multi-reviewer enforcement unless the backend actually implements it.

## Reward policy

New-vertical bounties inherit the canonical funding rule:

- MYZ may be used only as the internal reward/accounting unit under the current platform truth;
- XMR/token/fiat components may be described only as intended components until a real ecosystem funding reservation and settlement rail exist;
- `UNFUNDED`, `PENDING` and `UNSETTLED` are valid states and must not be presented as `PAID`;
- founder or contributor personal finances are not automatic funding sources.

## Activation checklist

Before changing a proposed bounty to `ACTIVE`:

- [ ] stable issue/bounty ID exists;
- [ ] vertical and bounty class are named;
- [ ] deliverable and measurable acceptance criteria are explicit;
- [ ] evidence can be collected lawfully and safely;
- [ ] privacy/sensitivity classification is set;
- [ ] reviewer/review mode is identified;
- [ ] reward asset/accounting unit is explicit;
- [ ] funding state is truthful;
- [ ] deadline and winner count are explicit where applicable;
- [ ] no pilot partnership, funding or institutional endorsement is implied without evidence.

## Suggested labels

Domain labels:

`vertical:media` · `vertical:sport` · `vertical:music` · `vertical:culture`

Work labels:

`bounty:observe` · `bounty:report` · `bounty:act` · `bounty:verify` · `bounty:replicate`

State labels should remain consistent with the canonical lifecycle and must not substitute for backend truth.
