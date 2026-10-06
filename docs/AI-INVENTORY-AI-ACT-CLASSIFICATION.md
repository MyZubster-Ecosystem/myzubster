# MyZubster — AI Inventory & AI Act Classification Register

**Status:** PUBLIC / PRELIMINARY CLASSIFICATION / LIVING REGISTER  
**Baseline:** 29 August 2026

> This is a technical/governance inventory for compliance-by-design. It is not legal advice, a conformity assessment, certification, regulatory approval, or a final legal classification. Classification must be re-checked against the actual implementation and deployment context before release or material change.

## Why this register exists

Regulation (EU) 2024/1689 (AI Act) distinguishes roles including **provider** and **deployer** and applies different obligations depending on the system, role and use context. Article 50 transparency obligations apply from 2 August 2026.

MyZubster therefore does not classify “the whole project” once and for all. Each AI-enabled component/use case is recorded separately.

Core gate:

> **IDENTIFY SYSTEM → IDENTIFY ROLE → IDENTIFY USE CASE → ASSESS RISK / ARTICLE 50 → DEFINE HUMAN CONTROL → COLLECT EVIDENCE → GO / NO-GO**

## Role vocabulary

- **Provider candidate** — MyZubster develops or has an AI system developed and may place it on the market or put it into service under its own name/trademark. Final role depends on the actual release and control structure.
- **Deployer candidate** — MyZubster uses a third-party AI system under its authority for professional/project activity.
- **Tool / non-AI pending assessment** — automation or deterministic processing that must not be labelled an AI system without checking the Article 3 definition.
- **External provider dependency** — underlying model/service supplied by another provider; MyZubster's own role must still be assessed for the surrounding system/use.

## Preliminary inventory

| AI-ID | Component / use case | Intended function | Preliminary MyZubster role | Direct human interaction? | Generates/manipulates content? | Potential high-risk trigger | Human control | Current status / gate |
|---|---|---|---|---|---|---|---|---|
| AI-01 | Zorgax orchestration | Routing, schema checks, normalization, provenance preparation, anomaly support, draft evidence | `PROVIDER CANDIDATE` for MyZubster-developed orchestration; `DEPLOYER CANDIDATE` for embedded third-party models | Possibly, depending on UI | Possibly text/draft evidence | No high-risk classification established; depends on actual deployment | Human technical/scientific review before validated claims/actions | `PARTIAL` — document model dependencies, intended purpose, user-facing interaction and decision boundaries |
| AI-02 | Evidence drafting / summarization | Prepare summaries, reports, evidence narratives and structured drafts | `DEPLOYER CANDIDATE` where third-party generative AI is used; provider analysis required if released as MyZubster AI system | Not necessarily | Yes — text | No high-risk trigger established from current evidence | Human review/editorial control required for material public claims | `PARTIAL` — implement provenance + AI-content/transparency assessment |
| AI-03 | DAO assistance | Proposal preparation, classification, review support, evidence organization | `PROVIDER/DEPLOYER CANDIDATE` depending implementation | Possibly | Possibly | Governance assistance is not automatically high-risk; consequential deployment must be separately assessed | AI has no binding vote; binding decisions attributable to humans | `PARTIAL` — document authority matrix and interaction disclosure where applicable |
| AI-04 | Sensor / environmental anomaly support | Identify patterns/anomalies in authorized sensor/environmental datasets | `PROVIDER CANDIDATE` if MyZubster develops the system; otherwise `DEPLOYER CANDIDATE` | No expected direct interaction | Predictions/classifications rather than synthetic public content | No high-risk classification established; sector/use context may change assessment | Qualified human interpretation/validation; AI output not measurement or professional conclusion by itself | `OPEN` — define models, datasets, intended purpose, accuracy limits and validator |
| AI-05 | GIS / spatial analysis assistance | Support geospatial organization, pattern detection and evidence preparation | `PROVIDER/DEPLOYER CANDIDATE` | Usually no | May generate recommendations/derived outputs | No high-risk classification established; actual public/heritage/critical use must be reassessed | Human GIS/technical validation | `OPEN` — inventory algorithms/models and authorized data sources |
| AI-06 | 3D / digital-twin assistance | Assist reconstruction, classification or generation for visualization/reproducibility | `PROVIDER/DEPLOYER CANDIDATE` | Possibly | May generate/manipulate images/3D representations | No high-risk classification established | Generated/simulated material must remain distinguishable from measured/validated evidence | `OPEN` — Article 50/content-marking applicability review per output type |
| AI-07 | Public chatbot / AI agent | Direct conversational assistance if/when exposed to users | `PROVIDER CANDIDATE` if released under MyZubster name; external model provider may also have separate obligations | **Yes** | Yes | No high-risk classification established solely from chatbot function | User disclosure + bounded authority + human escalation for consequential matters | `PENDING DEPLOYMENT REVIEW` — Article 50(1) disclosure gate before public activation |
| AI-08 | AI-generated public text/media | Public informational, educational, roadmap or communication content assisted/generated by AI | Usually `DEPLOYER CANDIDATE`; role may vary if MyZubster supplies the generating system | Public exposure rather than necessarily direct interaction | **Yes** | Not classified high-risk from current evidence | Human editorial review for material claims; disclosure/marking assessment | `PARTIAL` — assess Article 50(2)/(4) per provider/deployer role and content context |
| AI-09 | Contributor / issue triage | Classify issues, route tasks, suggest labels/priorities, draft responses | `PROVIDER/DEPLOYER CANDIDATE` | Indirectly | May generate text/recommendations | Must not become employment/access decision automation without separate assessment | Human review for assignment, reward, membership or consequential decisions | `PARTIAL` — prohibit autonomous consequential contributor decisions |
| AI-10 | Pilot decision support | Combine evidence to assist GO/NO-GO preparation | `PROVIDER/DEPLOYER CANDIDATE` | No expected direct interaction | Recommendations | Risk classification depends on sector and consequences; no final classification yet | AI cannot authorize site/data access or replace competent professional/authority decision | `OPEN` — per-pilot assessment mandatory before operational use |

## Article 50 transparency gate

Article 50 requires a use-specific assessment. At minimum, MyZubster must check:

### Direct interaction
If MyZubster is the **provider** of an AI system intended to interact directly with natural persons, the system must be designed so people are informed that they are interacting with AI unless this is obvious in the circumstances.

### Synthetic content
If MyZubster is the relevant **provider** of a system generating synthetic audio, image, video or text, assess the machine-readable marking/detectability requirements and applicable exceptions.

### Deployer disclosures
Where MyZubster acts as **deployer**, assess disclosure duties for relevant emotion-recognition/biometric-categorisation use, deepfakes, and AI-generated/manipulated text published to inform the public on matters of public interest where the statutory conditions apply.

### Current MyZubster rule

```text
PUBLIC AI INTERACTION
→ DISCLOSE AI WHEN REQUIRED

AI-GENERATED / MANIPULATED OUTPUT
→ IDENTIFY PROVIDER + DEPLOYER ROLE
→ CHECK ARTICLE 50 MARKING / LABELLING
→ RECORD HUMAN REVIEW

CONSEQUENTIAL DECISION
→ HUMAN AUTHORITY REQUIRED
→ SEPARATE RISK / SECTOR ASSESSMENT
```

## High-risk screening questions

For every AI-ID before deployment, answer and evidence:

1. Does the system fall within the AI Act definition of an AI system?
2. What is the precise intended purpose?
3. Is MyZubster provider, deployer, importer, distributor, product manufacturer, or more than one role?
4. Is an external GPAI/model provider involved?
5. Does the system fall into a prohibited-practice scenario? If yes: **NO-GO**.
6. Could the intended use fall under an Annex III high-risk area or be a safety component of a regulated product? If potentially yes: escalate to dedicated assessment before deployment.
7. Does Article 50 apply to interaction or generated/manipulated content?
8. Are personal data or special-category data involved?
9. Can the output affect rights, safety, employment, access to services, public decisions or another consequential interest?
10. What human oversight is required and who is accountable?
11. What logs, provenance, instructions, accuracy/limitations and validation evidence are retained?
12. Has the use case materially changed since the previous classification?

## Required per-system evidence record

```text
AI-ID:
SYSTEM NAME / VERSION:
OWNER:
INTENDED PURPOSE:
MODEL(S) / EXTERNAL PROVIDER(S):
INPUT DATA:
OUTPUTS:
USERS / AFFECTED PERSONS:
MYZUBSTER ROLE(S):
DIRECT HUMAN INTERACTION: YES / NO
SYNTHETIC CONTENT: YES / NO
ARTICLE 50 ASSESSMENT:
PROHIBITED-PRACTICE SCREEN:
HIGH-RISK SCREEN:
GDPR / DATA ASSESSMENT:
HUMAN OVERSIGHT:
LIMITATIONS:
LOGGING / PROVENANCE:
SECURITY CONTROLS:
EVIDENCE LINKS:
REVIEWER:
DATE:
DECISION: GO / CONDITIONAL GO / NO-GO
NEXT REVIEW DATE / CHANGE TRIGGER:
```

## Change-control rule

Classification must be reopened when there is a material change to, for example:

- intended purpose;
- model/provider;
- training or operational data;
- affected persons;
- degree of autonomy;
- deployment sector/location;
- integration with physical infrastructure;
- decision consequences;
- public interaction;
- content generation/publication;
- applicable law or authoritative guidance.

A previous `GO` is not a permanent authorization for a materially different system or use case.

## Relationship to MyZubster public compliance

- [`ITALY-COMPLIANCE-REGISTER.md`](ITALY-COMPLIANCE-REGISTER.md) — overall Italy compliance register
- [#840 — Public compliance-by-design statement](https://github.com/MyZubster-Ecosystem/myzubster/issues/840)
- [#839 — Public roadmap](https://github.com/MyZubster-Ecosystem/myzubster/issues/839)
- [`../README.md`](../README.md) — public project boundaries

## Primary regulatory baseline

- Regulation (EU) 2024/1689 (AI Act), including Article 3 definitions and Article 50 transparency obligations.
- European Commission, **Guidelines on transparency obligations for providers and deployers of certain AI systems**, published July 2026; Article 50 obligations apply from 2 August 2026.
- Italian Law 23 September 2025, no. 132, where applicable together with the EU framework and other sector-specific law.

## Current conclusion

This inventory does **not** establish that every MyZubster component is low-risk, high-risk, compliant or exempt. It establishes a public process that prevents those conclusions from being asserted without a component-level assessment and evidence.

**No final AI Act classification → no claim of final AI Act compliance.**