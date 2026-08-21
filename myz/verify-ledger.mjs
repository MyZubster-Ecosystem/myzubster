#!/usr/bin/env node
import fs from 'node:fs';

const file = process.argv[2] || 'myz/ledger.json';
const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = [];

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
  if (!Number.isFinite(e.amount_myz) || e.amount_myz === 0) errors.push(`entry ${i}: amount_myz must be a non-zero number`);
  if (!e.account_id) errors.push(`entry ${i}: account_id required`);
  if (!e.timestamp || Number.isNaN(Date.parse(e.timestamp))) errors.push(`entry ${i}: valid timestamp required`);
  if (!['PROPOSED','APPROVED','RECORDED','REVERSED'].includes(e.status)) errors.push(`entry ${i}: invalid status`);
}

const balances = {};
for (const e of ledger.entries) {
  if (e?.status === 'RECORDED' && e.account_id && Number.isFinite(e.amount_myz)) {
    balances[e.account_id] = (balances[e.account_id] || 0) + e.amount_myz;
  }
}

const result = { verifier: 'myz-ledger-verifier/v1', ok: errors.length === 0, errors, balances };
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
