require('dotenv').config();

const express = require('express');
const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const GATEWAY_URL = process.env.GATEWAY_URL || 'https://api.myzubster.com';
const GATEWAY_MINT_ENDPOINT = process.env.GATEWAY_MINT_ENDPOINT || '/mint';

// --- Database ---
const db = new Database(path.join(__dirname, 'rewards.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    reference TEXT,
    status TEXT DEFAULT 'pending',
    tx_hash TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
  CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
`);

const app = express();
app.use(express.json());

// --- Reward Assignment ---
async function mintMYZ(walletAddress, amount, reason) {
  try {
    const response = await axios.post(
      `${GATEWAY_URL}${GATEWAY_MINT_ENDPOINT}`,
      {
        wallet: walletAddress,
        amount: amount,
        memo: reason
      },
      { timeout: 10000 }
    );
    return { success: true, tx_hash: response.data?.tx_hash || response.data?.transactionHash || null };
  } catch (err) {
    if (err.response) {
      return { success: false, error: `Gateway error: ${err.response.status} — ${JSON.stringify(err.response.data)}` };
    }
    return { success: false, error: err.message };
  }
}

// POST /reward — Assign a reward
app.post('/reward', async (req, res) => {
  const { user_id, wallet_address, amount, reason, reference } = req.body;

  if (!user_id || !wallet_address || !amount || !reason) {
    return res.status(400).json({
      error: 'Missing required fields: user_id, wallet_address, amount, reason'
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  // Insert pending reward record
  const stmt = db.prepare(`
    INSERT INTO rewards (user_id, wallet_address, amount, reason, reference, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(user_id, wallet_address, amount, reason, reference || null);
  const rewardId = result.lastInsertRowid;

  // Attempt MYZ mint
  const mintResult = await mintMYZ(wallet_address, amount, reason);

  if (mintResult.success) {
    db.prepare('UPDATE rewards SET status = ?, tx_hash = ?, updated_at = datetime(\"now\") WHERE id = ?')
      .run('completed', mintResult.tx_hash, rewardId);
    return res.status(201).json({
      id: rewardId,
      status: 'completed',
      tx_hash: mintResult.tx_hash,
      message: `Reward of ${amount} MYZ sent to ${wallet_address}`
    });
  } else {
    db.prepare('UPDATE rewards SET status = ?, updated_at = datetime(\"now\") WHERE id = ?')
      .run('failed', rewardId);
    return res.status(202).json({
      id: rewardId,
      status: 'failed',
      error: mintResult.error,
      message: `Reward recorded but minting failed. Retry with POST /reward/${rewardId}/retry`
    });
  }
});

// POST /reward/:id/retry — Retry a failed mint
app.post('/reward/:id/retry', async (req, res) => {
  const reward = db.prepare('SELECT * FROM rewards WHERE id = ?').get(req.params.id);
  if (!reward) return res.status(404).json({ error: 'Reward not found' });
  if (reward.status === 'completed') return res.json({ message: 'Already completed', reward });

  const mintResult = await mintMYZ(reward.wallet_address, reward.amount, reward.reason);
  if (mintResult.success) {
    db.prepare('UPDATE rewards SET status = ?, tx_hash = ?, updated_at = datetime(\"now\") WHERE id = ?')
      .run('completed', mintResult.tx_hash, reward.id);
    return res.json({ status: 'completed', tx_hash: mintResult.tx_hash });
  }
  return res.json({ status: 'failed', error: mintResult.error });
});

// GET /rewards/:userId — Reward history for a user
app.get('/rewards/:userId', (req, res) => {
  const rewards = db.prepare(
    'SELECT id, amount, reason, reference, status, tx_hash, created_at FROM rewards WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.params.userId);

  const total = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM rewards WHERE user_id = ? AND status = \"completed\"'
  ).get(req.params.userId);

  res.json({
    user_id: req.params.userId,
    total_earned: total.total,
    count: rewards.length,
    rewards
  });
});

// GET /rewards — All rewards (admin)
app.get('/rewards', (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM rewards';
  const params = [];

  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const rewards = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM rewards').get();
  res.json({ total: total.count, rewards });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'myzubster-reward-backend', gateway: GATEWAY_URL });
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`🏆 MyZubster Reward Backend running on port ${PORT}`);
  console.log(`   Gateway: ${GATEWAY_URL}${GATEWAY_MINT_ENDPOINT}`);
  console.log(`   POST /reward — Assign reward`);
  console.log(`   GET /rewards/:userId — User history`);
  console.log(`   GET /rewards — All rewards (admin)`);
});
