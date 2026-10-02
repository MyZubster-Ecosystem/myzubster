# Contributor Pilot Nodes

MyZubster can turn a verified contribution into the beginning of an independent contributor pilot, without treating a bounty, profile or AI-generated description as proof of skill.

The pathway is:

```text
GOOD FIRST ISSUE
      ↓
ACCEPTED CONTRIBUTION / PR
      ↓
EVIDENCE + KNOWLEDGE CARD
      ↓
CONTRIBUTOR PASSPORT
      ↓
OPTIONAL PILOT NODE
      ↓
MILESTONES + NEW EVIDENCE
      ↓
REWARDS WHEN EXPLICITLY RESERVED/FUNDED
      ↓
INDEPENDENT NODE CONNECTED TO MYZUBSTER
```

## Purpose

A Contributor Pilot Node is a small independent project/profile connected to MyZubster through public evidence. It may later have its own repository, roadmap, Knowledge Cards and pilot activity, while preserving attribution and independence.

Nicola is the reference pattern for an existing public pilot node. New contributors must not be described as equivalent to Nicola until their own participation, consent and evidence exist.

## Entry conditions

A contributor can be invited to create a Pilot Node after at least one accepted contribution that has a traceable GitHub issue/PR or another documented project artifact.

An invitation does not create a node automatically. The contributor chooses whether to participate.

## Pilot Node stages

### P0 — Candidate
- An open task exists.
- Reward may be `PROPOSED` or `UNFUNDED`.
- No payment promise exists.
- No competence claim exists.

### P1 — Verified contributor
- A contribution has been accepted.
- Evidence links to the relevant issue/PR/commit.
- A Knowledge Card may describe what was actually contributed.
- Reward settlement, if any, remains separate from skill claims.

### P2 — Contributor Passport
- The contributor opts in.
- Public identifier and evidence are linked.
- Knowledge claims distinguish self-declared, project-demonstrated and externally evidenced information.
- Wallet/address data stays private unless the contributor explicitly chooses otherwise.

### P3 — Pilot Node
- The contributor defines a small independent objective.
- The node has a scope, repository or project area, milestones and evidence requirements.
- MyZubster links to the node but does not claim ownership of the contributor's identity or independent work.

### P4 — Independent milestone loop
- New milestones can receive proposed rewards.
- A reward becomes an external commitment only when its funding state is `RESERVED` or `FUNDED`.
- Settlement evidence may be linked after payment.
- New project evidence can feed Knowledge Cards and the public Knowledge Graph.

## Reward ladder

The ladder below is a planning framework, not a promise of payment.

| Stage | Typical activity | Suggested proposed reward |
| --- | --- | --- |
| Entry | small test/docs/accessibility fix | 10–30 USD equivalent |
| Repeat contribution | second accepted contribution or reproducible improvement | 20–50 USD equivalent |
| Pilot milestone | independent scoped module/pilot deliverable | 40–100 USD equivalent |
| Larger scoped job | separately reviewed fixed-scope work | amount agreed before work starts |

All external rewards must use the canonical funding states:

```text
PROPOSED / UNFUNDED
        ↓
RESERVED
        ↓
FUNDED
        ↓
WORK ACCEPTED
        ↓
SETTLEMENT
        ↓
PAID + EVIDENCE
```

XMR, BTC or ETH can be used only after explicit agreement on:
- amount or USD-equivalent reference;
- asset/network;
- conversion timing/reference;
- fees;
- acceptance criteria;
- payout window.

MYZ remains an internal accounting/reward unit unless a separate external settlement is explicitly defined.

## Pilot Node record

A node can be recorded with:

```json
{
  "schema": "myzubster.contributor-pilot-node.v1",
  "pilotNodeId": "CPN-###",
  "status": "CANDIDATE",
  "contributor": {
    "publicId": "github-handle",
    "consent": "OPT_IN"
  },
  "entryEvidence": [
    {
      "type": "github_pr",
      "url": "https://github.com/..."
    }
  ],
  "knowledgeCards": [],
  "project": {
    "title": "Independent pilot objective",
    "repository": null,
    "scope": "What the pilot will actually test/build/document"
  },
  "milestones": [],
  "rewardPolicy": {
    "fundingState": "PROPOSED",
    "settlementAssets": ["XMR", "BTC", "ETH"]
  },
  "reviewState": "UNREVIEWED",
  "limitations": []
}
```

Use `UNKNOWN` where information is missing. Do not invent consent, competence, ownership, results, validation or payment.

## Current candidate entry tasks

The following tasks can act as first-entry opportunities. They remain proposed rewards until explicitly reserved/funded:

- #1439 — smoke test for `/paid-bounties`
- #1440 — bounty API funding-state filter tests
- #1441 — mobile accessibility of the Knowledge Graph
- #1442 — 10-minute first contribution guide
- #1443 — Paid Bounties empty/error states

Completing one does not automatically create a Pilot Node. After acceptance, the contributor can be invited to opt in to the next stage.

## Evidence and knowledge boundary

A completed task is evidence that the documented task was completed. It is not automatic proof of broad professional competence.

A crypto transaction proves settlement to the extent the transaction and recipient relationship are documented. It does not prove skill.

A Knowledge Card records a claim, source and verification state. It should not silently promote project evidence into scientific, professional or institutional certification.

## Connection to MyZubster

A Pilot Node can connect to:
- GitHub provenance;
- Knowledge Cards and the interactive Knowledge Graph;
- Zorgax onboarding and documentation assistance;
- Marketplace/project activity where relevant;
- reward/settlement evidence;
- a later independent repository or pilot page.

The node remains attributable to the contributor and should be portable rather than locked into a single MyZubster interface.
