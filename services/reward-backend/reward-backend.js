/**
 * Reward Backend — automatic MYZ assignment + minting (Bounty #252)
 *
 * Responsibilities:
 *   1. Accept reward-assignment triggers (PR merged, bug report validated, etc.)
 *   2. Auto-assign MYZ amounts from a declarative reward policy
 *   3. Mint/credit MYZ to the contributor wallet via the Gateway Tari release endpoint
 *   4. Persist every reward event (userId, amount, reason, timestamp, txHash)
 *   5. Expose an HTTP API for the frontend to fetch a user's reward history
 *
 * Gateway contract (MyZubsterGateway, routes/tari.js):
 *   POST /api/tari/release   { fromAddress, toAddress, amount }  -> credits MYZ
 *
 * Env:
 *   PORT            (default 5003)
 *   GATEWAY_URL     (default http://localhost:5002)
 *   TREASURY_ADDRESS  (fromAddress used to fund rewards)
 *   JWT_SECRET      (default myzubster-secret)
 *   REWARD_STORE    (path to JSON store, default ./reward-events.json)
 */

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5003;
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5002';
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || '';
const JWT_SECRET = process.env.JWT_SECRET || 'myzubster-secret';
const STORE_PATH = process.env.REWARD_STORE || path.join(__dirname, 'reward-events.json');

// ---------------------------------------------------------------------------
// Reward policy: declarative amount table. Trigger -> MYZ amount.
// ---------------------------------------------------------------------------
const REWARD_POLICY = {
  pr_merged: 30,        // a bounty PR was merged upstream
  bug_validated: 10,    // a bug report was validated by maintainers
  referral_signed_up: 5,// a referred user signed up
  qa_approved: 20,      // a QA report was approved
};

const VALID_TRIGGERS = Object.keys(REWARD_POLICY);

// ---------------------------------------------------------------------------
// JSON-file store (no external DB required; swap-in Mongo is trivial)
// ---------------------------------------------------------------------------
function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch (_e) {
    return { events: [] };
  }
}

function saveStore(store) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function appendEvent(store, event) {
  store.events.push(event);
  saveStore(store);
  return event;
}

// ---------------------------------------------------------------------------
// Mint helper — credits MYZ to the contributor via the Gateway Tari release
// ---------------------------------------------------------------------------
function gatewayToken() {
  return jwt.sign({ userId: 'reward-backend', role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
}

async function mintMYZ(toAddress, amount) {
  if (!TREASURY_ADDRESS) {
    throw new Error('TREASURY_ADDRESS is not set — cannot fund rewards');
  }
  const res = await axios.post(
    `${GATEWAY_URL}/api/tari/release`,
    { fromAddress: TREASURY_ADDRESS, toAddress, amount: parseFloat(amount) },
    {
      headers: { Authorization: `Bearer ${gatewayToken()}`, 'Content-Type': 'application/json' },
      timeout: 10000,
    }
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());

// POST /api/rewards/assign — trigger an automatic reward assignment + mint
app.post('/api/rewards/assign', async (req, res) => {
  const { trigger, userId, wallet, metadata = {} } = req.body || {};
  if (!trigger || !VALID_TRIGGERS.includes(trigger)) {
    return res.status(400).json({ error: `trigger required, one of: ${VALID_TRIGGERS.join(', ')}` });
  }
  if (!userId || !wallet) {
    return res.status(400).json({ error: 'userId and wallet are required' });
  }

  const amount = REWARD_POLICY[trigger];
  let txHash = null;
  let mintStatus = 'pending';

  try {
    const mint = await mintMYZ(wallet, amount);
    txHash = mint.txHash || mint.tx_hash || mint.transactionHash || null;
    mintStatus = mint.success === false ? 'failed' : 'minted';
  } catch (err) {
    mintStatus = 'failed';
    console.error(`[reward-backend] mint failed for ${userId}:`, err.message);
  }

  const event = {
    rewardId: crypto.randomBytes(6).toString('hex'),
    userId,
    wallet,
    trigger,
    amount,
    currency: 'MYZ',
    reason: `auto-assigned for ${trigger}`,
    metadata,
    txHash,
    mintStatus,
    createdAt: new Date().toISOString(),
  };

  const store = loadStore();
  appendEvent(store, event);
  res.status(201).json({ message: 'reward assigned', reward: event });
});

// GET /api/rewards/:userId — reward history for the frontend
app.get('/api/rewards/:userId', (req, res) => {
  const { userId } = req.params;
  const store = loadStore();
  const events = store.events.filter((e) => e.userId === userId);
  const total = events
    .filter((e) => e.mintStatus === 'minted')
    .reduce((sum, e) => sum + e.amount, 0);
  res.json({ userId, totalMYZ: total, count: events.length, events });
});

// GET /api/rewards — all events (admin)
app.get('/api/rewards', (_req, res) => {
  const store = loadStore();
  res.json(store);
});

// GET /health
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'reward-backend', policy: REWARD_POLICY });
});

app.listen(PORT, () => {
  console.log(`[reward-backend] listening on :${PORT} (gateway ${GATEWAY_URL})`);
});

module.exports = { app, REWARD_POLICY, loadStore, mintMYZ };
