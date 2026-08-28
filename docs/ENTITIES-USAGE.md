# MyZubster Entities — Usage Guide

> **Status: IMPLEMENTED / VERIFIED at registry level.** The public MyZubster registry exposes 16 canonical entities. An entity is a specialized operating profile with a mission, workflow, capabilities and explicit boundaries. It is **not** evidence of a separate trained model, autonomous service, legal person, partner, employee or independent production agent.

## What the entities are

The entities help users choose the right evidence-first workflow for a task. They share the MyZubster runtime and may operate in guided-fallback mode when an advanced model/provider is unavailable.

Use them as specialized assistants for preparation, analysis, documentation and review. Consequential actions remain subject to the relevant human, governance, scientific, security or operational review.

## How to use them

1. **Choose the entity by task**, not by character appearance.
2. **Provide the source material** needed for the task: links, measurements, issue/PR references, authorized observations or documentation.
3. **State what you want produced**, for example a checklist, evidence package, architecture review or provenance audit.
4. **Check the entity boundaries** before treating an output as verified.
5. **Request evidence/status separation** whenever the answer contains facts, proposals, simulations or narrative material.
6. **Use human review** for scientific validation, production changes, security authorization, governance, partnerships, payments or external settlement.

Example:

```text
Entity: Selya-9
Input: dataset + source links + collection notes
Task: check provenance and separate measured facts, assumptions and missing evidence
Output wanted: review checklist
```

## Which entity should I use?

| Entity | Use it for | Do not treat its output as |
|---|---|---|
| **Zorgax** | ecosystem guidance, evidence classification, next-step routing | autonomous governance or proof of a real-world claim |
| **LIFE Pathfinder** | environmental pilot design, LIFE readiness, replication planning | LIFE funding, eligibility approval or EU endorsement |
| **Circula** | circular-economy flows, reuse models, baselines | measured circularity without data |
| **MRV Oracle** | baselines, KPI design, provenance, MRV controls | validated measurements when source data is absent |
| **Gaia Mapper** | GIS, biodiversity and privacy-aware geospatial workflows | permission to expose sensitive coordinates |
| **EVA IONI** | sensors, telemetry and robotics diagnostics | authorization for dangerous or physical actuation |
| **IPFS Archivist** | sanitized evidence packages, hashes, CID/provenance workflows | proof that archived content is true |
| **Bounty Forge** | issue design, task scope and acceptance criteria | promise of funding, payment or bounty acceptance |
| **Ledger Keeper** | internal MYZ ledger interpretation and reconciliation | proof of external/on-chain payment |
| **Gateway Custodian** | provider/settlement boundaries and fail-closed checks | proof that settlement completed without independent confirmation |
| **Metasploit Sentinel** | authorized defensive security scoping and remediation | authorization to test third-party systems |
| **GitHub Chronicler** | issue/PR/CI chronology and governance history | proof of identity, endorsement, payment or deployment |
| **Selya-9** | provenance, data quality and claim-status review | scientific validation without qualified human review |
| **Khar-Vel** | system architecture, interfaces, reliability and failure modes | proof that a proposed architecture is deployed |
| **Nythera** | source-aware documentation, versioning and decision trails | proof that archived material is current or verified |
| **Oruun** | water-monitoring plans, observation provenance and evidence packages | validated water quality/safety without qualified testing |

## Recommended multi-entity workflows

### Environmental / LIFE pilot

```text
LIFE Pathfinder
  → Oruun / Gaia Mapper / Circula
  → Selya-9
  → MRV Oracle
  → Nythera
  → Zorgax
  → qualified human review
```

Use the domain entity to structure observations, Selya-9 to inspect provenance, MRV Oracle to prepare indicators, Nythera to preserve the source trail, and Zorgax to explain status and next steps. Scientific or institutional claims still require qualified review and appropriate official evidence.

### Software / system change

```text
Khar-Vel
  → GitHub Chronicler
  → Metasploit Sentinel (only when security scope is explicitly authorized)
  → human maintainer review
```

Khar-Vel can define interfaces and failure modes; GitHub Chronicler can connect the work to issues, commits, PRs and CI. Production changes remain a maintainer decision.

### Contributor mission / bounty

```text
Bounty Forge
  → GitHub Chronicler
  → Selya-9 / IPFS Archivist when evidence is required
  → Ledger Keeper for internal MYZ accounting
  → separate independently verified external settlement, if any
```

A contribution, merge, MYZ ledger entry or CID must never be represented as proof of an external payment.

## Truth/status vocabulary

When using an entity, keep these states distinct:

- **CANON** — approved project definition or role.
- **PROPOSED** — suggested but not yet approved as canon/implementation.
- **FICTION** — narrative/lore content.
- **SIMULATION** — synthetic or simulated behavior/data.
- **IMPLEMENTED** — present in code or documented runtime behavior.
- **VERIFIED** — supported by the cited evidence appropriate to the claim.

`IMPLEMENTED` does not automatically mean `VERIFIED` for every real-world claim. `CANON` does not turn fiction into evidence.

## Safety and privacy

Never give an entity secrets, wallet seeds, private keys, passwords, unnecessary personal data, confidential partner material or sensitive locations unless a specifically authorized private workflow requires that information. Public GitHub issues and repositories must be treated as public.

Entities must not invent measurements, partnerships, funding, deployment, scientific validation, payment or adoption. Missing evidence should be reported as missing evidence.

## Runtime status

The canonical registry is exposed through the MyZubster entities API. Availability of a guided entity does not imply that every advanced provider is online. The runtime is designed to retain bounded guidance through guided-fallback behavior.

For implementation details and the current source of truth, use the entity registry and repository documentation in `MyZubster-Ecosystem/myzubster`.
