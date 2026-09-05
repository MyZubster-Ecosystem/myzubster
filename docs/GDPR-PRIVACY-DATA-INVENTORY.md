# MyZubster — GDPR Privacy & Data Inventory

**Status:** PUBLIC / LIVING REGISTER / PRIVACY-BY-DESIGN  
**Baseline:** 29 August 2026

> This is a technical/governance privacy baseline. It is not legal advice, a completed Article 30 record, a DPIA, DPO appointment, regulatory filing, certification or finding of GDPR compliance.

## Purpose

This register converts MyZubster's privacy-by-design commitment into explicit data-processing gates. It must be refined against the actual deployed systems, data flows, infrastructure, contracts and roles before any processing is represented as compliant.

Core privacy rule:

> **NO DEFINED PURPOSE + NO VALID BASIS + NO NECESSARY DATA → NO PERSONAL-DATA PROCESSING.**

Additional deployment rule:

> **HIGH-RISK PERSONAL-DATA PROCESSING → DPIA BEFORE PROCESSING.**

## GDPR baseline

The inventory is structured around the GDPR principles of lawfulness, fairness and transparency; purpose limitation; data minimisation; accuracy; storage limitation; integrity/confidentiality; and accountability.

For each real processing activity, the responsible actor must determine and document whether MyZubster acts as `CONTROLLER`, `JOINT CONTROLLER`, `PROCESSOR`, or does not process personal data for that activity. These roles are not assigned merely by a README or software architecture; they depend on who actually determines the purposes and means of processing.

## Status vocabulary

| Status | Meaning |
|---|---|
| `OPEN` | Required facts/evidence are missing. |
| `PARTIAL` | Some controls exist, but the processing gate is incomplete. |
| `READY FOR REVIEW` | Documentation exists and awaits qualified review. |
| `APPROVED FOR PROCESSING` | Internal status only; use after the responsible actor confirms all applicable gates. It is not regulator approval. |
| `BLOCKED` | Processing must not start/continue in the proposed form. |
| `N/A — JUSTIFIED` | Assessed as not applicable with recorded rationale. |

## Preliminary data inventory

| ID | Processing area | Possible data | Data subjects | Purpose | Role | Lawful basis | Retention | Recipients / transfer | Risk / DPIA | Status / next gate |
|---|---|---|---|---|---|---|---|---|---|---|
| DP-01 | GitHub/community contributions | GitHub username, public profile, issue/PR/comment content, contribution metadata | contributors | collaboration, review, provenance | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | GitHub/public repository | assess public-source and profiling risks | `OPEN` — map controller/processor roles and privacy notice |
| DP-02 | Contributor onboarding / DAO interest | alias/name, contact where supplied, contribution preferences, governance records | contributors | coordinate voluntary participation | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | authorized project reviewers; public only when appropriate | assess profiling/governance effects | `OPEN` — purpose, basis, retention, rights workflow |
| DP-03 | Website / application accounts | account identifiers, email where used, authentication/security metadata | users | account/access/security | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | hosting/auth providers as applicable | assess security and account risks | `OPEN` — inventory actual production stack |
| DP-04 | Website analytics / telemetry | IP/device/network metadata, event telemetry, cookies/identifiers if enabled | visitors/users | reliability, security, analytics | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | analytics/hosting providers if enabled | cookie/ePrivacy + GDPR assessment required | `OPEN` — verify what is actually collected |
| DP-05 | Real-world observations | media, location, timestamps; people/vehicles/identifiers may appear incidentally | observed individuals/contributors | evidence, mapping, environmental/project workflows | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | public only after authorization/sanitization | potentially elevated due to geolocation/media | `OPEN` — minimization/redaction + DPIA screening |
| DP-06 | Environmental / sensor data | primarily non-personal measurements; device/operator/location metadata may become personal | operators/contributors/people near sensors | monitoring/evidence/pilot analysis | `TO ASSESS` | `TO ASSESS` if personal data exists | `TO DEFINE` | authorized pilot actors | depends on sensor capability/location | `OPEN` — classify sensors and fields before pilot |
| DP-07 | GIS / maps / geolocation | coordinates, routes, site/location records; potentially contributor location | contributors/observed persons | mapping, evidence, pilot analysis | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | authorized/public outputs depending sensitivity | geolocation can increase privacy risk | `OPEN` — define precision/publication rules |
| DP-08 | Images / 3D / digital twin | photographs/video/3D capture; faces or other identifiers may be captured | people present at capture sites | documentation, reconstruction, evidence | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | authorized reviewers; sanitized public outputs | DPIA screening for systematic/public-area monitoring | `OPEN` — capture policy, redaction, authorization |
| DP-09 | AI / Zorgax processing | prompts, evidence records, contributor text, metadata, model outputs | users/contributors/observed persons | bounded analysis, classification, evidence preparation | `TO ASSESS` | inherits/depends on source processing | `TO DEFINE` | AI/service providers if actually used | assess automated evaluation, profiling and provider transfers | `OPEN` — map each model/provider/data flow |
| DP-10 | Support / institutional email | names, email addresses, signatures, correspondence | correspondents | communication, outreach, project administration | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | email provider; authorized project participants | ordinary correspondence unless sensitive content | `OPEN` — retention/access/privacy information |
| DP-11 | Pilot authorization / validation records | names, roles, signatures/contact details, professional validation | officials, professionals, project contacts | prove authorization, responsibility, validation | `TO ASSESS` | `TO ASSESS` | aligned with accountability/legal needs | authorized stakeholders; selected public evidence may be minimized | assess publication necessity | `OPEN` — distinguish internal evidence from public evidence |
| DP-12 | Security / audit logs | account/user IDs, IPs, timestamps, security events | users/admins/contributors | security, abuse prevention, incident investigation | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | authorized security staff/providers | security-sensitive; access must be restricted | `OPEN` — logging specification + retention |
| DP-13 | Rewards / settlement | contributor identifier, reward record; wallet/address/transaction evidence where applicable | contributors/payees | reward accounting / optional settlement | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | payment/settlement infrastructure if activated | financial identifiers + compliance obligations | `OPEN` — separate review before real settlement |
| DP-14 | Research / replication datasets | depends on dataset; may include pseudonymous/public-source data | dataset subjects | research, reproducibility, replication | `TO ASSESS` | `TO ASSESS` | `TO DEFINE` | researchers/authorized collaborators/public if lawful | dataset-specific DPIA/ethics/licence assessment | `OPEN` — dataset intake checklist |

## Mandatory processing record fields

For every processing activity that moves beyond design/demo, record:

```text
PROCESSING ID:
SYSTEM / REPOSITORY:
CONTROLLER:
JOINT CONTROLLER (if any):
PROCESSOR(S):
DPO / PRIVACY CONTACT (if applicable):
PURPOSE(S):
DATA SUBJECT CATEGORIES:
PERSONAL-DATA CATEGORIES:
SPECIAL-CATEGORY / CRIMINAL-OFFENCE DATA:
SOURCE:
LAWFUL BASIS:
LEGITIMATE-INTEREST ASSESSMENT (if used):
RECIPIENTS:
THIRD-COUNTRY / INTERNATIONAL TRANSFERS:
TRANSFER SAFEGUARD:
RETENTION / DELETION RULE:
SECURITY MEASURES:
PRIVACY NOTICE:
RIGHTS REQUEST PROCESS:
AUTOMATED DECISION / PROFILING:
DPIA SCREENING:
DPIA REQUIRED?:
OWNER / REVIEWER:
STATUS:
EVIDENCE LINKS:
LAST REVIEW:
```

## Lawful-basis gate

A lawful basis must be identified from the facts of the processing before personal-data processing is activated. Possible GDPR Article 6 bases include consent, contract, legal obligation, vital interests, public task/official authority, and legitimate interests where legally available and appropriately balanced.

Do **not** default every MyZubster processing activity to consent or legitimate interests. The basis must fit the real purpose, relationship and context.

## Data minimisation and publication gate

Public/open-source does not mean personal data should be public.

Before publishing an observation, evidence package, pilot record, screenshot, image, log or dataset:

1. identify personal data;
2. determine whether publication is necessary and lawful;
3. remove unnecessary identifiers and metadata;
4. reduce location precision where appropriate;
5. redact faces, plates, contact details, credentials and unrelated personal information when needed;
6. separate restricted/raw evidence from sanitized public evidence;
7. preserve provenance without exposing unnecessary personal data.

## Privacy notice gate

Where GDPR transparency duties apply, the relevant privacy information should identify, as applicable, the responsible controller/contact, purposes, categories of data, lawful basis, retention, recipients/transfers, data-subject rights and complaint route. Where data is obtained indirectly, source/transparency requirements must also be assessed.

`NO ADEQUATE NOTICE WHEN REQUIRED → NO PRODUCTION PROCESSING.`

## Data-subject rights workflow

Before production processing involving personal data, establish a documented path for applicable requests concerning:

- access;
- rectification;
- erasure;
- restriction;
- portability where applicable;
- objection;
- consent withdrawal where consent is the basis;
- safeguards/rights concerning automated decision-making where applicable.

Requests must be attributable, tracked, securely handled and closed with evidence without exposing the requester's data publicly.

## DPIA screening

A DPIA must be screened **before** processing where the proposed activity may create high risk to individuals. Particular attention is required for, among other things:

- systematic and extensive automated evaluation/profiling with significant effects;
- large-scale processing of sensitive data;
- systematic monitoring of publicly accessible areas on a large scale;
- combinations of AI, geolocation, sensor/camera data or vulnerable persons that materially raise risk.

If a DPIA is required, the deployment remains `BLOCKED / PENDING DPIA` until it is completed and residual-risk requirements are addressed. Where applicable, prior consultation with the competent supervisory authority must be assessed.

## Security baseline

Personal-data systems should apply proportionate technical and organisational measures, including as applicable:

```text
LEAST PRIVILEGE
MFA / STRONG AUTHENTICATION
SECRET MANAGEMENT
ENCRYPTION IN TRANSIT / AT REST WHERE APPROPRIATE
ACCESS LOGGING
BACKUP / RECOVERY
VULNERABILITY MANAGEMENT
DATA MINIMISATION
PSEUDONYMISATION / REDACTION
RETENTION + DELETION
INCIDENT / BREACH RESPONSE
PROCESSOR / VENDOR REVIEW
```

No public repository should contain passwords, private keys, wallet seeds, access tokens or protected raw personal datasets.

## Processor / vendor gate

Before sending personal data to an external hosting, analytics, AI, email, storage or other service provider, record:

```text
PROVIDER:
SERVICE:
DATA SENT:
ROLE:
PROCESSING TERMS / DPA:
LOCATION / TRANSFER:
SUBPROCESSORS:
RETENTION:
SECURITY:
MODEL TRAINING / SECONDARY USE (if relevant):
EXIT / DELETION PATH:
APPROVAL STATUS:
```

## Relationship to MyZubster compliance documents

- [`ITALY-COMPLIANCE-REGISTER.md`](ITALY-COMPLIANCE-REGISTER.md)
- [`AI-INVENTORY-AI-ACT-CLASSIFICATION.md`](AI-INVENTORY-AI-ACT-CLASSIFICATION.md)
- [#840 — Public compliance-by-design statement](https://github.com/MyZubster-Ecosystem/myzubster/issues/840)
- [#839 — Public roadmap](https://github.com/MyZubster-Ecosystem/myzubster/issues/839)
- [`README.md`](../README.md)

## Public status after this baseline

This document improves the documentation layer for `IT-06 Privacy / GDPR`, but it does **not** close that gate by itself.

To move `IT-06` from `OPEN` toward `READY FOR REVIEW`, MyZubster still needs to verify the actual production data flows and complete at least:

1. controller/processor allocation;
2. actual data/system inventory;
3. lawful basis per processing purpose;
4. retention/deletion schedule;
5. privacy notices where required;
6. processor/vendor and international-transfer mapping;
7. rights-request workflow;
8. DPIA screening and DPIA where required;
9. security/incident-response evidence;
10. qualified review for higher-risk processing.

## Legal references

- Regulation (EU) 2016/679 (GDPR), including Articles 5, 6, 12–14, 24–25, 28, 30, 32–36 and applicable rights provisions.
- European Commission GDPR guidance on processing principles, controller/processor roles, transparency, privacy by design/default and DPIA.

**No privacy register entry should be interpreted as regulator approval or proof that a future implementation is compliant. Evidence from the actual implementation controls the status.**