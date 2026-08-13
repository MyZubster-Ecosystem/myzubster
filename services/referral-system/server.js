require('dotenv').config();

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const path = require('path');

// --- Configurazione ---
const PORT = process.env.PORT || 3002;
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.myzubster.com';
const GATEWAY_MINT_ENDPOINT = process.env.GATEWAY_MINT_ENDPOINT || '/mint';
const REFERRAL_REWARD_MYZ = Number(process.env.REFERRAL_REWARD_MYZ || 5);
const REFERRAL_CODE_BYTES = Number(process.env.REFERRAL_CODE_BYTES || 8);

// --- Database ---
const db = new Database(path.join(__dirname, 'referrals.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL UNIQUE,
    wallet_address TEXT NOT NULL,
    referral_code TEXT NOT NULL UNIQUE,
    referred_by_code TEXT,
    first_purchase_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS referral_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    referrer_user_id TEXT NOT NULL,
    referred_user_id TEXT NOT NULL,
    event TEXT NOT NULL,
    amount REAL,
    tx_hash TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_code ON users(referral_code);
  CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_code);
  CREATE INDEX IF NOT EXISTS idx_events_referrer ON referral_events(referrer_user_id);
`);

const app = express();
app.use(express.json());

// --- Helpers ---

function generateReferralCode() {
  // Codice univoco, leggibile e collision-resistant
  return crypto.randomBytes(REFERRAL_CODE_BYTES).toString('hex').toUpperCase();
}

function generateReferralLink(code) {
  const base = process.env.REFERRAL_BASE_URL || 'https://myzubster.com/r/';
  return `${base}${code}`;
}

async function mintMYZ(walletAddress, amount, reason) {
  try {
    const response = await axios.post(
      `${GATEWAY_URL}${GATEWAY_MINT_ENDPOINT}`,
      { wallet: walletAddress, amount, memo: reason },
      { timeout: 10000 }
    );
    return {
      success: true,
      tx_hash: response.data?.tx_hash || response.data?.transactionHash || null
    };
  } catch (err) {
    if (err.response) {
      return {
        success: false,
        error: `Gateway error: ${err.response.status} — ${JSON.stringify(err.response.data)}`
      };
    }
    return { success: false, error: err.message };
  }
}

function getUserByUserId(userId) {
  return db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
}

function getUserByCode(code) {
  return db.prepare('SELECT * FROM users WHERE referral_code = ?').get(code);
}

// --- Routes ---

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'myzubster-referral-system' });
});

// POST /referrals/generate — genera un link referral univoco per l'utente
app.post('/referrals/generate', (req, res) => {
  const { user_id, wallet_address } = req.body;

  if (!user_id || !wallet_address) {
    return res.status(400).json({ error: 'Missing required fields: user_id, wallet_address' });
  }

  const existing = getUserByUserId(user_id);
  if (existing) {
    return res.json({
      user_id: existing.user_id,
      referral_code: existing.referral_code,
      referral_link: generateReferralLink(existing.referral_code),
      message: 'Referral link already exists for this user'
    });
  }

  let code = generateReferralCode();
  // Garantisce unicità (bassa probabilità di collisione, ma difensivo)
  while (getUserByCode(code)) {
    code = generateReferralCode();
  }

  db.prepare(
    'INSERT INTO users (user_id, wallet_address, referral_code) VALUES (?, ?, ?)'
  ).run(user_id, wallet_address, code);

  return res.status(201).json({
    user_id,
    referral_code: code,
    referral_link: generateReferralLink(code)
  });
});

// POST /referrals/signup — registra un nuovo utente con un codice referral
app.post('/referrals/signup', (req, res) => {
  const { user_id, wallet_address, referral_code } = req.body;

  if (!user_id || !wallet_address) {
    return res.status(400).json({ error: 'Missing required fields: user_id, wallet_address' });
  }

  if (getUserByUserId(user_id)) {
    return res.status(409).json({ error: 'User already registered' });
  }

  // referral_code è opzionale: se assente, registrazione senza referrer
  let referrer = null;
  if (referral_code) {
    referrer = getUserByCode(referral_code.toUpperCase());
    if (!referrer) {
      return res.status(404).json({ error: `Referral code not found: ${referral_code}` });
    }
    if (referrer.user_id === user_id) {
      return res.status(400).json({ error: 'Cannot refer yourself' });
    }
  }

  const ownCode = generateReferralCode();
  while (getUserByCode(ownCode)) {
    ownCode = generateReferralCode();
  }

  db.prepare(
    `INSERT INTO users (user_id, wallet_address, referral_code, referred_by_code)
     VALUES (?, ?, ?, ?)`
  ).run(user_id, wallet_address, ownCode, referrer ? referrer.referral_code : null);

  return res.status(201).json({
    user_id,
    referral_code: ownCode,
    referral_link: generateReferralLink(ownCode),
    referred_by: referrer ? referrer.user_id : null,
    message: referrer
      ? `User registered via referral of ${referrer.user_id}`
      : 'User registered without referral'
  });
});

// POST /referrals/first-purchase — accredita 5 MYZ a referrer e nuovo utente al primo acquisto
app.post('/referrals/first-purchase', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing required field: user_id' });
  }

  const user = getUserByUserId(user_id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Idempotenza: accredita una sola volta
  if (user.first_purchase_at) {
    return res.json({
      message: 'Referral reward already credited for first purchase',
      first_purchase_at: user.first_purchase_at
    });
  }

  if (!user.referred_by_code) {
    return res.status(400).json({
      error: 'User was not referred — no referral reward available'
    });
  }

  const referrer = getUserByCode(user.referred_by_code);
  if (!referrer) {
    return res.status(500).json({ error: 'Referrer record missing (data inconsistency)' });
  }

  // 1) Credita il referrer
  const referrerMint = await mintMYZ(
    referrer.wallet_address,
    REFERRAL_REWARD_MYZ,
    `Referral reward: ${user.user_id} first purchase`
  );

  // 2) Credita il nuovo utente
  const referredMint = await mintMYZ(
    user.wallet_address,
    REFERRAL_REWARD_MYZ,
    'Referral reward: first purchase bonus'
  );

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET first_purchase_at = ? WHERE id = ?').run(now, user.id);

  const referrerEvent = db.prepare(
    `INSERT INTO referral_events (code, referrer_user_id, referred_user_id, event, amount, tx_hash, status)
     VALUES (?, ?, ?, 'first_purchase_reward', ?, ?, ?)`
  ).run(
    user.referred_by_code,
    referrer.user_id,
    user.user_id,
    REFERRAL_REWARD_MYZ,
    referrerMint.success ? referrerMint.tx_hash : null,
    referrerMint.success ? 'completed' : 'failed'
  );

  const referredEvent = db.prepare(
    `INSERT INTO referral_events (code, referrer_user_id, referred_user_id, event, amount, tx_hash, status)
     VALUES (?, ?, ?, 'first_purchase_bonus', ?, ?, ?)`
  ).run(
    user.referred_by_code,
    referrer.user_id,
    user.user_id,
    REFERRAL_REWARD_MYZ,
    referredMint.success ? referredMint.tx_hash : null,
    referredMint.success ? 'completed' : 'failed'
  );

  return res.status(201).json({
    referrer_user_id: referrer.user_id,
    referred_user_id: user.user_id,
    reward_each_myz: REFERRAL_REWARD_MYZ,
    referrer_credit: referrerMint,
    referred_credit: referredMint,
    events: [referrerEvent.lastInsertRowid, referredEvent.lastInsertRowid]
  });
});

// GET /referrals/stats — vista admin sulle statistiche aggregate
// NB: registrata PRIMA di /referrals/:userId per non essere catturata dal parametro.
app.get('/referrals/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const totalReferred = db.prepare(
    'SELECT COUNT(*) AS c FROM users WHERE referred_by_code IS NOT NULL'
  ).get().c;
  const totalFirstPurchases = db.prepare(
    'SELECT COUNT(*) AS c FROM users WHERE first_purchase_at IS NOT NULL'
  ).get().c;
  const totalRewarded = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM referral_events WHERE status = 'completed'`
  ).get().total;

  const topReferrers = db.prepare(
    `SELECT referrer_user_id, COUNT(*) AS referrals, COALESCE(SUM(amount), 0) AS rewarded_myz
     FROM referral_events WHERE event = 'first_purchase_reward'
     GROUP BY referrer_user_id
     ORDER BY referrals DESC LIMIT 20`
  ).all();

  return res.json({
    total_users: totalUsers,
    total_referred: totalReferred,
    total_first_purchases: totalFirstPurchases,
    total_rewarded_myz: totalRewarded,
    top_referrers: topReferrers
  });
});

// GET /referrals/:userId — statistiche referral di un utente
app.get('/referrals/:userId', (req, res) => {
  const userId = req.params.userId;

  const user = getUserByUserId(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const referredUsers = db.prepare(
    'SELECT user_id, first_purchase_at, created_at FROM users WHERE referred_by_code = ?'
  ).all(user.referral_code);

  const completedRewards = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM referral_events
     WHERE referrer_user_id = ? AND status = 'completed'`
  ).get(userId).total;

  const events = db.prepare(
    `SELECT * FROM referral_events WHERE referrer_user_id = ? OR referred_user_id = ?
     ORDER BY created_at DESC LIMIT 50`
  ).all(userId, userId);

  return res.json({
    user_id: user.user_id,
    referral_code: user.referral_code,
    referral_link: generateReferralLink(user.referral_code),
    referred_count: referredUsers.length,
    referred_users: referredUsers,
    total_rewarded_myz: completedRewards,
    events
  });
});

app.listen(PORT, () => {
  console.log(`✅ MyZubster Referral System in ascolto su http://localhost:${PORT}`);
});
