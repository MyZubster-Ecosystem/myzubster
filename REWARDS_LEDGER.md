# MYZ Rewards Ledger & Allocation Policy

This document defines the boundary for MYZ token distribution to prevent arbitrary minting and ensure auditability.

## The Reward Boundary

To maintain economic integrity, all MYZ allocations must follow this strict workflow:

`Work/Evidence` $\rightarrow$ `Review/Acceptance` $\rightarrow$ `Reward Event` $\rightarrow$ `MYZ Ledger/Allocation` $\rightarrow$ `Settlement Boundary`

## Rules of Allocation

1. **No Self-Minting:** DAO participants or contributors may not mint MYZ based on membership alone.
2. **Evidence-Backed:** Every MYZ allocation must be linked to a specific, verifiable piece of evidence (e.g., a merged PR, a successful node checkpoint, or a verified KPI report).
3. **Auditability:** All entries in this ledger must reference a GitHub issue, PR, or external evidence link.
4. **Separation of Concerns:** MYZ rewards represent contribution value within the ecosystem and do not represent:
   - Fiat/Crypto redemption rights.
   - Company equity or legal ownership.
   - Guaranteed future value or treasury withdrawal rights.

## Current Active Roles & Evidence Requirements

| Contributor | Domain | Required Evidence |
| :--- | :--- | :--- |
| @nicolaususnicola-lgtm | Interoperability | N4K48 node evidence / Bridge tests |
| @foxxx009 | QA & Reproducibility | Deterministic fixture reports / KPI logs |
| @Aming9303 | Integration | Signed lifecycle webhooks / Sensor logs |
| @wasim-builds | Security | Fail-closed test results / Registry provenance |
| @khongten124 | Knowledge | Knowledge Cards / Provenance packages |
| @Shweta-singh24 | Verification | Docker/Node.js verifier environment logs |
| @edvinas1573 | Economics | Reconciliation arithmetic reports |
| @lamkyo | Revenue Calculation | Deterministic split implementation tests |

*Note: Status is "Proposed" until independent evidence is published.*
