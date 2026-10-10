# MyZubster Critical Service Ownership & Cost Inventory

Status: **M1 baseline / evidence-backed inventory**

Related: #1560

This document records critical services, current known dependencies, recovery gaps and decentralization targets.

## State vocabulary

- `DOCUMENTED` — supported by repository evidence.
- `PARTIAL` — some operational evidence exists, but ownership/recovery/cost details are incomplete.
- `UNKNOWN` — not verifiable from current repository evidence.
- `DANIEL_SPOF` — currently appears dependent on Daniel-controlled credentials, infrastructure or recovery knowledge.
- `MULTI_OPERATOR_TARGET` — needs a primary + backup/recovery operator.
- `INDEPENDENT_NODE_PATH` — a contributor-owned runtime/checkpoint exists or is being built.

> Costs are **not guessed**. Unknown recurring costs remain `UNKNOWN` until an invoice/provider record or explicit maintainer entry is supplied.

## M1 inventory

| Service / component | Evidence / runtime | Current operator / control | Cost state | Backup / recovery | Second operator / node | SPOF risk | Next action |
|---|---|---|---|---|---|---|---|
| Public web/app | Vercel-hosted production is documented; repository deploy integration exists | Daniel/MyZubster credentials appear required for production configuration | UNKNOWN | Recovery runbook not verified | NONE VERIFIED | **DANIEL_SPOF / HIGH** | document deploy ownership, env inventory, backup operator and rollback |
| Core API/backend | Main repository; Node backend and production routes | MyZubster/Daniel operational control currently dominant | UNKNOWN | No full independent recovery exercise verified | N4K48 only covers bounded external interoperability, not core takeover | **HIGH** | create reproducible core runbook and second-operator test |
| VPS runtime | Daniel VPS hardening/evidence is documented; contributor access is currently scoped case-by-case | Daniel | UNKNOWN | Full VPS replacement/recovery runbook not verified | N4K48 independent environment exists for bounded scope; lamkyo VPS test proposed | **DANIEL_SPOF / CRITICAL** | define rebuild-from-zero runbook; no shared secrets |
| MongoDB / durable app data | Docker Compose and backend Mongo usage documented | Current production credential/operator ownership not fully documented | UNKNOWN | **SEC-11 backup/recovery is OPEN** in cybersecurity baseline | NONE VERIFIED | **CRITICAL** | identify backup owner, retention, restore test and sanitized recovery fixture |
| Docker Compose core stack | `docker-compose.yml` documents app + Mongo and environment-driven runtime | Repository-controlled definition; production operator still centralized | LOW/UNKNOWN | Reproducibility partially documented; full recovery test not verified | Candidate for any contributor | **MEDIUM** | make this canonical recovery path and test on second machine |
| Zorgax application layer | Core routes/services documented | Production API/config credentials appear centralized | UNKNOWN | No independent recovery operator verified | N4K48 has bounded bridge interoperability only | **HIGH** | separate public/test contract from production secrets; second maintainer |
| Qdrant / vector services | Known project infrastructure; exact current production ownership/cost not sufficiently verified in repository search | UNKNOWN / likely Daniel-side operational dependency | UNKNOWN | UNKNOWN | NONE VERIFIED | **HIGH until verified** | document actual current host, volume, backup and health check |
| Open-WebUI / local AI runtime | Known project infrastructure; production/current role not fully verified from repository evidence | UNKNOWN / likely VPS-side where used | UNKNOWN | UNKNOWN | NONE VERIFIED | **MEDIUM/HIGH until verified** | distinguish dev/test vs production dependency; add reproducible image/config |
| Ollama / model runtime | Known project infrastructure; exact active production dependency not sufficiently verified | UNKNOWN | UNKNOWN | UNKNOWN | NONE VERIFIED | **MEDIUM until verified** | document whether critical, optional fallback or development-only |
| Marketplace | Core repository + Marketplace routes/docs | MyZubster core; external Marketplace repo also referenced | UNKNOWN | Code provenance exists; operational recovery not verified | NONE VERIFIED as full Marketplace operator | **HIGH** | nominate second maintainer and create end-to-end test fixture |
| Marketplace payment onboarding | Stripe Connect is roadmap/in implementation; production behavior explicitly not fully verified | Provider + MyZubster credentials | UNKNOWN | Provider-side recovery/ownership not documented | NONE | **HIGH but not production-complete** | inventory Stripe owner, webhook/env dependencies before production claims |
| Revenue split calculator | PR #1550 merged; deterministic calculation-only | MyZubster core + @lamkyo contribution | negligible/UNKNOWN | Canonical vectors in #1558 | **lamkyo path active** | **LOWER / INDEPENDENT_NODE_PATH** | complete #1557/#1559 independent reproduction |
| MYZ ledger / reward accounting | `myz/LEDGER.md`, reward backend and reward records | Core repo / maintainer governance | UNKNOWN | Append-only concepts documented; external settlement separate | Multiple code contributors, no verified independent operator | **MEDIUM/HIGH** | assign backup maintainer; test replay/rebuild from ledger |
| Bounty engine | Core bounty policies + engine/registry | Core maintainers | UNKNOWN | Policy exists; historical settlement reconciliation #1393 | Contributors can implement/review, no independent operator verified | **MEDIUM** | assign domain maintainer and funded-state reviewer |
| Treasury records | `TREASURY.md`, funding inputs and reservations | Governance/maintainer controlled | UNKNOWN | Append-only policy exists; custody/recovery depends on actual payment rail | NONE VERIFIED | **HIGH** | document custody roles separately from public accounting; never share wallet seeds |
| XMR settlement path | Stagenet verification architecture documented; mainnet not production-complete | Current wallet/operator boundary centralized where real keys exist | UNKNOWN | Verification logic exists; custody recovery not public | verifier separation exists architecturally | **HIGH / NOT PROD-COMPLETE** | preserve submitter/verifier separation; define custody recovery before mainnet |
| Telegram bot(s) | Source/config and public bots documented; tokens are env secrets | Token ownership/rotation appears centralized | UNKNOWN | No backup token operator/runbook verified | NONE VERIFIED | **DANIEL_SPOF / HIGH** | document bot ownership, rotation, webhook/polling recovery and backup operator |
| Facebook Messenger bridge | Backend/status route exists; full E2E depends on Meta configuration | Meta app/page credentials likely centralized | UNKNOWN | No independent recovery operator verified | NONE | **HIGH** | inventory Meta app roles, webhook secret rotation and secondary admin |
| PostHog analytics | `docs/POSTHOG_ANALYTICS.md`; Vercel env `POSTHOG_PROJECT_TOKEN` | Project/account credentials centralized | UNKNOWN | Analytics loss is non-critical to core service but history/access continuity unclear | NONE | **MEDIUM** | add second admin/export policy; classify analytics as non-critical dependency |
| Vercel deployment | Production deployment documented and GitHub integration active | Team/project account | UNKNOWN | Rollback exists at provider level; second human admin not documented here | UNKNOWN | **HIGH** | record team owners, deployment recovery and alternate build path |
| Domains / DNS | Public domain in use; registrar/DNS ownership not documented in repository evidence | UNKNOWN / likely founder-controlled | UNKNOWN | UNKNOWN | NONE VERIFIED | **CRITICAL until verified** | document registrar/DNS owner, backup admin, recovery codes offline |
| Contributor Passport | Public contributor/path documentation exists | Core app/repo | UNKNOWN | Data/publication flow documented; operational recovery not verified | contributor opt-in distributed, hosting still core | **MEDIUM** | separate contributor-owned evidence from central rendering; backup maintainer |
| Knowledge Graph | `public/knowledge.html`, graph tests and contributor links | Core repository / public site | low/UNKNOWN | Rebuildable from repository evidence in part | Multiple contributor data sources | **MEDIUM / decentralizable** | make graph generation reproducible from canonical registries |
| GitHub provenance / repositories | Public GitHub org/repositories | Organization account/maintainers | provider/free-plan dependent | Git history is distributed through clones/forks | Many contributor forks | **LOWER but org-admin SPOF UNKNOWN** | document org owners + emergency maintainer; encourage canonical mirrors/forks |
| Monitoring / security response | Cybersecurity baseline exists | Core maintainer | UNKNOWN | SEC-10 monitoring OPEN; SEC-11 backup/recovery OPEN | NONE VERIFIED | **HIGH** | define alerts, incident owner, backup incident lead and recovery drill |
| LIFE / pilot evidence | GitHub evidence and participant automation docs | Distributed contributors + core coordinator | variable | Public evidence is reproducible; institutional process separate | Nicola, khongten, Shweta candidate, others | **LOW/MEDIUM operationally** | keep pilot evidence contributor-owned; avoid making VPS prerequisite |

## Confirmed high-priority single points of failure

### P0 — must remove first

1. **Production VPS / recovery knowledge**
   - founder-controlled operational dependency;
   - no verified independent rebuild/recovery exercise.

2. **MongoDB/data backup + restore**
   - cybersecurity baseline explicitly marks backup/recovery `OPEN`;
   - no verified second operator.

3. **Domain/DNS ownership**
   - critical to public continuity;
   - current backup-admin/recovery evidence is `UNKNOWN`.

4. **Production deployment credentials (Vercel/environment secrets)**
   - code is public, but public code alone cannot recover production without account/config control.

### P1 — next

5. Telegram/Meta credentials and rotation.
6. Treasury/payment custody separation.
7. Marketplace second maintainer.
8. Monitoring/incident-response backup operator.
9. Zorgax/core API reproducible recovery on a second environment.

## Recommended ownership model

For each critical component:

```text
PRIMARY OPERATOR
    +
BACKUP / RECOVERY OPERATOR
    +
PUBLIC RUNBOOK
    +
SANITIZED TEST FIXTURE
    +
NO SHARED PRIVATE KEY
```

The backup operator should prove recovery on a test environment before receiving any production escalation capability.

## Immediate assignments to request

These are **proposals only** until contributors opt in:

- **Nicola / N4K48** — reproduce a bounded core/bridge recovery or health-check path from own environment.
- **lamkyo** — maintain/reproduce economic calculation contract; no treasury custody required.
- **foxxx009** — independent recovery/evidence QA and reproducibility audit.
- **wasim-builds** — access-control, secrets/rotation and fail-closed recovery review.
- **Aming9303** — webhook/replication recovery path.
- **Shweta-singh24** — independent verifier for a sanitized recovery fixture.

## M1 exit criteria

M1 is complete when:

- every critical service has a named current operator/control state;
- every recurring cost is either documented or explicitly `UNKNOWN`;
- Daniel-only dependencies are marked;
- every critical service has a target backup/recovery operator role;
- missing runbooks/backups become concrete issues;
- no secret value is published in this inventory.

## Evidence notes

Repository evidence currently supports:
- Vercel-hosted production and environment-driven integrations;
- MongoDB usage through Docker/backend;
- PostHog via Vercel environment token;
- Telegram integration through environment secrets;
- Messenger production backend/status route with Meta-dependent E2E behavior;
- internal treasury/bounty/reward policy;
- public Contributor Passport / Knowledge Graph pathways;
- cybersecurity baseline where monitoring and backup/recovery remain open.

This inventory does **not** claim current provider invoices, exact monthly spend, credential ownership or successful disaster recovery where those facts are not independently documented.
