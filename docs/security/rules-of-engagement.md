# Rules of Engagement

## Authorized Testing Rules

### General Requirements
1. **Scope Limitation** - Test only assets listed in [Eligible Assets](bounty-program.md#1-eligible-assets-and-environments)
2. **Account Usage** - Use only your own registered accounts; no credential sharing
3. **Rate Limiting** - Respect API rate limits (max 60 requests/minute)
4. **Data Handling** - Do not access, modify, or exfiltrate other users' data
5. **Reporting** - Report findings within 24 hours of discovery

### Permitted Activities
- ✅ Manual vulnerability testing
- ✅ Automated vulnerability scanning (passive, non-intrusive)
- ✅ Fuzzing with rate limits
- ✅ Authentication/authorization bypass testing (own accounts only)
- ✅ Input validation testing
- ✅ Business logic flaw testing
- ✅ Client-side security testing

### Prohibited Activities
- ❌ **Destructive testing** - Data deletion, corruption, service disruption
- ❌ **Persistence** - Backdoors, webshells, scheduled tasks, registry modifications
- ❌ **Credential theft** - Phishing, keylogging, session hijacking, credential stuffing
- ❌ **Social engineering** - Targeting employees, support staff, or users
- ❌ **DoS/DDoS** - Any availability impact testing
- ❌ **Automated exploitation** - Metasploit, exploit frameworks, automated attack tools against production
- ❌ **Third-party testing** - Testing assets not in scope
- ❌ **Physical security** - Facility access, hardware tampering
- ❌ **Supply chain attacks** - Dependency confusion, typosquatting
- ❌ **Cryptocurrency mining** - Resource abuse

### Metasploit / Exploit Framework Policy
- **Production**: **Disabled by default**. Requires explicit written authorization per engagement.
- **Staging**: Allowed with prior notification (24 hours)
- **Development**: Allowed in isolated environments
- All exploit framework usage must be logged and reported

### Network & Infrastructure
- No port scanning beyond published endpoints
- No infrastructure enumeration (DNS zone transfers, cloud metadata)
- No bypassing WAF/CDN protections
- No testing of underlying cloud provider vulnerabilities

### Mobile Applications
- Static analysis permitted
- Dynamic analysis on owned devices only
- No reverse engineering for DRM bypass
- No modification of app store distributions

### Smart Contracts (if applicable)
- Testnet only unless mainnet explicitly authorized
- No mainnet value at risk during testing
- No front-running or MEV exploitation
- Report gas optimization issues as Info severity

## Violation Consequences

| Violation | Consequence |
|-----------|-------------|
| Minor (rate limit, scope creep) | Warning, temporary suspension |
| Major (destructive, persistence, credential theft) | Permanent ban, legal action |
| Critical (DoS, data breach, mainnet exploit) | Permanent ban, law enforcement referral |

## Authorization Process

For activities requiring explicit authorization:
1. Email security@myzubster.com with:
   - Researcher identity (verified)
   - Target asset/environment
   - Testing methodology
   - Time window requested
   - Emergency contact
2. Receive written authorization with tracking ID
3. Conduct testing within authorized parameters
4. Submit findings within 48 hours of completion

## Safe Harbor Commitment

We will not pursue legal action against researchers who:
- Follow these Rules of Engagement
- Report findings promptly
- Act in good faith
- Respect user privacy and data
- Do not exceed authorized scope

---

*Version 1.0 | Effective Immediately | Review: Quarterly*