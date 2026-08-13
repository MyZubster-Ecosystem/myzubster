# 🔗 MyZubster Referral System

Sistema di referral con tracciamento delle ricompense in MYZ.

**Bounty:** MyZubster [#255](https://github.com/MyZubster-Ecosystem/myzubster/issues/255) — 25 MYZ

## 📋 Funzionalità

- Generazione di link referral univoci per ogni utente
- Tracciamento del referrer alla registrazione di un nuovo utente
- Accredito automatico di **5 MYZ** a referrer e nuovo utente al primo acquisto
- Interfaccia admin (`/referrals/stats`) con statistiche aggregate e top referrer
- Database SQLite per persistenza

## 🔌 API Endpoints

| Method | Path | Descrizione |
|--------|------|-------------|
| `POST` | `/referrals/generate` | Genera un link referral per l'utente |
| `POST` | `/referrals/signup` | Registra un utente (con codice referral opzionale) |
| `POST` | `/referrals/first-purchase` | Accredita 5 MYZ a referrer + nuovo utente |
| `GET`  | `/referrals/:userId` | Statistiche referral di un utente |
| `GET`  | `/referrals/stats` | Statistiche aggregate (admin) |
| `GET`  | `/health` | Health check |

### POST /referrals/generate
```json
{ "user_id": "github:alice", "wallet_address": "0x153b..." }
```
→ restituisce `{ "referral_code": "A1B2C3D4", "referral_link": "https://myzubster.com/r/A1B2C3D4" }`

### POST /referrals/signup
```json
{ "user_id": "github:bob", "wallet_address": "0x...", "referral_code": "A1B2C3D4" }
```

### POST /referrals/first-purchase
```json
{ "user_id": "github:bob" }
```
→ accredita 5 MYZ sia a `alice` (referrer) sia a `bob` (nuovo utente).

## 🚀 Installazione

```bash
cd services/referral-system
npm install
cp .env.example .env
# Configura GATEWAY_URL, REFERRAL_REWARD_MYZ, REFERRAL_BASE_URL in .env
npm start
```

## 🏗️ Architettura

```
Nuovo utente si registra con codice referral
       ↓
POST /referrals/signup (traccia referred_by_code)
       ↓
Primo acquisto MYZ
       ↓
POST /referrals/first-purchase
       ↓
Chiama Gateway /mint ×2 (referrer + referred, 5 MYZ ciascuno)
       ↓
Salva eventi in SQLite (status: completed/failed)
       ↓
GET /referrals/:userId → dashboard utente
GET /referrals/stats  → dashboard admin
```

## 🛡️ Note di sicurezza

- L'accredito è **idempotente**: il campo `first_purchase_at` impedisce doppi accrediti.
- Un utente non può referenziare sé stesso.
- I codici referral sono generati con `crypto.randomBytes` (collision-resistant).
