# MyZubster MYZ Bounties

The MyZubster MYZ Bounty Program is a contributor reward framework for open-source tasks, research, testing, documentation, Knowledge Cards, Marketplace improvements, Zorgax integrations, pilot work, and other verifiable contributions.

## Important notice

MYZ is an internal MyZubster reward / utility unit unless and until a separately documented token or settlement mechanism exists.

- MYZ does **not** carry a guaranteed EUR, USD, BTC, ETH, XMR, or other fiat/crypto conversion value.
- A MYZ bounty must not be represented as cash, salary, investment, yield, or guaranteed future payment.
- A fiat/crypto payout exists only when a maintainer explicitly marks a separate bounty or settlement as `RESERVED` or `FUNDED` and records the agreed payment rail.
- Historical MYZ rewards do not create retroactive payment obligations.

## Standard reward bands

| Level | Typical reward | Typical work |
| --- | ---: | --- |
| XS | 100 MYZ | small documentation fix, translation, evidence cleanup, reproducible test |
| S | 250 MYZ | focused docs, Knowledge Card, UI copy, small bug reproduction/fix |
| M | 500 MYZ | contained feature, integration, pilot evidence package, test suite |
| L | 1,000 MYZ | substantial feature, multi-file integration, verified pilot milestone |
| XL | Custom MYZ | larger scoped work; requires explicit maintainer approval before work starts |

Maintainers may choose another amount when scope, risk, or evidence requirements justify it.

## Bounty lifecycle

Every MYZ bounty should use these states:

1. `PROPOSED` — task is described but not assigned.
2. `OPEN` — contributors may submit a claim.
3. `CLAIMED` — a contributor has supplied a concrete plan, repository/branch when relevant, and evidence they can perform the task.
4. `SUBMITTED` — a PR, commit, document, test result, or other verifiable deliverable is available.
5. `ACCEPTED` — maintainers have reviewed and accepted the contribution.
6. `REWARDED` — the MYZ reward has been recorded.
7. `CLOSED` — bounty completed or cancelled.

For any bounty with a real BTC/ETH/XMR/fiat payout, additionally record:

- `RESERVED` or `FUNDED` before creating a payment expectation;
- payment rail;
- conversion source and timestamp when conversion is needed;
- destination address supplied by the contributor;
- transaction ID / hash after settlement.

## Claim requirements

A valid claim should include enough information to avoid duplicate paid work:

- GitHub username;
- issue/bounty number;
- short implementation plan;
- repository/branch or working location when applicable;
- expected deliverable;
- relevant skills or evidence;
- acknowledgement that work is not accepted until reviewed.

A comment such as "try", "working on it", or similar, without verifiable work context, is interest only and does not reserve a bounty.

## Acceptance requirements

A contribution can be marked `ACCEPTED` only after the relevant evidence is reviewed. Depending on the task this can include:

- pull request review;
- CI/tests;
- reproducible local or VPS test;
- source integrity/security checks;
- documentation review;
- scientific/source verification;
- Knowledge Card evidence state;
- external pilot validation.

Merge alone does not automatically create a cash/crypto payment obligation unless a funded settlement was explicitly agreed.

## Suggested issue template

```md
## MYZ Bounty

**Reward:** 250 MYZ
**State:** OPEN
**Scope:** ...
**Deliverable:** ...
**Acceptance criteria:**
- [ ] ...
- [ ] ...
- [ ] ...

### How to claim
Reply with:
- GitHub username
- implementation plan
- branch/repository if applicable
- relevant evidence/experience

### Settlement
MYZ is an internal reward unit and has no guaranteed fiat/crypto value.
Any BTC/ETH/XMR/fiat settlement must be separately marked RESERVED/FUNDED before it creates a payment expectation.
```

## Contributor record

When a bounty is accepted, maintainers should link the accepted work to the contributor's provenance trail when available:

- GitHub identity;
- accepted PR/commit/evidence;
- Knowledge Card / Contributor Passport;
- skill or competency demonstrated;
- optional Marketplace / Metaverse profile;
- reward record.

The goal is not merely to distribute rewards, but to create a verifiable contribution history.
