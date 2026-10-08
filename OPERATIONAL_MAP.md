# MyZubster Critical Service Ownership & Cost Map

This document serves as the canonical inventory for the MyZubster ecosystem to ensure operational decentralization.

| Service/Component | Current Host | Repo/Source | Deployment | Credentials Owner | Monthly Cost | Backup Operator | Recovery Doc | 2nd Node Status | Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| MyZubster Web/App | Vercel/Daniel | `myzubster` | CI/CD | Daniel | $TBD | TBD | [Link](#recovery-protocols) | Pending | High |
| API/Backend | VPS (Daniel) | `myzubster` | Docker | Daniel | $TBD | TBD | [Link](#recovery-protocols) | Pending | Critical |
| MongoDB/Data | Managed/VPS | `myzubster` | Cloud/Local | Daniel | $TBD | TBD | [Link](#recovery-protocols) | Pending | Critical |
| Qdrant (Vector DB) | VPS (Daniel) | `qdrant` | Docker | Daniel | $TBD | TBD | [Link](#recovery-protocols) | Pending | High |
| Marketplace | MyZubster Core | `myzubster` | Docker | Daniel | $TBD | TBD | [Link](#recovery-protocols) | Pending | Medium |
| MYZ Ledger | Smart Contracts | `contracts` | On-chain | DAO/Multi-sig | $0 | DAO | N/A | Verified | Low |
| Knowledge Graph | VPS (Daniel) | `kg-service` | Docker | Daniel | $TBD | TBD | [Link](#recovery-protocols) | Pending | Medium |

## Role Cost Profiles (Maintainer Declarations)

*Maintainers must update this section when assuming a role.*

### [Role: N4K48]
- **service/domain:** Independent Node / Interoperability
- **monthly recurring cost:** $0 (Self-hosted)
- **self-funded voluntarily:** yes
- **reimbursement requested:** no
- **MYZ requested:** no

### [Role: lamkyo]
- **service/domain:** Economic/Revenue Interoperability
- **monthly recurring cost:** $0
- **self-funded voluntarily:** yes
- **reimbursement requested:** no
- **MYZ requested:** no

---
*Last Updated: 2023-10-27*
