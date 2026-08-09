# 🏆 MyZubster Reward Backend

Servizio backend per l'assegnazione automatica di ricompense MYZ.

**Bounty:** MyZubster [#252](https://github.com/MyZubster-Ecosystem/myzubster/issues/252) — 30 MYZ

## 📋 Funzionalità

- Assegnazione automatica ricompense MYZ via Gateway `/mint`
- Storico ricompense per utente
- Retry automatico minting falliti
- Database SQLite per persistenza

## 🔌 API Endpoints

| Method | Path | Descrizione |
|--------|------|-------------|
| `POST` | `/reward` | Assegna una ricompensa |
| `GET` | `/rewards/:userId` | Storico ricompense utente |
| `GET` | `/rewards` | Tutte le ricompense (admin) |
| `POST` | `/reward/:id/retry` | Riprova minting fallito |
| `GET` | `/health` | Health check |

### POST /reward
```json
{
  "user_id": "github:username",
  "wallet_address": "0x153b...",
  "amount": 30,
  "reason": "PR merged: feat/add-telegram-bot",
  "reference": "https://github.com/org/repo/pull/42"
}
```

### GET /rewards/:userId
```json
{
  "user_id": "github:username",
  "total_earned": 150,
  "count": 5,
  "rewards": [...]
}
```

## 🚀 Installazione

```bash
cd services/reward-backend
npm install
cp .env.example .env
# Configura GATEWAY_URL in .env
npm start
```

## 🏗️ Architettura

```
Evento (PR merged, bug validato)
       ↓
POST /reward
       ↓
Salva in SQLite (status: pending)
       ↓
Chiama Gateway /mint
       ↓
Aggiorna SQLite (status: completed/failed)
       ↓
GET /rewards/:userId → Dashboard frontend
```
