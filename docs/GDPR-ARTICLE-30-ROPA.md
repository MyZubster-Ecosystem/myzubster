# MyZubster — GDPR Article 30 Record of Processing Activities (RoPA)

**Status:** PUBLIC TEMPLATE / LIVING REGISTER / NOT YET A FINAL GDPR COMPLIANCE DETERMINATION  
**Baseline:** 29 August 2026

> This document operationalises the MyZubster privacy/data inventory into an Article 30-style record. It is a governance and accountability artefact, not legal advice, certification, a DPIA, or a declaration that every processing activity is compliant.

## Core rule

> **NO DEFINED PURPOSE + NO VALID BASIS + NO NECESSARY DATA → NO PERSONAL-DATA PROCESSING.**

For every real processing activity, the responsible controller/processor must replace placeholders with verified facts before relying on this register as evidence.

## Controller / processor identity

| Field | Current state |
|---|---|
| Controller | `TO DEFINE PER ACTIVITY` |
| Joint controller(s) | `TO ASSESS` |
| Processor(s) | `TO INVENTORY / VERIFY` |
| EU representative | `N/A OR TO ASSESS` |
| DPO | `TO ASSESS WHETHER REQUIRED` |
| Privacy contact | `TO DEFINE` |

The legal role is determined by the real allocation of purposes and means, not merely by labels in this document.

## Processing register

| ID | Processing activity | Data subjects | Personal-data categories | Purpose | Art. 6 basis | Recipients / processors | International transfer | Retention | Security baseline | DPIA screening | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ROPA-01 | Open-source contributor / DAO participation | contributors, maintainers | GitHub identity, username, contribution history, public comments, optional contact data | collaboration, review, provenance, governance records | `TO CONFIRM` | GitHub + authorised project maintainers | `TO ASSESS` | `TO DEFINE` | account security, least privilege, public/private separation | screen if profiling/monitoring expands | `PARTIAL` |
| ROPA-02 | User/account access | users, administrators | identifiers, account metadata, authentication/security events | provide and secure access | `TO CONFIRM` | hosting/auth providers `TO INVENTORY` | `TO ASSESS` | `TO DEFINE` | authentication, secrets protection, access logging | `TO ASSESS` | `OPEN` |
| ROPA-03 | Website/app analytics | visitors/users | IP/online identifiers, device/browser, events; cookies if used | service operation, measurement, improvement | `TO CONFIRM` | analytics/hosting vendors `TO INVENTORY` | `TO ASSESS` | `TO DEFINE` | minimisation, aggregation/pseudonymisation where possible | screen for systematic tracking/profiling | `OPEN` |
| ROPA-04 | Contributor communications | contributors, applicants, stakeholders | email/contact details, message content, professional context | respond, coordinate work, maintain evidence of decisions | `TO CONFIRM` | mail/workspace providers + authorised recipients | `TO ASSESS` | `TO DEFINE` | access control, recipient checks, restricted sharing | normally screen low; reassess for sensitive data | `PARTIAL` |
| ROPA-05 | Institutional / pilot communications | institutional contacts, technical contacts | business contact details, correspondence, role/organisation | exploratory outreach, authorization requests, pilot coordination | `TO CONFIRM` | mail/workspace providers, authorised project personnel | `TO ASSESS` | `TO DEFINE` | access control, evidence classification | `TO ASSESS` | `PARTIAL` |
| ROPA-06 | Authorization & evidence records | signatories, responsible persons, validators | identity, role, contact, signatures/approval metadata where applicable | prove scope, authorization, accountability and validation | `TO CONFIRM` | authorised reviewers / competent parties | `TO ASSESS` | linked to legal/evidence retention need; `TO DEFINE` | integrity controls, provenance, restricted access where needed | `TO ASSESS` | `PARTIAL` |
| ROPA-07 | Environmental observations / field records | persons incidentally captured or identified | names/roles, notes, possibly images/location metadata | environmental/pilot evidence and validation | `TO CONFIRM BEFORE REAL PILOT` | authorised pilot participants/validators | `TO ASSESS` | `TO DEFINE BEFORE PILOT` | minimisation, access control, remove unnecessary identifiers | required screening before monitoring involving identifiable persons | `OPEN` |
| ROPA-08 | Sensor / IoT telemetry | potentially workers, visitors or users if telemetry becomes linkable to people | device IDs, timestamps, location, operational telemetry; personal data only if identifiable/linkable | environmental/operational measurement | `TO CONFIRM BEFORE REAL PILOT` | authorised technical parties/processors | `TO ASSESS` | `TO DEFINE BEFORE PILOT` | network/device security, access control, minimisation | mandatory screening before systematic monitoring | `OPEN` |
| ROPA-09 | GIS / geolocation | contributors, workers, visitors or other persons only if identifiable | coordinates, timestamps, routes/locations if linked to individuals | mapping, evidence, pilot analysis | `TO CONFIRM BEFORE PERSONAL GEOLOCATION` | authorised GIS/pilot parties | `TO ASSESS` | `TO DEFINE` | separate personal identifiers from geospatial evidence | high-priority DPIA screening if systematic individual tracking | `OPEN` |
| ROPA-10 | Images / video / 3D capture | identifiable people incidentally or intentionally captured | image/video, appearance, location/time metadata; no biometric identification unless separately authorised/assessed | documentation, mapping, digital twin/evidence | `TO CONFIRM BEFORE CAPTURE` | authorised project/technical parties | `TO ASSESS` | `TO DEFINE` | avoid unnecessary people, redaction/access control where needed | DPIA screening for systematic public-area monitoring or biometric use | `OPEN` |
| ROPA-11 | AI / Zorgax processing of user-provided material | users, contributors, people named in inputs | prompt/content, account/context metadata, personal data contained in submitted material | assistance, analysis, drafting, evidence workflow | `TO CONFIRM PER FEATURE` | AI/model/hosting providers `TO INVENTORY` | `TO ASSESS` | `TO DEFINE` | data minimisation, access control, vendor controls, human review | screen for profiling, sensitive data, consequential decisions | `OPEN` |
| ROPA-12 | Contributor triage / governance assistance | contributors | public contribution history, technical activity, proposals, review metadata | organise work and assist human governance | `TO CONFIRM` | authorised maintainers; AI vendor if used | `TO ASSESS` | `TO DEFINE` | human decision authority, purpose limitation, contestability | DPIA screening before systematic evaluation/profiling | `OPEN` |
| ROPA-13 | Security logs / abuse prevention | users, administrators, attackers/suspected abuse actors | IP, account ID, timestamps, request/security events | security, fraud/abuse prevention, incident investigation | `TO CONFIRM` | hosting/security providers, authorised responders | `TO ASSESS` | security-based retention schedule `TO DEFINE` | restricted access, integrity, alerting, secret redaction | `TO ASSESS` | `OPEN` |
| ROPA-14 | Reward / settlement evidence | contributors, recipients, operators | identifiers, wallet/payment references, contribution/settlement evidence; financial data if introduced | verify authorised reward/settlement workflow | `TO CONFIRM BEFORE REAL PAYMENT` | payment/settlement infrastructure + authorised reviewers | `TO ASSESS` | legal/accounting/security schedule `TO DEFINE` | separation from public environmental evidence, least privilege | screen before regulated/financial deployment | `OPEN` |
| ROPA-15 | Research datasets | dataset subjects where identifiable | dataset-specific; may include public, pseudonymised or personal records | research, testing, validation | `TO CONFIRM PER DATASET` | authorised researchers/processors | `TO ASSESS` | dataset-specific `TO DEFINE` | provenance, access controls, pseudonymisation/anonymisation where appropriate | dataset-specific screening | `OPEN` |

## Article 30 completion gate

Before a row can move to `READY FOR REVIEW`, record and verify:

1. controller and, where applicable, joint controller / processor;
2. precise purpose(s);
3. categories of data subjects and personal data;
4. recipients / processor categories;
5. international transfers and safeguards where applicable;
6. retention / deletion period or criteria;
7. general technical and organisational security measures;
8. legal basis and any additional conditions for special-category/criminal-offence data;
9. privacy-notice mapping and rights-handling route;
10. DPIA screening result and, where required, completed DPIA before processing.

## DPIA screening gate

Set `DPIA REQUIRED / POSSIBLY REQUIRED / NOT INDICATED — REASONED` before deployment. Escalate particularly where the proposed processing involves new technologies combined with likely high risk, systematic/extensive automated evaluation or profiling, large-scale sensitive data, systematic monitoring of publicly accessible areas, or combinations of location/behaviour/identity that materially increase risk.

A DPIA, when required, must occur **before** the relevant processing. If residual high risk cannot be sufficiently mitigated, the competent supervisory-authority consultation requirement must be assessed before proceeding.

## Processor / vendor register

No vendor is automatically approved merely because its service is technically integrated.

| Vendor / service | Function | Controller/processor role | Data categories | Processing location / transfer | Contract / DPA | Sub-processors | Security evidence | Status |
|---|---|---|---|---|---|---|---|---|
| GitHub | source collaboration / issues / PRs | `TO ASSESS` | account/contribution data | `TO VERIFY` | `TO VERIFY` | `TO VERIFY` | `TO VERIFY` | `INVENTORY NEEDED` |
| AI/model provider(s) | AI assistance | `TO ASSESS PER FEATURE` | prompts/content/context | `TO VERIFY` | `TO VERIFY` | `TO VERIFY` | `TO VERIFY` | `INVENTORY NEEDED` |
| Hosting / infrastructure | application operation | `TO ASSESS` | account/log/application data | `TO VERIFY` | `TO VERIFY` | `TO VERIFY` | `TO VERIFY` | `INVENTORY NEEDED` |
| Email/workspace provider(s) | communications / evidence | `TO ASSESS` | contact/message/document data | `TO VERIFY` | `TO VERIFY` | `TO VERIFY` | `TO VERIFY` | `INVENTORY NEEDED` |

## Data-subject rights workflow

Before production processing of personal data, define a verifiable route for access, rectification, erasure, restriction, portability where applicable, objection, and rights related to automated decision-making where applicable. Requests must be authenticated proportionately and logged without exposing unnecessary personal data publicly.

```text
REQUEST ID:
DATE RECEIVED:
RIGHT REQUESTED:
IDENTITY CHECK METHOD:
SYSTEMS / DATA SOURCES SEARCHED:
DECISION:
LEGAL REASON / EXCEPTION IF ANY:
ACTION TAKEN:
DATE COMPLETED:
RESPONSIBLE REVIEWER:
EVIDENCE LOCATION:
```

## Personal-data deployment gate

```text
FEATURE / PILOT:
CONTROLLER:
PROCESSOR(S):
PURPOSE:
DATA SUBJECTS:
PERSONAL DATA:
SPECIAL / CRIMINAL DATA:
LEGAL BASIS:
NOTICE PROVIDED:
RETENTION:
RECIPIENTS:
INTERNATIONAL TRANSFERS:
SECURITY CONTROLS:
DPIA SCREENING:
DPIA REQUIRED?:
AUTHORIZATION / CONTRACT EVIDENCE:
RESPONSIBLE HUMAN:
GO / NO-GO:
DATE:
```

`GO` is prohibited while required privacy facts, permissions, contracts, safeguards or impact assessments are missing.

## Public/private evidence boundary

The public repository should demonstrate governance without unnecessarily publishing personal data. Evidence links may point to restricted records where public disclosure would conflict with privacy, confidentiality, security, contractual restrictions or legal obligations. Public claims should state the existence/status of evidence without exposing protected content.

## Relationship to MyZubster compliance documents

- [`GDPR-PRIVACY-DATA-INVENTORY.md`](GDPR-PRIVACY-DATA-INVENTORY.md)
- [`ITALY-COMPLIANCE-REGISTER.md`](ITALY-COMPLIANCE-REGISTER.md)
- [`AI-INVENTORY-AI-ACT-CLASSIFICATION.md`](AI-INVENTORY-AI-ACT-CLASSIFICATION.md)
- [Public compliance statement #840](https://github.com/MyZubster-Ecosystem/myzubster/issues/840)

## Legal baseline

Primary baseline: Regulation (EU) 2016/679 (GDPR), including accountability, controller/processor responsibilities, records of processing activities, security and data-protection impact assessment requirements. Italian supervisory guidance should be checked for the actual processing operation.

This register intentionally does **not** claim that a placeholder, repository entry, technical integration or public policy establishes a legal basis, controller role, processor agreement, transfer safeguard or completed DPIA.