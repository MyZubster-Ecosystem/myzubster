# MyZubster Advertising & Marketing

Status: Operational guide
Date: 2026-08-23

This document explains how MyZubster advertising and marketing should be planned, published, measured and rewarded.

## Goals

MyZubster marketing should:

- explain the ecosystem clearly;
- attract contributors, testers, partners and users;
- promote real releases, documentation, pilots and community activity;
- collect measurable evidence about reach and engagement;
- reward verified contributor work with MYZ;
- avoid exaggerating technical maturity, partnerships, adoption or economic value.

## What can be promoted

Preferred promotional subjects include:

- MyZubster ecosystem and open-source development;
- verified product or feature releases;
- Google TV / Android TV debug and prerelease builds, clearly labeled as such;
- Zorgax features and documented experiments;
- environmental, botanical, civic and community workflows;
- contributor opportunities and bounties;
- public documentation, GitHub releases and verified project milestones.

Concept visuals may be used for storytelling only when clearly marked as illustrative, AI-generated or `CONCEPT-NOT-EVIDENCE` where applicable.

## Channels

### Organic

Typical channels:

- X / Twitter;
- Instagram;
- Facebook;
- LinkedIn;
- DEV Community;
- GitHub;
- YouTube;
- Telegram / Discord / community channels.

### Paid advertising

Paid campaigns may use platforms such as Meta Ads, Google/YouTube Ads or other approved channels. External advertising spend is tracked in fiat separately from MYZ rewards.

A paid campaign must define its budget and owner before launch. MYZ rewards do not automatically reimburse advertising spend.

## Campaign lifecycle

Every campaign should follow this sequence:

1. **DEFINE** — objective, audience, channel, destination URL and time window.
2. **VERIFY ASSETS** — confirm that claims and visuals match current project evidence.
3. **DECLARE KPI** — define what success means before publishing.
4. **PUBLISH / LAUNCH** — publish organic content or start the approved paid campaign.
5. **COLLECT EVIDENCE** — URLs, screenshots and platform analytics.
6. **VERIFY** — review evidence, traffic quality and compliance.
7. **REWARD** — record approved MYZ rewards under `docs/MYZ_ADS_BOUNTY.md`.
8. **LEARN** — compare channels, creatives and outcomes, then update the next campaign.

## Campaign brief template

```yaml
campaign_id: MYZ-CAMPAIGN-001
name: MyZubster Google TV Debug Build
owner: github-user
channels:
  - x
  - instagram
objective: awareness-and-downloads
audience:
  - android-tv-developers
  - open-source-builders
destination_url: https://github.com/MyZubster-Ecosystem/myzubster
start_date: 2026-08-23
end_date: 2026-08-30
paid_budget_eur: 0
kpis:
  - verified_views
  - valid_clicks
  - release_downloads
myz_rewards_policy: docs/MYZ_ADS_BOUNTY.md
status: planned
```

## Content types

### Product / release

Use when a real build, release or documented feature exists. Include the exact status: production, beta, prerelease, debug build, experimental or concept.

### Educational

Explain how MyZubster works: evidence, verification, maps, environmental data, community workflows, Zorgax, marketplace or other documented systems.

### Community

Invite contributors, testers and creators. Link to the relevant public issue, bounty, repository or participation page.

### Storytelling / concept

Cyberpunk, comic or AI-generated visuals can be used to communicate vision and worldbuilding, but must not be used as evidence that a system, partnership, transaction, integration or deployment exists.

## Canonical vs concept assets

Before publication classify each asset:

- **CANONICAL / VERIFIED** — supported by current code, release, runtime or documentation evidence.
- **MARKETING / EXPLANATORY** — designed for communication but based on verified facts.
- **CONCEPT-NOT-EVIDENCE** — illustrative, future-facing, fictional or AI-generated; must carry a clear disclaimer.

Never remove the concept boundary merely to make an advertisement look stronger.

## KPIs

Choose only metrics relevant to the campaign. Examples:

- verified views / impressions;
- valid outbound clicks;
- click-through rate;
- GitHub visits;
- release downloads;
- qualified contributor sign-ups;
- qualified leads;
- meeting requests;
- video completion or watch metrics;
- community engagement.

Do not invent metrics. Save the platform source or sanitized screenshot needed to verify them.

## MYZ rewards

MYZ is the adopted internal reward/accounting unit for verified marketing contributions.

Current default rewards are defined in `docs/MYZ_ADS_BOUNTY.md`. Examples include rewards for public social posts, approved creatives, verified traffic, videos, qualified leads and successful KPI outcomes.

The flow is:

`CONTRIBUTION -> EVIDENCE -> VERIFICATION -> APPROVAL -> MYZ RECORD`

A contributor does not earn MYZ merely by claiming that work occurred.

## Paid campaigns and MYZ

Keep these two ledgers separate:

1. **External spend** — EUR/USD or other fiat paid to advertising platforms.
2. **MYZ rewards** — internal rewards for verified contributor activity.

Example:

- Meta campaign spend: EUR 50
- creator reward after verified deliverable: 15 MYZ
- 100 valid clicks verified: 20 MYZ

This does **not** mean EUR 50 is converted to MYZ or reimbursed in MYZ.

## Evidence package

For each reward-bearing publication, retain as applicable:

- public post URL;
- exact creative or asset reference;
- screenshot of publication;
- analytics screenshot/export;
- publication date;
- campaign ID;
- contributor ID;
- verifier decision;
- final approved MYZ amount.

Do not expose private contact data, account secrets, API keys, wallet seeds or other unnecessary sensitive information.

## Anti-abuse

Do not reward:

- fake followers, bots or click farms;
- purchased or manipulated engagement;
- self-clicking intended to inflate campaign results;
- spam or unsolicited bulk messaging;
- duplicate claims for the same evidence unless explicitly allowed;
- fake testimonials or endorsements;
- unverified partnership claims;
- invented technical states or adoption metrics;
- misleading claims about MYZ value or convertibility.

## Review before publishing

Use this checklist:

- [ ] Is the destination URL live and correct?
- [ ] Are all technical claims current?
- [ ] Is release maturity clearly stated?
- [ ] Are partners/organizations mentioned only with evidence?
- [ ] Are concept visuals labeled correctly?
- [ ] Are secrets and personal data absent?
- [ ] Are KPI and evidence requirements defined?
- [ ] Is any paid budget approved and tracked separately?
- [ ] Are MYZ reward rules defined before contributors act?

## Suggested weekly operating rhythm

- **Day 1:** choose message, audience and assets.
- **Day 2:** publish organic test content.
- **Day 3:** compare early metrics and comments.
- **Day 4:** start or adjust a small paid test if approved.
- **Day 5-6:** collect evidence and optimize the strongest creative.
- **Day 7:** verify metrics, approve eligible MYZ rewards and publish a short campaign retrospective.

## Reporting

A campaign retrospective should record:

```yaml
campaign_id: MYZ-CAMPAIGN-001
status: completed
spend_eur: 50
verified_views: 1500
valid_clicks: 140
qualified_leads: 2
myz_issued: 105
best_asset: MYZ-SOC-003-A
lessons:
  - technical visual produced higher click-through
  - concept creative generated engagement but required clearer disclaimer
```

Use real values only. If a metric is unavailable, mark it `unknown` rather than estimating it.

## Related policy

See [`../MYZ_ADS_BOUNTY.md`](../MYZ_ADS_BOUNTY.md) for the adopted MYZ reward schedule, verification standards, privacy rules and anti-abuse policy.
