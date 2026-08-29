# MyZubster — Cybersecurity Baseline, Threat Model & Incident Response Register

**Status:** PUBLIC / LIVING SECURITY CONTROL DOCUMENT  
**Baseline date:** 29 August 2026

> This document establishes a minimum security and incident-response baseline. It is not an ISO certification, NIS2 applicability determination, penetration-test report, security guarantee or regulatory approval.

## 1. Security principles

MyZubster applies these default rules:

> **NO AUTHORIZATION → NO ACCESS**  
> **NO VERIFIED SECRET HANDLING → NO PRODUCTION SECRET**  
> **NO SECURITY REVIEW → NO HIGH-IMPACT DEPLOYMENT**  
> **INCIDENT → CONTAIN, PRESERVE EVIDENCE, RECOVER, REVIEW**

Security controls must be proportionate to the actual system, data, threat and deployment context.

## 2. Baseline control register

| ID | Control area | Minimum requirement | Evidence expected | Status |
|---|---|---|---|---|
| SEC-01 | Asset inventory | Identify repositories, services, APIs, databases, devices, cloud resources and critical dependencies. | maintained asset register | `OPEN` |
| SEC-02 | Identity & access | Least privilege; individual accounts where practical; remove obsolete access. | access review / role matrix | `PARTIAL` |
| SEC-03 | Authentication | Strong authentication; MFA for privileged/external administration where supported. | configuration evidence | `PARTIAL` |
| SEC-04 | Secrets | No credentials/API keys/private keys in public source, issues, logs or evidence records. | secret-scanning/config evidence | `PARTIAL` |
| SEC-05 | Repository security | Protected change workflow for security-sensitive code; review and CI where available. | branch/review/CI evidence | `PARTIAL` |
| SEC-06 | Dependency security | Track dependencies and known vulnerabilities; patch based on risk. | lockfiles/scans/update records | `PARTIAL` |
| SEC-07 | Secure development | Validate inputs, authorize operations, handle errors safely and test security boundaries. | tests/reviews | `PARTIAL` |
| SEC-08 | Data protection | Minimize sensitive data; restrict access; encrypt in transit and at rest where appropriate. | architecture/configuration | `OPEN` |
| SEC-09 | Logging | Record security-relevant events without leaking unnecessary personal data or secrets. | logging specification | `OPEN` |
| SEC-10 | Monitoring | Define signals for auth abuse, anomalous access, failures and security events. | alerts/runbook | `OPEN` |
| SEC-11 | Backup & recovery | Identify critical data/configuration and establish recoverable backups where required. | backup/recovery test | `OPEN` |
| SEC-12 | Vulnerability handling | Provide triage, severity, remediation, retest and disclosure workflow. | vulnerability register | `PARTIAL` |
| SEC-13 | Supply chain | Assess material third-party libraries, services, APIs and infrastructure dependencies. | supplier/dependency register | `OPEN` |
| SEC-14 | Incident response | Maintain roles, severity, containment, eradication, recovery and post-incident review. | this document + incident records | `PARTIAL` |
| SEC-15 | Business continuity | Identify critical functions and acceptable recovery objectives before production reliance. | continuity/recovery plan | `OPEN` |
| SEC-16 | Physical/IoT | Protect sensors, gateways and field equipment from unauthorized access/tampering. | pilot security plan | `OPEN` |
| SEC-17 | AI/agent security | Treat model/tool output as untrusted; protect tool permissions and prevent autonomous privilege escalation. | agent threat model/tests | `OPEN` |
| SEC-18 | Payment/token boundary | Separate experimental token/payment logic from production financial authority and secrets. | architecture + authorization review | `PARTIAL` |
| SEC-19 | Privacy incident | Assess whether an incident is also a personal-data breach and activate GDPR workflow if applicable. | incident/privacy assessment | `OPEN` |
| SEC-20 | Security review | High-impact deployments require documented security GO/NO-GO decision. | signed/attributable decision record | `OPEN` |

`PARTIAL` does not mean certified or fully implemented. It means some public/project controls exist but implementation evidence remains to be completed or reviewed.

## 3. Threat model

### Protected assets

- source code and release integrity;
- contributor and administrator identities;
- credentials, API keys, signing/private keys and tokens;
- evidence/provenance records;
- personal data and communications;
- sensor, GIS and pilot data;
- AI/agent tool permissions;
- settlement/payment-related state;
- repositories, CI/CD and deployment infrastructure;
- availability and integrity of public MyZubster services.

### Trust boundaries

1. public Internet ↔ MyZubster services;
2. contributor ↔ GitHub/repository workflow;
3. AI/agent ↔ tools/APIs/external systems;
4. MyZubster ↔ third-party data/services;
5. sensor/field device ↔ gateway/backend;
6. evidence source ↔ evidence registry;
7. experimental payment/token layer ↔ external settlement infrastructure;
8. public/open data ↔ restricted/personal/protected data.

### Priority threat scenarios

| Threat | Example | Main impact | Required mitigation |
|---|---|---|---|
| Credential compromise | stolen token/account | unauthorized code/data changes | MFA, least privilege, revocation, monitoring |
| Secret leakage | key committed to repo/log | service/data compromise | secret scanning, rotation, no public secrets |
| Supply-chain compromise | malicious dependency/action | code execution/build compromise | pin/review dependencies, provenance, updates |
| Unauthorized deployment | pilot activated without permission | legal/physical/security impact | authorization gate + GO/NO-GO |
| Evidence tampering | source/provenance changed | false public/technical conclusions | immutable/versioned evidence, hashes where useful, review |
| Prompt/tool injection | hostile content manipulates agent | unauthorized tool action/data disclosure | treat external content as untrusted, scoped tools, human approval for high-impact actions |
| Excessive agent authority | automation can bind/deploy/pay | operational/legal/financial impact | human authorization, scoped credentials, separation of duties |
| API abuse | injection/replay/rate abuse | integrity/availability loss | validation, auth, rate controls, replay protections as relevant |
| Personal-data exposure | public log/evidence contains PII | privacy harm | minimization, access controls, redaction, breach workflow |
| Sensor spoofing/tampering | fabricated field measurement | invalid evidence/decisions | device identity, calibration/provenance, anomaly review |
| GIS/location leakage | sensitive exact coordinates exposed | physical/privacy/heritage risk | classification, access control, precision reduction where needed |
| CI/CD compromise | malicious workflow/release | ecosystem compromise | least-privileged CI, review, protected secrets, release provenance |
| Denial of service | service/resource exhaustion | availability loss | limits, monitoring, recovery plan |
| Payment/settlement error | false finality/double processing | financial/accounting impact | independent verification, idempotency, separation from experimental state |
| Insider misuse | authorized user exceeds purpose | confidentiality/integrity loss | least privilege, logging, review, revocation |

## 4. AI / agent security gate

An AI or agent must not receive authority merely because it can technically call a tool.

Before an agent can perform a high-impact action, document:

```text
AGENT / SYSTEM:
TOOLS AVAILABLE:
DATA ACCESS:
WRITE / DEPLOY / PAYMENT AUTHORITY:
EXTERNAL CONTENT INGESTED:
PROMPT-INJECTION CONTROLS:
HUMAN APPROVAL REQUIRED FOR:
CREDENTIAL SCOPE:
LOGGING / AUDIT:
ROLLBACK / REVOCATION:
SECURITY REVIEWER:
GO / NO-GO:
```

Default: **human approval is required for irreversible, externally binding, privileged, financial, safety-relevant or real-world deployment actions unless a documented risk assessment explicitly establishes a lawful and safe automated scope.**

## 5. Incident severity

| Severity | Indicative condition | Response |
|---|---|---|
| `SEV-1 CRITICAL` | active compromise with major data, privileged, financial, safety or production impact | immediate containment/escalation; preserve evidence; assess legal/reporting duties |
| `SEV-2 HIGH` | confirmed significant compromise or material vulnerability with credible exploitation | urgent containment/remediation and owner escalation |
| `SEV-3 MEDIUM` | limited incident or vulnerability with controlled impact | triage, fix, test, document |
| `SEV-4 LOW` | low-impact security observation/hardening item | backlog with accountable owner |

Severity must be adjusted to actual context rather than mechanically assigned.

## 6. Incident response workflow

### A. Detect & record

Create an incident ID and record time, reporter, affected assets, initial evidence and suspected impact.

### B. Triage

Determine whether the event affects confidentiality, integrity, availability, authenticity, personal data, credentials, evidence, deployment authority or financial/settlement state.

### C. Contain

Examples: revoke credentials, disable compromised integrations, isolate affected service/device, stop deployment, restrict access or temporarily suspend automation.

### D. Preserve evidence

Preserve relevant logs, commits, timestamps, configuration, alerts and other artifacts. Do not publicly expose secrets or unnecessary personal data while documenting the incident.

### E. Eradicate

Remove malicious persistence/root cause, rotate affected secrets, patch vulnerable components and invalidate compromised sessions/artifacts where required.

### F. Recover

Restore trusted state, verify integrity, re-enable services progressively and monitor for recurrence.

### G. Regulatory / contractual assessment

Determine whether notification or coordination duties apply under GDPR, NIS2/national implementation, contracts, sector rules, competent-authority requirements or other applicable law. **This document does not presume that MyZubster is a NIS2 essential or important entity. Applicability must be assessed separately.**

### H. Post-incident review

Record root cause, timeline, impact, corrective actions, owners, deadlines and lessons learned. Update the threat model and controls where necessary.

## 7. Incident register template

```text
INCIDENT ID:
DATE/TIME DETECTED:
REPORTER:
INCIDENT OWNER:
SEVERITY:
AFFECTED ASSETS:
DESCRIPTION:
INITIAL INDICATORS / EVIDENCE:
DATA INVOLVED:
PERSONAL DATA INVOLVED? YES / NO / UNKNOWN
CREDENTIALS/SECRETS INVOLVED? YES / NO / UNKNOWN
AI/AGENT INVOLVED? YES / NO
FIELD/PHYSICAL SYSTEM INVOLVED? YES / NO
FINANCIAL/SETTLEMENT IMPACT? YES / NO
CONTAINMENT ACTIONS:
EVIDENCE PRESERVED:
ROOT CAUSE:
ERADICATION:
RECOVERY:
EXTERNAL NOTIFICATION ASSESSMENT:
NOTIFICATIONS MADE (IF REQUIRED):
CORRECTIVE ACTIONS:
OWNER + DEADLINE:
CLOSED BY:
CLOSURE DATE:
POST-INCIDENT REVIEW LINK:
```

Do not place live secrets, exploit credentials, unnecessary personal data or sensitive defensive details in a public incident record. Use a restricted evidence store where appropriate.

## 8. Vulnerability register template

```text
VULNERABILITY ID:
DATE REPORTED:
REPORTER / SOURCE:
AFFECTED COMPONENT:
VERSION / COMMIT:
DESCRIPTION:
EXPLOITABILITY:
IMPACT:
SEVERITY:
PUBLIC DISCLOSURE STATUS:
OWNER:
MITIGATION:
FIX COMMIT / VERSION:
RETEST EVIDENCE:
RESIDUAL RISK:
CLOSED DATE:
```

## 9. Security GO / NO-GO record

Before a production or high-impact deployment:

```text
DEPLOYMENT:
OWNER:
ASSETS/DATA:
THREAT MODEL REVIEWED: YES / NO
ACCESS CONTROL REVIEWED: YES / NO
SECRETS REVIEWED: YES / NO
DEPENDENCIES REVIEWED: YES / NO
LOGGING/MONITORING READY: YES / NO
BACKUP/RECOVERY READY: YES / NO / N/A
INCIDENT OWNER DEFINED: YES / NO
PRIVACY/GDPR GATE PASSED: YES / NO / N/A
AI ACT GATE PASSED: YES / NO / N/A
THIRD-PARTY AUTHORIZATION: YES / NO / N/A
SECTOR-SPECIFIC REVIEW: YES / NO / N/A
OPEN CRITICAL/HIGH RISKS:
REVIEWER:
GO / NO-GO:
DATE:
EVIDENCE LINKS:
```

A `GO` record cannot replace a legally required authorization, conformity assessment, professional validation or regulator decision.

## 10. Reference framework

This baseline is informed by widely used cybersecurity risk-management and incident-response principles, including:

- Directive (EU) 2022/2555 (NIS2), where applicable, including risk analysis, incident handling, continuity, supply-chain security, vulnerability handling, cryptography, access control and asset management;
- ENISA guidance on cybersecurity risk-management and incident response;
- NIST SP 800-61 Rev. 3 for incident-response integration into cybersecurity risk management.

These references are **control frameworks/guidance**, not evidence that NIS2 applies to MyZubster or that MyZubster is certified against them.

## 11. Links to MyZubster compliance controls

- [`ITALY-COMPLIANCE-REGISTER.md`](ITALY-COMPLIANCE-REGISTER.md)
- [`GDPR-PRIVACY-DATA-INVENTORY.md`](GDPR-PRIVACY-DATA-INVENTORY.md)
- [`GDPR-ARTICLE-30-ROPA.md`](GDPR-ARTICLE-30-ROPA.md)
- [`AI-INVENTORY-AI-ACT-CLASSIFICATION.md`](AI-INVENTORY-AI-ACT-CLASSIFICATION.md)
- [Public compliance statement #840](https://github.com/MyZubster-Ecosystem/myzubster/issues/840)

## 12. Completion rule

Cybersecurity is not marked `COMPLETE` merely because this document exists.

A control can move toward `READY FOR REVIEW` only when the implementation evidence exists and is attributable to the relevant system/version. High-impact deployment remains `NO-GO` when an unresolved critical risk, missing required authorization, uncontrolled privileged secret or other blocking requirement exists.