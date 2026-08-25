# Reward Governance

## Base Reward Structure (per Issue #489)

| Severity | CVSS 4.0 Range | Base Reward (MYZ) | Base Reward (USD Equivalent) |
|----------|----------------|-------------------|------------------------------|
| Critical | 9.0 - 10.0     | 50,000 MYZ        | $5,000                       |
| High     | 7.0 - 8.9      | 25,000 MYZ        | $2,500                       |
| Medium   | 4.0 - 6.9      | 10,000 MYZ        | $1,000                       |
| Low      | 0.1 - 3.9      | 2,500 MYZ         | $250                         |
| Info     | 0.0            | 500 MYZ           | $50                          |

*USD equivalents are approximate; MYZ is the primary denomination.*

## Payment Currency Options

Researchers may choose **one** of:

### MYZ (Native Token)
- Paid to researcher's provided wallet address
- No conversion needed
- Subject to token vesting if applicable (see Tokenomics)

### XMR (Monero)
- Conversion rate **locked at bounty approval time** (Step 6 of triage)
- Rate source: CoinGecko 24h average at approval timestamp
- Paid to researcher's provided XMR address
- Transaction ID recorded for audit trail

## Critical Finding Multiplier

Critical findings **may** receive up to **2× base reward** (100,000 MYZ max) when justified by:

### Justification Criteria (must meet ≥2)
- [ ] **Widespread impact** - Affects >50% of users or all core functionality
- [ ] **Data exposure** - PII, financial data, or private keys at scale
- [ ] **System compromise** - Full account takeover or RCE
- [ ] **Regulatory impact** - Triggers mandatory breach notification
- [ ] **Novel attack vector** - Previously unknown class of vulnerability
- [ ] **Exploit reliability** - Weaponizable with high success rate

### Approval Process
1. Triage owner documents justification
2. Payout approval authority reviews
3. Both must sign off for >1.5× multiplier
4. Recorded in tracking system with rationale

## Duplicate Handling

- **First validated submission** receives full reward
- Subsequent duplicates receive:
  - **Acknowledgment** in advisory (if published)
  - **No monetary reward**
- Validation = reproduced and triaged by security team
- Timestamp of **validated report** determines priority (not submission time)
- Coordinated disclosure partners: first partner to validate gets reward

## Split Rewards

For collaborative findings:
- Researchers self-report collaboration
- Reward split per researcher agreement (default: equal)
- All collaborators must be identified at submission
- Maximum 3 researchers per finding

## Payment Timeline

| Step | Timeline |
|------|----------|
| Approval → Payment initiation | ≤ 5 business days |
| MYZ on-chain confirmation | ≤ 1 hour |
| XMR on-chain confirmation | ≤ 30 minutes |
| Payment notification | Same day as initiation |

## Tax & Compliance

- Researchers responsible for local tax obligations
- W-9/W-8BEN required for payments >$600 USD equivalent
- OFAC/sanctions screening on all payouts
- KYC may be required for large payouts (>$10,000)

## Audit Trail

All payments recorded with:
- Tracking ID
- Researcher identifier (pseudonym OK)
- Severity & CVSS score
- MYZ amount
- XMR amount + conversion rate + timestamp (if applicable)
- Approver signatures
- Transaction hashes

---

*Version 1.0 | Aligned with Issue #489 | Review: Quarterly*