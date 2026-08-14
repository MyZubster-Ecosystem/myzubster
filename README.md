# MyZubster Gateway

Decentralized gateway for robots earning MYZ and XMR.

## Status

| Module | Status | Endpoints |
|--------|--------|-----------|
| Auth | ✅ Live | /api/auth/* |
| Animals | ✅ Live | /api/animals/* |
| Plants | ✅ Live | /api/plants/* |
| Bounties | ✅ Live | /api/bounties/* |
| Rewards | ✅ Live | /api/rewards/* |
| Disputes | ✅ Live | /api/disputes/* |
| Escrow | ✅ Live | /api/escrow/* |
| Multi-currency Escrow | ✅ Live | /api/mc-escrow/* |
| Payment Verification | ✅ Live | /api/payment-verification/* |
| Wallet | ✅ Live | /api/wallet/* |
| Dashboard | ✅ Live | /api/dashboard/* |
| Admin Dashboard | ✅ Live | /api/admin/* |
| Rate Limiting | ✅ Live | All endpoints |
| Swap | ✅ Live | /api/swap/* |
| Robot | ✅ Live | /api/robot/* |
| Rewards | ✅ Live | /api/rewards/* |
| Security | ✅ Live | /api/security/* |
| Sensors | ✅ Live | /api/sensors/* |
| XMR | ✅ Live | /api/xmr/* |
| Contributors | ✅ Live | /api/contributors/* |
| Marketing | ✅ Live | /api/marketing-templates/* |
| Payments | ✅ Live | /api/payments/* |

## Security

- Rate limiting on all API endpoints (100 req/15min general, 5 req/15min auth)
- JWT authentication for protected routes
- Admin-only endpoints for sensitive operations
- Input validation on all POST endpoints
- Helmet for HTTP header security
- CORS configuration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (jsonwebtoken)
- **Security**: express-rate-limit, helmet, cors
- **Payments**: Monero (monero-javascript), MYZ (Tari token)

## License

MIT
