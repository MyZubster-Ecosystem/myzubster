#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const queueFile = process.env.MYZ_SETTLEMENT_QUEUE || 'myz/settlement-queue.json';
const live = process.env.MYZ_XMR_LIVE === 'true';
const rpcUrl = process.env.MONERO_WALLET_RPC_URL;
const rpcUser = process.env.MONERO_WALLET_RPC_USER;
const rpcPassword = process.env.MONERO_WALLET_RPC_PASSWORD;

function loadQueue() {
  if (!fs.existsSync(queueFile)) return { schema: 'myzubster-xmr-settlement/v1', items: [] };
  return JSON.parse(fs.readFileSync(queueFile, 'utf8'));
}
function saveQueue(q) { fs.writeFileSync(queueFile, `${JSON.stringify(q, null, 2)}\n`); }
function validate(item) {
  if (item.status !== 'SETTLEMENT_PENDING') throw new Error('bounty is not settlement pending');
  if (!item.bounty_approved) throw new Error('bounty is not approved');
  if (!item.myz_entry_id) throw new Error('missing MYZ ledger credit');
  if (!item.xmr_address) throw new Error('missing XMR payout address');
  if (!Number.isInteger(item.amount_atomic) || item.amount_atomic <= 0) throw new Error('invalid XMR atomic amount');
  if (!item.evidence?.length) throw new Error('missing approval evidence');
}
async function rpc(method, params) {
  const headers = { 'content-type': 'application/json' };
  if (rpcUser || rpcPassword) headers.authorization = `Basic ${Buffer.from(`${rpcUser || ''}:${rpcPassword || ''}`).toString('base64')}`;
  const res = await fetch(rpcUrl, { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: 'myzubster', method, params }) });
  if (!res.ok) throw new Error(`wallet RPC HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`wallet RPC error: ${body.error.message || body.error.code}`);
  return body.result;
}

const q = loadQueue();
let changed = false;
for (const item of q.items) {
  if (item.status !== 'SETTLEMENT_PENDING') continue;
  try {
    validate(item);
    item.idempotency_key ||= crypto.createHash('sha256').update(`${item.myz_entry_id}|${item.xmr_address}|${item.amount_atomic}`).digest('hex');
    const alreadyPaid = q.items.some(other => other !== item && other.idempotency_key === item.idempotency_key && other.status === 'XMR_PAID');
    if (alreadyPaid) throw new Error('duplicate settlement already paid');
    if (!live) {
      item.last_check = new Date().toISOString();
      item.note = 'Validated in dry-run; no XMR sent. Set MYZ_XMR_LIVE=true only after wallet/provider review.';
      changed = true;
      continue;
    }
    if (!rpcUrl) throw new Error('MONERO_WALLET_RPC_URL is required for live settlement');
    const balance = await rpc('get_balance', {});
    if (Number(balance.unlocked_balance) < item.amount_atomic) throw new Error('insufficient unlocked XMR balance');
    item.status = 'XMR_PAYOUT_PENDING'; saveQueue(q);
    const result = await rpc('transfer', { destinations: [{ amount: item.amount_atomic, address: item.xmr_address }], get_tx_key: false });
    if (!result?.tx_hash) throw new Error('wallet returned no tx_hash');
    item.status = 'XMR_PAID';
    item.tx_hash = result.tx_hash;
    item.paid_at = new Date().toISOString();
    changed = true;
  } catch (error) {
    item.status = live ? 'SETTLEMENT_FAILED' : item.status;
    item.error = String(error.message || error);
    item.last_check = new Date().toISOString();
    changed = true;
  }
}
if (changed) saveQueue(q);
console.log(JSON.stringify({ live, processed: q.items.length, queue: queueFile }));
