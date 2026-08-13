# Reward Backend (Bounty #252)

Automatic MYZ reward assignment and minting service for the MyZubster ecosystem.

## What it does

1. Accepts reward-assignment triggers (`pr_merged`, `bug_validated`, `referral_signed_up`, `qa_approved`).
2. Looks up the MYZ amount from a declarative `REWARD_POLICY`.
3. Mints/credits MYZ to the contributor wallet via the Gateway Tari release endpoint
   (`POST /api/tari/release { fromAddress, toAddress, amount }`).
4. Persists every reward event (userId, wallet, amount, reason, timestamp, txHash) to a JSON store.
5. Exposes an HTTP API for the frontend to fetch a user's reward history.

## Run

```bash
cd services/reward-backend
npm install
TREASURY_ADDRESS=<funding-wallet> GATEWAY_URL=http://localhost:5002 npm start
```

## API

| Method | Route                     | Description                          |
|--------|---------------------------|--------------------------------------|
| POST   | `/api/rewards/assign`     | Trigger a reward assignment + mint   |
| GET    | `/api/rewards/:userId`    | Reward history for one user          |
| GET    | `/api/rewards`            | All reward events (admin)            |
| GET    | `/health`                 | Service + policy health              |

### Assign example

```json
POST /api/rewards/assign
{
  "trigger": "pr_merged",
  "userId": "laurentketterle-hub",
  "wallet": "12Nbmmm5g6AU3Uk9...Gib1U4",
  "metadata": { "repo": "MyZubster-Ecosystem/myzubster", "pr": 281 }
}
```

## Env

- `PORT` (default 5003)
- `GATEWAY_URL` (default http://localhost:5002)
- `TREASURY_ADDRESS` — the funding wallet used as `fromAddress`
- `JWT_SECRET` (default `myzubster-secret`)
- `REWARD_STORE` — JSON store path (default `./reward-events.json`)
