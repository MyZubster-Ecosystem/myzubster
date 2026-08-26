# Security Bounty Program

## Program Overview

This document defines the MyZubster Security Bounty Program governance, reward structure, and operational procedures.

---

## 1. Eligible Assets and Environments

### Production Assets (Highest Rewards)
- `app.myzubster.com` - Main web application
- `api.myzubster.com` - Public API
- `mobile.myzubster.com` - Mobile API endpoints
- Smart contracts on mainnet (addresses published separately)

### Staging Assets (Standard Rewards)
- `staging.myzubster.com` - Pre-production environment
- `staging-api.myzubster.com` - Staging API
- Testnet smart contracts

### Development Assets (Reduced Rewards)
- `dev.myzubster.com` - Development environment
- Local development setups (self-hosted)

### Explicitly Excluded
- Corporate IT systems (email, HR, etc.)
- Third-party SaaS platforms
- Employee personal devices
- Physical security systems

---

## 2. Rules of Engagement

See [Rules of Engagement](rules-of-engagement.md) for detailed authorized testing rules.

### Key Principles
- **No destructive testing** - No data deletion, corruption, or service disruption
- **No persistence** - No backdoors, webshells, or persistent access
- **No credential theft** - No phishing, credential stuffing, or session hijacking
- **No unauthorized third-party testing** - Only test assets you own or are explicitly authorized
- **No automated exploitation against production** - Automated scanners allowed; automated exploitation prohibited
- **Metasploit/Exploit frameworks** - Controlled and disabled by default for production

---

## 3. Reward Governance

See [Reward Governance](reward-governance.md) for complete details.

### Base Rewards (per Issue #489)
| Severity | Base Reward (MYZ) |
|----------|-------------------|
| Critical | 50,000 MYZ        |
| High     | 25,000 MYZ        |
| Medium   | 10,000 MYZ        |
| Low      | 2,500 MYZ         |
| Info     | 500 MYZ           |

### Payment Options
- Researcher chooses **MYZ** or **XMR** (Monero)
- XMR conversion rate recorded **at bounty approval time**
- Critical findings may receive **up to 2× base reward** when justified by impact
- Duplicate reports: **first validated submission** receives reward

---

## 4. Triage Workflow

See [Triage Workflow](triage-workflow.md) for detailed process.

### 9-Step Process
1. **Receive** private report via authorized channel
2. **Acknowledge** and assign tracking ID (format: `MYZ-SEC-YYYY-NNNN`)
3. **Reproduce** in authorized environment
4. **Assess** severity and impact using CVSS 4.0
5. **Remediate** and regression-test fix
6. **Approve** MYZ/XMR reward with governance sign-off
7. **Record** conversion details for XMR payments
8. **Pay** bounty and close report
9. **Publish** sanitized advisory when appropriate

---

## 5. Safety Controls

See [Safety Controls](safety-controls.md) for enforcement mechanisms.

### Enforcement
- Automated monitoring for destructive patterns
- Rate limiting on authentication endpoints
- Honeypot detection for unauthorized access attempts
- Metasploit/framework signatures blocked at WAF
- All production testing requires explicit written authorization

---

## 6. Program Governance

### Roles
| Role | Primary | Backup |
|------|---------|--------|
| Security Triage Owner | @security-lead | @security-backup |
| Payout Approval Authority | @cto | @ceo |
| Legal Review | @legal-counsel | - |
| Communications | @comms-lead | - |

### Escalation
- Critical findings: Immediate notification to CTO + CEO
- Legal/regulatory implications: Legal counsel within 24 hours
- Media inquiries: Communications lead only

### Program Review
- Quarterly review of reward structure
- Annual Rules of Engagement update
- Post-incident retrospectives for Critical findings

---

## 7. Contact

- **Program Questions**: bounty@myzubster.com
- **Vulnerability Reports**: security@myzubster.com
- **Emergency**: security-emergency@myzubster.com (PGP encrypted)

---

*Last Updated: 2024 | Version 1.0 | Next Review: Quarterly*