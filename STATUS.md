# MyZubster Project Status

> Transparency document: aligns public communication with actual code status.
> Updated: 2026-08-08

## Core Modules

| Module | Repo | Status | Endpoints | Last Updated |
|--------|------|--------|-----------|--------------|
| Gateway | MyZubsterGateway | ✅ Live | /api/auth, /api/animals, /api/plants, /api/bounties | 2026-08-08 |
| Rewards | MyZubsterGateway | ✅ Live | /api/rewards | 2026-08-08 |
| Disputes | MyZubsterGateway | ✅ Live | /api/disputes | 2026-08-08 |
| Escrow | MyZubsterGateway | ✅ Live | /api/escrow | 2026-08-08 |
| Multi-currency Escrow | MyZubsterGateway | ✅ Live | /api/mc-escrow | 2026-08-08 |
| Payment Verification | MyZubsterGateway | ✅ Live | /api/payment-verification | 2026-08-08 |
| Wallet | MyZubsterGateway | ✅ Live | /api/wallet | 2026-08-08 |
| Dashboard | MyZubster | ✅ Live | /api/dashboard | 2026-08-08 |
| Referral System | MyZubster | ✅ Live | /api/referrals | 2026-08-08 |
| Bounty System | MyZubster | ✅ Live | /api/bounty-system | 2026-08-08 |
| Reward System | MyZubster | ✅ Live | /api/rewards | 2026-08-08 |
| Urban Garden | MyZubster | ✅ Live | /api/urban-garden | 2026-08-08 |
| Carbon Credits | MyZubster | ✅ Live | /api/carbon-credits | 2026-08-08 |
| Admin Dashboard | MyZubster | ✅ Live | /api/admin | 2026-08-08 |
| Rate Limiting | MyZubster | ✅ Live | All endpoints | 2026-08-08 |
| Swap | MyZubsterGateway | ✅ Live | /api/swap | 2026-08-08 |
| Robot Management | MyZubsterGateway | ✅ Live | /api/robot | 2026-08-08 |
| Security | MyZubsterGateway | ✅ Live | /api/security | 2026-08-08 |
| Sensors | MyZubsterGateway | ✅ Live | /api/sensors | 2026-08-08 |

## Ecosystem Apps

| App | Repo | Status | Features |
|-----|------|--------|----------|
| Mobile App | MyZubster-App | ✅ In Development | Job gateway, rate limiting, map, notifications, chat, robot profiles |
| Web Interface | MyZubsterWeb | ⚠️ Pending | Cannot fork (403) |
| Robot SDK | MyZubster-Robot | ✅ In Development | Security audit, scaffolds |
| Docs | myzubster-docs | ⚠️ Minimal | Community toolkit pending |

## Security

- ✅ Rate limiting on all API endpoints (100 req/15min general, 5 req/15min auth)
- ✅ JWT authentication for protected routes
- ✅ Admin-only endpoints for sensitive operations
- ✅ Helmet for HTTP header security
- ✅ CORS configuration
- ✅ Input validation on all POST endpoints

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (jsonwebtoken)
- **Security**: express-rate-limit, helmet, cors
- **Payments**: Monero (XMR), MYZ (Tari token)
- **Mobile**: MyZubster-App (in development)
- **Web**: MyZubsterWeb (pending)

## Open Bounties

See [GitHub Issues](https://github.com/MyZubster-Ecosystem/MyZubster/issues) for all open bounties.

## License

MIT
