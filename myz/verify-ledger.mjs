#!/usr/bin/env node
import fs from 'node:fs';

const file = process.argv[2] || 'myz/ledger.json';
const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];
const DECIMAL_RE = /^-?\d+(?:\.\d{1,18})?$/;
const SCALE = 18;

function parseUnits(value) {
  const text = String(value).trim();
  if (!DECIMAL_RE.test(text)) throw new Error('invalid decimal');
  const negative = text.startsWith('-');
  const unsigned = negative ? text.slice(1) : text;
  const [whole, fraction = ''] = unsigned.split('.');
  const units = BigInt(whole + fraction.padEnd(SCALE, '0'));
  return negative ? -units : units;
}

function formatUnits(units) {
  const negative = units < 0n;
  const absolute = negative ? -units : units;
  const raw = absolute.toString().padStart(SCALE + 1, '0');
  const whole = raw.slice(0, -SCALE);
  const fraction = raw.slice(-SCALE).replace(/0+$/, '');
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

if (ledger.schema !== 'myzubster-myz-ledger/v1') errors.push('invalid schema');
if (ledger.asset !== 'MYZ') errors.push('asset must be MYZ');
if (ledger.asset_type !== 'internal-reward-accounting-unit') errors.push('invalid asset_type');
if (ledger.on_chain !== false) errors.push('v1 must not claim on-chain state');
if (!Array.isArray(ledger.entries)) errors.push('entries must be an array');

const ids = new Set();
for (const [i, e] of ledger.entries.entries()) {
  if (!e || typeof e !== 'object') { errors.push(`entry ${i}: not an object`); continue; }
  if (!e.entry_id || ids.has(e.entry_id)) errors.push(`entry ${i}: missing or duplicate entry_id`);
  ids.add(e.entry_id);
  try {
    if (parseUnits(e.amount_myz) === 0n) errors.push(`entry ${i}: amount_myz must be non-zero`);
  } catch (_) {
    errors.push(`entry ${i}: amount_myz must be a decimal value with at most 18 fractional digits`);
  }
  if (!e.account_id) errors.push(`entry ${i}: account_id required`);
  if (!e.timestamp || Number.isNaN(Date.parse(e.timestamp))) errors.push(`entry ${i}: valid timestamp required`);
  if (!['PROPOSED','APPROVED','RECORDED','REVERSED'].includes(e.status)) errors.push(`entry ${i}: invalid status`);
}

const reversed = new Set(ledger.entries.filter(e => e?.entry_type === 'REVERSAL' && e?.status === 'RECORDED' && e?.reverses_entry_id).map(e => e.reverses_entry_id));
const balances = {};
for (const e of ledger.entries) {
  if (e?.status !== 'RECORDED' || !e.account_id || e.entry_type === 'REVERSAL' || reversed.has(e.entry_id)) continue;
  try {
    const current = balances[e.account_id] ? parseUnits(balances[e.account_id]) : 0n;
    balances[e.account_id] = formatUnits(current + parseUnits(e.amount_myz));
  } catch (_) {}
}

const result = { verifier: 'myz-ledger-verifier/v1', ok: errors.length === 0, errors, balances };
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
