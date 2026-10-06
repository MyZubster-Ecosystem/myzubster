# MyZubster Ads Bounty

Status: Adopted operating policy
Adopted: 2026-08-23

## Purpose

The MyZubster Ads Bounty rewards verifiable advertising, marketing and promotional contributions with MYZ inside the MyZubster ecosystem. It applies to social posts, approved creative assets, videos, qualified traffic, qualified leads and measurable outreach work.

MYZ is adopted in this program as an internal MyZubster reward/accounting unit. This policy does not promise cash redemption, investment returns, exchange value, fiat reimbursement or a guaranteed financial outcome.

## Core rule

No MYZ reward is approved from a claim alone. Every reward-bearing contribution must include evidence that can be reviewed by a verifier.

Minimum evidence record:

- contributor identifier;
- bounty/activity type;
- public URL or artifact reference;
- publication or completion date;
- metric source where a metric is required;
- submitted evidence, such as a screenshot, analytics export or platform URL;
- verifier decision;
- approved MYZ amount;
- status: submitted, under review, approved, rejected or recorded;
- notes explaining exceptions or adjustments.

## Adopted reward schedule

| Contribution | Base reward | Required evidence |
| --- | ---: | --- |
| Public social post | 10 MYZ | Public URL and screenshot |
| Original creative approved for campaign use | 15 MYZ | Source asset plus approval record |
| 100 valid campaign clicks | 20 MYZ | Platform analytics or equivalent evidence |
| 500 verified views | 25 MYZ | Platform analytics/screenshot |
| 1,000 verified views | 40 MYZ | Platform analytics/screenshot |
| Qualified lead or real institutional/business contact | 50 MYZ | Evidence of the lead and verifier approval; do not publish private contact data |
| Short-form video published | 30-50 MYZ | Public URL, publication evidence and quality/scope review |
| Campaign reaches its declared KPI target | 50-100 MYZ bonus | Campaign analytics and verifier approval |

These amounts are active defaults. A reviewed bounty issue or campaign brief may define a different reward before work begins.

## Qualified traffic

A click or view counts only when it is reasonably attributable to the campaign and is not known or suspected to be artificial, duplicated, automated, undisclosed incentivized traffic or generated through prohibited traffic sources.

Where analytics cannot reliably distinguish valid activity, the verifier may decline metric-based MYZ.

## Qualified lead

A qualified lead is a real person or organization with plausible, relevant interest in MyZubster that takes a meaningful action, for example requesting information, agreeing to a meeting or initiating a substantive project or partnership discussion.

A name, scraped address, purchased contact list, cold impression or unverified form entry is not automatically a qualified lead.

## Anti-abuse rules

Rewards must not be granted for:

- self-generated or automated clicks/views intended to inflate metrics;
- bots, click farms, fake followers, fake accounts or purchased engagement;
- duplicate submissions for the same proof unless stacking is explicitly allowed;
- misleading, deceptive or unverifiable advertising claims;
- impersonation, spam, unsolicited mass messaging or platform-policy violations;
- invented partnerships, funding, adoption, metrics, technical states, MYZ value or endorsements;
- publishing secrets, private keys, seed phrases, credentials or unnecessary personal data;
- presenting concept or AI-generated visuals as operational evidence;
- claiming MYZ has a cash, market, redemption or investment value not supported by canonical documentation.

A verifier may reject, reduce or revoke a reward when evidence is manipulated, materially incomplete, duplicated or later shown to be false.

## Evidence and privacy

Prefer public URLs where possible. Sanitize screenshots that contain private information. Retain only the minimum data needed to validate the contribution.

Private leads and contact information must not be committed to the public repository merely to prove a bounty. Public records should contain a sanitized evidence reference and verifier outcome when needed.

## Campaign declaration

Before a paid or reward-bearing campaign starts, record:

- campaign name and owner;
- channel(s);
- target audience;
- start/end window;
- creative assets and their status;
- destination URL;
- KPI(s);
- active MYZ reward rules;
- verifier or review process;
- advertising spend, if any, tracked separately from MYZ rewards.

## MYZ and advertising spend

Advertising spend paid to external platforms such as Meta, Google or TikTok is separate from MYZ contributor rewards.

MYZ must not be described as automatic reimbursement for fiat advertising spend unless a separate approved policy defines that mechanism. Do not advertise formulas such as "spend EUR X and receive Y MYZ" as guaranteed compensation.

## Operating workflow

1. OPEN BOUNTY / CAMPAIGN BRIEF
2. CONTRIBUTE
3. SUBMIT EVIDENCE
4. VERIFY
5. APPROVE OR REJECT
6. RECORD MYZ REWARD
7. ARCHIVE PUBLIC OR SANITIZED PROOF
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

Reward amounts, eligibility rules and evidence standards may be changed prospectively through reviewed repository updates. Changes should not retroactively reduce an already approved reward unless fraud, duplication or material evidence error is discovered.

## Review cadence

Review the program regularly using evidence quality, fraud rate, contributor behavior, cost per verified action, channel performance and total MYZ issued. Changes to the reward schedule should be documented before they take effect.

See also: `docs/marketing/README.md` for the operational advertising and marketing workflow.
