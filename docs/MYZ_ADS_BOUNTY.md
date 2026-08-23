# MyZubster Ads Bounty

Status: Draft program for review
Date: 2026-08-23

## Purpose

The MyZubster Ads Bounty rewards verifiable promotional contributions with MYZ inside the MyZubster ecosystem. It is designed for social posts, creative assets, videos, qualified traffic, and other measurable outreach work.

MYZ in this program is an internal MyZubster reward/accounting unit unless and until separate public documentation establishes otherwise. This document does not promise cash redemption, investment returns, exchange value, or a guaranteed financial outcome.

## Core rule

No reward is approved from a claim alone. Every bounty submission must include evidence that can be reviewed by a verifier.

Minimum evidence record:

- contributor identifier;
- bounty/activity type;
- public URL or artifact reference;
- publication or completion date;
- metric source where a metric is required;
- submitted evidence (for example screenshot, analytics export, or platform URL);
- verifier decision;
- approved MYZ amount;
- status: submitted, under review, approved, rejected, or paid/recorded;
- notes explaining exceptions or adjustments.

## Initial reward schedule

| Contribution | Base reward | Required evidence |
| --- | ---: | --- |
| Public social post | 10 MYZ | Public URL and screenshot |
| Original creative approved for campaign use | 15 MYZ | Source asset plus approval record |
| 100 valid campaign clicks | 20 MYZ | Platform analytics or equivalent evidence |
| 500 verified views | 25 MYZ | Platform analytics/screenshot |
| 1,000 verified views | 40 MYZ | Platform analytics/screenshot |
| Qualified lead or real institutional/business contact | 50 MYZ | Evidence of the lead and verifier approval; do not publish private contact data |
| Short-form video published | 30-50 MYZ | Public URL, publication evidence, quality/scope review |
| Campaign reaches its declared KPI target | 50-100 MYZ bonus | Campaign analytics and verifier approval |

The ranges above are program defaults, not automatic entitlements. A bounty issue or campaign brief may define a different amount before work begins.

## Qualified traffic

A click or view counts only when it is reasonably attributable to the campaign and is not known or suspected to be artificial, duplicated, automated, incentivized in an undisclosed way, or generated through prohibited traffic sources.

Where analytics cannot reliably distinguish valid activity, the verifier may decline to award metric-based MYZ.

## Qualified lead

A qualified lead is a real person or organization with a plausible, relevant interest in MyZubster who takes a meaningful action, such as requesting information, agreeing to a meeting, or initiating a substantive project/partnership discussion.

A name, scraped address, purchased contact list, cold impression, or unverified form entry is not automatically a qualified lead.

## Anti-abuse rules

Rewards must not be granted for:

- self-generated or automated clicks/views intended to inflate metrics;
- bots, click farms, fake followers, fake accounts, or purchased engagement;
- duplicate submissions for the same proof unless the bounty explicitly allows stacking;
- misleading, deceptive, or unverifiable advertising claims;
- impersonation, spam, unsolicited mass messaging, or platform-policy violations;
- invented partnerships, funding, adoption, metrics, technical states, token value, or endorsements;
- publishing secrets, private keys, wallet seed phrases, credentials, or unnecessary personal data;
- presenting concept/AI-generated visuals as operational evidence;
- claiming MYZ has a cash, market, redemption, or investment value not supported by current canonical documentation.

The verifier may reject, reduce, or revoke a reward when evidence is manipulated, materially incomplete, duplicated, or later shown to be false.

## Evidence and privacy

Public URLs should be preferred where possible. Screenshots should be sanitized when they contain private information. Only the minimum data needed to validate the contribution should be retained.

Private leads and contact information should never be committed to the public repository merely to prove a bounty. Store only a sanitized evidence reference and verifier outcome in public records when necessary.

## Campaign declaration

Before a paid or reward-bearing campaign starts, its brief should record:

- campaign name and owner;
- channel(s);
- target audience;
- start/end window;
- creative assets and their status;
- destination URL;
- KPI(s);
- MYZ reward rules;
- verifier or review process;
- advertising spend, if any, tracked separately from MYZ rewards.

## MYZ and advertising spend

Advertising spend paid to external platforms (for example Meta or Google) is separate from MYZ contributor rewards. MYZ should not be described as reimbursement for fiat advertising spend unless a separately approved policy explicitly defines that mechanism.

Do not advertise a formula such as "spend EUR X and receive Y MYZ" as guaranteed compensation without an approved accounting, legal, and verification policy.

## Suggested workflow

1. OPEN BOUNTY / CAMPAIGN BRIEF
2. CONTRIBUTE
3. SUBMIT EVIDENCE
4. VERIFY
5. APPROVE OR REJECT
6. RECORD MYZ REWARD
7. ARCHIVE PUBLIC/SANITIZED PROOF
8. COLLECT FOLLOW-UP METRICS WHEN REQUIRED

## Example submission

```yaml
bounty: MYZ-ADS-001
contributor: github-user
activity: public-social-post
url: https://example.social/post/123
published_at: 2026-08-23T12:00:00Z
metrics:
  views: 742
  clicks: 118
evidence:
  - public URL
  - sanitized analytics screenshot
status: submitted
requested_myz: 30
```

The requested amount is not authoritative. The verifier applies the active campaign rules and records the final approved amount.

## Governance and changes

Reward amounts, eligibility rules, and evidence standards may be changed prospectively through reviewed repository updates. Changes should not retroactively reduce an already approved reward unless fraud, duplication, or material evidence error is discovered.

## Launch recommendation

For the first seven-day advertising experiment, use this document as a controlled pilot rather than a permanent economic policy. Review fraud rate, evidence quality, contributor behavior, cost per verified action, and total MYZ issued before expanding the program.
