#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const [, , accountId, amountRaw, bountyId, evidence] = process.argv;
if (!accountId || !amountRaw || !bountyId || !evidence) {
  console.error('Usage: node myz/credit-bounty.mjs <account_id> <amount_myz> <bounty_id> <evidence_url>');
  process.exit(1);
}
const amount = Number(amountRaw);
if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount_myz must be positive');
if (!accountId.startsWith('contributor:')) throw new Error('account_id must be a contributor account');

const file = 'myz/ledger.json';
const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
const duplicate = ledger.entries.find(e => e.entry_type === 'BOUNTY_REWARD' && e.reference?.bounty_id === bountyId && e.account_id === accountId && e.status === 'RECORDED');
if (duplicate) {
  console.log(`Already credited: ${duplicate.entry_id}`);
  process.exit(0);
}
const timestamp = new Date().toISOString();
const digest = crypto.createHash('sha256').update(`${accountId}|${bountyId}|${evidence}`).digest('hex').slice(0, 16).toUpperCase();
const entry = {
  entry_id: `MYZ-BOUNTY-${digest}`,
  timestamp,
  account_id: accountId,
  amount_myz: amount,
  entry_type: 'BOUNTY_REWARD',
  reference: { program: 'github-bounty', bounty_id: bountyId },
  status: 'RECORDED',
  evidence: [evidence],
  reverses_entry_id: null,
  note: 'Approved contribution reward. Internal MYZ accounting credit; external settlement is tracked separately.'
};
ledger.entries.push(entry);
ledger.integrity.sha256 = null;
ledger.integrity.signature = null;
fs.writeFileSync(file, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(`Credited ${amount} MYZ to ${accountId}: ${entry.entry_id}`);
