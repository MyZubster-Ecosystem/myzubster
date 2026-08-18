# MyZubster Ecosystem Architecture

This document is the canonical map of the MyZubster GitHub organization.

MyZubster is an open-source ecosystem in active development and validation. It combines real-world observations, bounty/reward workflows, public content-addressed data, applications, integrations, robotics/IoT experiments and documentation. Repository names describe responsibility boundaries; they do not imply that every planned feature is production-ready.

## Architecture at a glance

```text
Users / contributors
        |
        +-------------------------+
        |                         |
        v                         v
  MyZubster App              MyZubster Web
        |                         |
        +------------+------------+
                     |
                     v
              Core / Platform
        myzubster + platform APIs
                     |
       +-------------+-------------+
       |             |             |
       v             v             v
   Bounties      Observations    Gardens / media
   & rewards       / crawler       / registries
       |             |             |
       +-------------+-------------+
                     |
             public snapshots
                     v
               IPFS / IPNS
                     |
                     v
              independent pins

Integration / settlement boundary:
Core -> Gateway -> Treasury / payment adapters -> independent verifier

Experimental tracks:
AI automation | EVA IONI | Robot | Space Station | IoT
```

## Repository map

| Repository | Role | Current positioning |
|---|---|---|
| `myzubster` | Main ecosystem/core repository | Primary source for platform workflows, public architecture and canonical bounty rules |
| `MyZubsterGateway` | Integration and settlement boundary | Gateway/API infrastructure; real settlement remains gated by independent verification |
| `MyZubster-Marketplace` | Marketplace-facing services and experiments | Application/service surface; historical reward claims must be treated separately from verified settlement evidence |
| `MyZubster-App` | Mobile/client application | User-facing client in active development |
| `MyZubsterWeb` | Web presence | Repository bootstrap/synchronization track |
| `myzubster-platform` | Platform services / prior platform track | Development repository; align with the canonical core contracts before production use |
| `myzubster-animal-registry` | Animal registry experiment | Registry/NFC/verification track; not a claim that records are currently stored on a blockchain |
| `MyZubster-Robot` | Robotics experiments | Prototype/simulation/hardware integration track |
| `MyZubster-Robot-Stack` | Robot stack | Internal/private integration track |
| `EVA-IONI` | EVA IONI software/robotics track | Experimental component used by Space Station and telemetry work |
| `myzubster-space-station` | Space Station vertical slice | Software MVP/telemetry/integration track; does not imply physical space infrastructure |
| `ai-automation` | AI automation | Private internal automation track with human oversight |
| `myzubster-ai-bot` | GitHub/AI bot | Private automation agent track |
| `myzubster-escrow-api` | Escrow boundary | Private experimental service; no real-asset custody/settlement claim without the required gates |
| `myzubster-verifier` | Independent verification boundary | Private verifier service track; intended to prevent adapters from self-declaring a payment as final |
| `myzubster-docs` | Documentation hub | Cross-repository guides and contributor documentation |
| `myzubster-manuals` | Manuals | Manual/runbook publication track |
| `tari` | External/upstream dependency/fork | Dependency research track; not governed as a normal MyZubster product repository |

## Core domain model

The platform is organized around verifiable work and evidence:

```text
Bounty definition
      |
      v
Contribution / evidence
      |
      +--> file / photo / metadata --> IPFS CID
      |
      v
Review / verification
      |
      v
Reward record
      |
      +--> internal MYZ ledger today
      |
      +--> externally settled asset only after independent verification
```

### Public IPFS state

MyZubster can publish sanitized public snapshots to IPFS. The current design separates mutable discovery from immutable content:

```text
stable IPNS name
      |
      v
latest root CID
      |
      +-- photos index CID
      +-- bounties index CID
      +-- rewards public index CID
      +-- crawler public index CID
      +-- discoveries public index CID
```

IPFS provides content addressing and replication. It does **not** by itself provide decentralized application consensus, authorization or financial settlement. MongoDB/service stores remain part of the operational application layer while public snapshots are independently addressable.

Public IPFS metadata must be sanitized. Do not publish private user identifiers, credentials, local filesystem paths, confidential research, restricted-location details or sensitive infrastructure information.

## Bounty system boundary

The canonical bounty specification is in [`../BOUNTIES.md`](../BOUNTIES.md).

The high-level work lifecycle is:

```text
PROPOSED
  -> VALIDATED
  -> APPROVED
  -> FUNDED (when external funding is required)
  -> ACTIVE
  -> SUBMITTED
  -> UNDER_REVIEW
  -> VERIFIED / REJECTED
  -> REWARD_RECORDED
  -> SETTLED/PAID only when the applicable settlement evidence exists
```

A GitHub issue, assignment, pull request, merge or application-level reward record is **not** by itself proof that an external payment occurred.

## Reward and settlement truth

### MYZ

MYZ currently functions as an internal platform reward/accounting ledger in the core system. An approved MYZ reward record is evidence of a platform credit, not automatically evidence of an on-chain transaction.

### XMR / blockchain tokens

A bounty may describe an intended external asset, but external settlement must remain separate from work acceptance. `PAID` requires independently verifiable evidence appropriate to the rail. Missing or unavailable payment rails must remain pending/unsettled rather than being represented as completed.

For real-asset settlement the intended boundary is:

```text
Bounty approved
      |
      v
Treasury reservation
      |
      v
Payment submission
      |
      v
Independent verifier
      |
      +-- mismatch / unavailable -> UNSETTLED / FAILED
      |
      +-- verified -> CONFIRMED -> PAID
```

## Safety and privacy rules for bounties

Bounties must not incentivize:

- trespassing or access to restricted areas;
- bypassing access controls or security systems;
- publication of sensitive infrastructure details or exact sensitive geolocation;
- collection of confidential research or private documents;
- destructive security testing or denial-of-service activity;
- weapons, explosives or hazardous-device construction;
- collection/publication of personal data that is not necessary for the task.

High-sensitivity work must use manual review and narrowly scoped evidence requirements.

## Documentation contract for every first-party repository

Each first-party repository should expose at least:

1. `README.md` — purpose, maturity/status, setup or bootstrap state, security notes, related repositories.
2. `BOUNTIES.md` — repository-specific scope plus a link to the canonical bounty policy.
3. GitHub issues — at least one actionable bootstrap/roadmap issue if the repository has no existing backlog.
4. No secrets, wallet seed phrases, private keys or production credentials in source or examples.
5. Claims must distinguish production, testnet, simulation, proposal and experimental states.

## Source of truth

When repository documentation conflicts, prefer the following order:

1. code and reproducible tests for actual implemented behavior;
2. this ecosystem architecture and the canonical bounty policy;
3. current repository README;
4. historical issues/posts.

Historical bounty amounts or statements do not prove that a payment was executed.
