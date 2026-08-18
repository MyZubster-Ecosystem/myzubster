# MyZubster Bounty Board

This page is the organization-level entry point for bounty work across first-party MyZubster repositories.

The authoritative lifecycle and settlement policy is [`../BOUNTIES.md`](../BOUNTIES.md). The canonical label taxonomy is [`LABELS.md`](LABELS.md).

## How to use the board

Use the canonical labels to filter work across the organization:

- `type:bounty` — all explicitly bountied work.
- `reward:myz` — MYZ reward component.
- `reward:xmr` — XMR settlement component.
- `reward:token` — token settlement component.
- `status:proposed` — not yet approved/funded.
- `status:funded` — funding/reservation approved; not proof of settlement.
- `status:active` — available/claimed/in progress according to the issue instructions.
- `status:review` — submitted and awaiting verification.
- `status:verified` — acceptance criteria verified.
- `settlement:pending` — reward/settlement not final.
- `settlement:settled` — external settlement has verifiable evidence where applicable.

## Repository lanes

| Lane | Repository | Typical bounty scope |
|---|---|---|
| Core / civic / mapping | `myzubster` | platform, photos, crawler, mapping, bounty engine |
| Gateway / settlement | `MyZubsterGateway` | APIs, payment boundary, settlement, verification integration |
| Marketplace | `MyZubster-Marketplace` | listings, gardens, marketplace workflows |
| Mobile | `MyZubster-App` | React Native client, maps, capture and verification UI |
| Web | `MyZubsterWeb` | public web experience and deployment |
| Animal Registry | `myzubster-animal-registry` | animal records, NFC tooling and verification |
| Robotics | `MyZubster-Robot` | robot software, SDKs and simulated/authorized hardware integration |
| Robot Stack | `MyZubster-Robot-Stack` | experimental integrated robotics stack |
| EVA IONI | `EVA-IONI` | simulator-first robotics / urban-garden research |
| Space Station | `myzubster-space-station` | software-only mission/telemetry vertical slice |
| AI Automation | `ai-automation` | issue/PR/documentation automation with human approval |
| AI Bot | `myzubster-ai-bot` | conversational/community agent experiments |
| Platform migration | `myzubster-platform` | inventory, migration and consolidation work |
| Escrow boundary | `myzubster-escrow-api` | experimental settlement state machine and test fixtures |
| Independent verifier | `myzubster-verifier` | fail-closed transaction/evidence verification |
| Docs | `myzubster-docs` | ecosystem documentation |
| Manuals | `myzubster-manuals` | operator/user manuals and runbooks |

`tari` is intentionally excluded from this board because it is treated as an upstream/dependency repository.

## Bounty issue minimum contract

Every new bounty issue should state:

1. objective and scope;
2. acceptance criteria;
3. explicit reward assets and amounts, or `TBD / not funded`;
4. evidence required for verification;
5. safety/security constraints;
6. funding/approval state;
7. settlement rule;
8. statement that merge/issue closure alone is not payment proof.

## Reward truth

- **MYZ** currently represents an internal MyZubster reward/ledger component unless a separately verified external rail is explicitly documented.
- **XMR / TOKEN** are external settlement components and require independent verification before they can be treated as settled.
- An issue, PR, merge, internal ledger entry or adapter response is not independently verifiable external payment evidence by itself.

## Automation

First-party repositories include a label-sync workflow that creates/updates this taxonomy and applies `type:bounty` plus reward-asset labels to clearly identified open bounty issues. Lifecycle and settlement labels remain intentionally conservative and require explicit workflow/reviewer state rather than title-text guessing.
