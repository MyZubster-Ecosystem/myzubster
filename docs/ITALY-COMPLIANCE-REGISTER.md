# MyZubster Italy Compliance Register

**Status:** PUBLIC / LIVING REGISTER / COMPLIANCE-BY-DESIGN  
**Last baseline:** 29 August 2026

> This register is a technical/governance control document. It is **not** legal advice, certification, a conformity assessment, authorization, regulatory approval or institutional endorsement.

## Purpose

MyZubster uses this register to turn public compliance commitments into auditable gates. A declaration in a README, issue, roadmap or design document is not by itself evidence that a specific deployment is lawful or authorized.

Core rules:

> **NO AUTHORIZATION → NO DEPLOYMENT**  
> **NO EVIDENCE → NO CLAIM**  
> **REGULATED FEATURE → SEPARATE REVIEW**

## Status vocabulary

| Status | Meaning |
|---|---|
| `OPEN` | Requirement identified; evidence/control still needed. |
| `PARTIAL` | Some controls/evidence exist, but the gate is not complete. |
| `READY FOR REVIEW` | Evidence package prepared; independent/qualified review still required. |
| `AUTHORIZED` | Use only when an authorization exists and its scope is recorded. |
| `VALIDATED` | Use only when method, evidence and responsible validator are recorded. |
| `N/A — JUSTIFIED` | Requirement assessed as not applicable, with written rationale. |

## Public compliance register

| ID | Area | Requirement / question | Current control | Evidence | Current status | Gate / next action |
|---|---|---|---|---|---|---|
| IT-01 | Legal responsibility | Who is legally/operationally responsible for each real-world activity? | Public founder/project governance exists; external obligations must be explicitly attributed. | README + project governance records | `PARTIAL` | Define responsible legal/operational actor before contracts, funding, regulated services or external obligations. |
| IT-02 | AI governance | Is the purpose, role and human responsibility for each AI system documented? | Human-in-the-loop / evidence-first policy; automation is assistance, not authority. | README; public compliance issue #840 | `PARTIAL` | Create per-system AI inventory and risk/applicability assessment. |
| IT-03 | AI Act | What AI Act role/risk category and obligations apply to the actual system/use case? | General compliance-by-design gate only. | Regulation (EU) 2024/1689 reference; #840 | `OPEN` | Perform system-by-system classification before relevant deployment. |
| IT-04 | Italian AI law | Are Italian AI requirements mapped to the actual use case? | Public commitment to transparent, responsible, human-centred operation. | Law 23 September 2025 no. 132 reference; #840 | `PARTIAL` | Maintain legal mapping as implementations and implementing rules evolve. |
| IT-05 | Authorization | Is there permission for third-party site, infrastructure, system or protected/non-public data? | `CANDIDATE / PENDING AUTHORIZATION`; no authorization is inferred from outreach. | Roadmap #839; compliance #840 | `PARTIAL` | Record written authorization + scope before access/deployment. |
| IT-06 | Privacy / GDPR | Are personal data, purpose, legal basis, minimization, retention, rights and roles documented? | Privacy-aware publication and sanitization principles exist. | README | `OPEN` | Produce processing inventory/privacy assessment; DPIA where required. |
| IT-07 | Cybersecurity | Are authentication, secrets, access, logging, vulnerabilities and incident response controlled? | Evidence-first technical controls exist in parts of the ecosystem; no global certification claimed. | repository tests/docs | `PARTIAL` | Maintain security baseline, threat model and incident-response process. |
| IT-08 | Evidence / provenance | Can material claims be traced to source, time, version and validation state? | Evidence/provenance architecture and public claim boundaries. | README; #839; #840 | `PARTIAL` | Attach claim-level evidence and responsible validator where applicable. |
| IT-09 | Public claims | Are `SUBMITTED`, `AUTHORIZED`, `VALIDATED`, partnership and funding claims kept distinct? | Public status vocabulary and evidence-before-claims rule. | #839; #840 | `READY FOR REVIEW` | Continue evidence-based updates; never infer approval from submission/contact. |
| IT-10 | DAO governance | Are binding decisions attributable to humans and conflicts/reviews documented? | Evidence-first DAO; AI/automation has no binding vote in proposed model. | DAO docs; README; #840 | `PARTIAL` | Formalize decision records, COI handling and authority boundaries. |
| IT-11 | Contributors | Does participation avoid falsely implying employment, guaranteed payment or representation? | Public contribution boundaries. | README; contribution docs; #840 | `READY FOR REVIEW` | Apply same wording to contributor tasks and bounty records. |
| IT-12 | MYZ / token | Could a planned feature trigger payment, crypto-asset, financial or other regulated obligations? | MYZ separated from environmental evidence/operational responsibility; regulated feature requires separate review. | README; #840 | `OPEN` | Obtain dedicated legal/regulatory assessment before regulated activation. |
| IT-13 | External settlement | Is external payment finality independently evidenced and authorized? | Stagenet implementation uses independent-verifier boundary; mainnet outside current milestone. | `docs/XMR-STAGENET-SETTLEMENT.md`; README | `PARTIAL` | Complete authorized stagenet E2E; separate review before production/mainnet. |
| IT-14 | Environmental pilots | Are baseline, KPI, method, data rights and responsible validation defined? | Pilot/evidence methodology exists; candidate tracks remain exploratory. | #838; #839 | `PARTIAL` | Obtain authorized scope and named validator before operational claims. |
| IT-15 | Cultural heritage | Does a pilot affect archaeological/cultural heritage or require competent authorization? | Amphitheatre track explicitly candidate/pending authorization. | #838 | `OPEN` | No field deployment until competent permissions and technical scope exist. |
| IT-16 | Workplace / operational safety | Are employer/site rules and worker responsibilities separated from MyZubster project roles? | Project participation does not itself create operational authority. | public governance boundaries | `OPEN` | Written scope/authorization for any work-linked pilot activity. |
| IT-17 | Public administration | Do procurement, transparency, digital-administration or other public-sector rules apply? | Institutional outreach is treated as exploratory, not approval. | #839 | `OPEN` | Follow the competent administration's formal procedure when identified. |
| IT-18 | Intellectual property | Are licenses, contributor rights and third-party assets respected? | Open-source contribution model distinguishes independent upstream work from partnership/adoption. | README; repository licenses/contribution records | `PARTIAL` | Maintain license/provenance review for imported code/data/media. |
| IT-19 | International replication | Are local rules assessed separately outside Italy/EU? | Singapore track is exploratory and not represented as authorized. | #839 | `OPEN` | Local legal/data/site review before any real deployment. |
| IT-20 | Independent review | Has the relevant compliance package received qualified independent review? | Public register and controls prepared. | this register + #840 | `OPEN` | Seek qualified legal/compliance review for actual high-impact/regulated deployments. |

## Deployment decision record

Before any real-world deployment, the responsible person should record at minimum:

```text
DEPLOYMENT / PILOT ID:
OWNER / RESPONSIBLE PERSON:
PURPOSE:
LOCATION / SYSTEM:
DATA CATEGORIES:
AI COMPONENTS:
THIRD-PARTY ACCESS:
AUTHORIZATION EVIDENCE:
PRIVACY ASSESSMENT:
SECURITY ASSESSMENT:
SECTOR-SPECIFIC REQUIREMENTS:
VALIDATOR / REVIEWER:
STATUS:
GO / NO-GO DECISION:
DATE:
EVIDENCE LINKS:
```

A `GO` decision must not override law, contractual restrictions, competent authority requirements or missing permissions.

## Claim decision record

Before publishing a material claim:

```text
CLAIM:
SOURCE:
EVIDENCE:
MEASURED / INTERPRETED / SIMULATED / ILLUSTRATIVE:
VALIDATION STATUS:
RESPONSIBLE REVIEWER:
PUBLIC / RESTRICTED:
DATE:
```

If the evidence does not support the claim, the claim must be changed or withheld.

## Relationship to current public records

- [#839 — Public Roadmap](https://github.com/MyZubster-Ecosystem/myzubster/issues/839)
- [#840 — Public compliance-by-design statement](https://github.com/MyZubster-Ecosystem/myzubster/issues/840)
- [#838 — Roman Amphitheatre candidate pilot](https://github.com/MyZubster-Ecosystem/myzubster/issues/838)
- [`README.md`](../README.md)
- [`docs/XMR-STAGENET-SETTLEMENT.md`](XMR-STAGENET-SETTLEMENT.md)

## Legal baseline

The public baseline currently references:

- **Regulation (EU) 2024/1689 — Artificial Intelligence Act**;
- **Italian Law 23 September 2025, no. 132 — Disposizioni e deleghe al Governo in materia di intelligenza artificiale**;
- other applicable EU/Italian rules according to the actual data, actors, sector and functionality, including privacy/data protection, cybersecurity, intellectual property, workplace safety, environmental/cultural-heritage requirements, public-sector rules and financial/crypto-asset regulation where relevant.

This register intentionally does **not** mark MyZubster globally `COMPLIANT`, `CERTIFIED` or `APPROVED`. Compliance is evaluated at the level of the actual system, role, data and use case, supported by evidence.