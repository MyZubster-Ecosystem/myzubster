# Triage Workflow

## 9-Step Triage Process

### Step 1: Receive Private Report
- **Channel**: security@myzubster.com, GitHub Security Advisories, or bounty@myzubster.com
- **Format**: Structured template (see [Vulnerability Report Template](../.github/ISSUE_TEMPLATE/security_vulnerability_report.yml))
- **Auto-reply**: Acknowledgment with expected response timeline
- **Assignment**: Security triage owner notified immediately

### Step 2: Acknowledge & Assign Tracking ID
- **Timeline**: Within 48 hours
- **Tracking ID Format**: `MYZ-SEC-YYYY-NNNN` (e.g., `MYZ-SEC-2024-0042`)
- **Communication**: Reply to researcher with tracking ID and assigned triage owner
- **Internal**: Create tracking record in security tracker

### Step 3: Reproduce in Authorized Environment
- **Timeline**: Within 5 business days
- **Environment Priority**:
  1. Local reproduction (fastest)
  2. Staging environment
  3. Production (read-only, with explicit approval)
- **Documentation**: Record reproduction steps, environment, evidence
- **Blockers**: If cannot reproduce, request clarification from researcher (7-day SLA)

### Step 4: Assess Severity & Impact
- **Framework**: CVSS 4.0 (primary), CWSS (secondary)
- **Factors**:
  - Attack vector (network/adjacent/local/physical)
  - Attack complexity
  - Privileges required
  - User interaction
  - Scope (changed/unchanged)
  - Confidentiality/Integrity/Availability impact
- **Output**: Severity rating + CVSS vector string
- **Review**: Second reviewer for Critical/High findings

### Step 5: Remediate & Regression-Test
- **Ownership**: Assigned to engineering team with security oversight
- **Timeline Targets**:
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days
- **Process**:
  1. Develop fix in feature branch
  2. Security review of fix
  3. Automated test suite + targeted regression tests
  4. Staging deployment + validation
  5. Production deployment (coordinated)
- **Verification**: Researcher invited to validate fix (optional, 7-day window)

### Step 6: Approve MYZ/XMR Reward
- **Authority**: Payout approval authority (CTO/CEO)
- **Inputs**:
  - Severity assessment
  - Impact justification
  - Duplicate check
  - Multiplier justification (if applicable)
- **Decision**: Approve / Adjust / Reject with rationale
- **Currency**: Researcher's choice recorded (MYZ or XMR)
- **XMR Rate Lock**: CoinGecko 24h average at approval timestamp

### Step 7: Record Conversion Details (XMR Only)
- **Required Fields**:
  - MYZ amount approved
  - XMR amount calculated
  - Conversion rate (MYZ/XMR)
  - Rate source (CoinGecko)
  - Timestamp of rate lock (ISO 8601)
  - Approver signature
- **Storage**: Immutable audit log (append-only)

### Step 8: Pay Bounty & Close Report
- **Payment Execution**: Finance team with dual authorization
- **MYZ**: Treasury wallet → researcher address
- **XMR**: Exchange → researcher address (or direct if treasury holds XMR)
- **Confirmation**: Transaction hashes recorded
- **Notification**: Researcher notified with transaction details
- **Closure**: Tracking status → `PAID` / `CLOSED`
- **Timeline**: ≤ 5 business days from approval

### Step 9: Publish Sanitized Advisory
- **Criteria**: Public interest, fixed vulnerability, researcher consent
- **Process**:
  1. Draft advisory (technical details, impact, mitigation)
  2. Legal review
  3. Researcher review (credit preference: name/pseudonym/anonymous)
  4. Publish to:
     - GitHub Security Advisories
     - Project blog/security page
     - Mailing list (if applicable)
- **Timing**: Typically 30 days after fix deployment
- **CVE**: Request CVE for Critical/High findings

## Tracking System Fields

| Field | Description |
|-------|-------------|
| `tracking_id` | MYZ-SEC-YYYY-NNNN |
| `reporter` | Pseudonym or identifier |
| `received_at` | ISO 8601 timestamp |
| `acknowledged_at` | ISO 8601 timestamp |
| `severity` | Critical/High/Medium/Low/Info |
| `cvss_vector` | CVSS 4.0 vector string |
| `status` | NEW/TRIAGING/REPRODUCING/ASSESSING/REMEDIATING/APPROVING/PAID/CLOSED |
| `assigned_to` | Triage owner |
| `reward_myz` | Approved MYZ amount |
| `reward_xmr` | Approved XMR amount (if applicable) |
| `xmr_rate` | Conversion rate at approval |
| `xmr_rate_timestamp` | Rate lock timestamp |
| `paid_at` | Payment timestamp |
| `tx_hash_myz` | MYZ transaction hash |
| `tx_hash_xmr` | XMR transaction hash |
| `advisory_url` | Published advisory URL |
| `cve_id` | CVE identifier |

## SLA Summary

| Phase | Target |
|-------|--------|
| Acknowledgment | 48 hours |
| Initial reproduction | 5 business days |
| Severity assessment | 7 business days |
| Fix deployment (Critical) | 7 days |
| Fix deployment (High) | 14 days |
| Fix deployment (Medium) | 30 days |
| Fix deployment (Low) | 90 days |
| Payment after approval | 5 business days |
| Advisory publication | 30 days post-fix |

## Escalation Triggers

- **SLA breach**: Auto-escalate to backup triage owner
- **Critical finding**: Immediate CTO notification
- **Researcher dispute**: Legal counsel + mediation
- **Regulatory implication**: Legal counsel within 24 hours

---

*Version 1.0 | Review: Quarterly*