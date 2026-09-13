'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_LEDGER_PATH = path.resolve(REPO_ROOT, 'myz', 'ledger.json');
const DECIMAL_RE = /^-?\d+(?:\.\d{1,18})?$/;
const SCALE = 18;

function parseUnits(value) {
  const text = String(value).trim();
  if (!DECIMAL_RE.test(text)) throw Object.assign(new Error('Invalid MYZ decimal amount'), { code: 'INVALID_MYZ_AMOUNT' });
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

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function revisionFor(ledger) {
  return crypto.createHash('sha256').update(stableStringify(ledger)).digest('hex');
}

function assertLedger(ledger) {
  if (!ledger || ledger.schema !== 'myzubster-myz-ledger/v1' || ledger.asset !== 'MYZ' || ledger.on_chain !== false || !Array.isArray(ledger.entries)) {
    throw Object.assign(new Error('Canonical MYZ ledger is invalid'), { code: 'INVALID_MYZ_LEDGER' });
  }
}

function reversedEntryIds(entries) {
  const ids = new Set();
  for (const entry of entries) {
    if (entry?.entry_type === 'REVERSAL' && entry?.status === 'RECORDED' && entry?.reverses_entry_id) ids.add(entry.reverses_entry_id);
  }
  return ids;
}

class MyzLedgerApiService {
  constructor(options = {}) {
    this.ledgerPath = options.ledgerPath || process.env.MYZ_LEDGER_PATH || DEFAULT_LEDGER_PATH;
    this.fs = options.fs || fs;
  }

  readLedger() {
    const ledger = JSON.parse(this.fs.readFileSync(this.ledgerPath, 'utf8'));
    assertLedger(ledger);
    return ledger;
  }

  balanceFor(ledger, accountId) {
    const reversed = reversedEntryIds(ledger.entries);
    let total = 0n;
    for (const entry of ledger.entries) {
      if (entry?.status !== 'RECORDED') continue;
      if (entry?.entry_type === 'REVERSAL') continue;
      if (reversed.has(entry?.entry_id)) continue;
      if (entry?.account_id !== accountId) continue;
      total += parseUnits(entry.amount_myz);
    }
    return total;
  }

  getBalance(accountId) {
    const normalized = String(accountId || '').trim();
    if (!normalized) throw Object.assign(new Error('accountId is required'), { code: 'INVALID_MYZ_ACCOUNT' });
    const ledger = this.readLedger();
    return {
      schema: 'myzubster-myz-ledger-balance/v1',
      asset: 'MYZ',
      accountId: normalized,
      balanceMyz: formatUnits(this.balanceFor(ledger, normalized)),
      revision: revisionFor(ledger)
    };
  }

  appendDebit(input = {}) {
    const accountId = String(input.account_id || '').trim();
    const amountText = String(input.amount_myz || '').trim();
    const idempotencyKey = String(input.idempotency_key || '').trim();
    if (!accountId || !idempotencyKey) throw Object.assign(new Error('account_id and idempotency_key are required'), { code: 'INVALID_MYZ_LEDGER_ENTRY' });

    const amount = parseUnits(amountText);
    if (amount >= 0n) throw Object.assign(new Error('ADJUSTMENT_DEBIT amount_myz must be negative'), { code: 'INVALID_MYZ_LEDGER_ENTRY' });

    const ledger = this.readLedger();
    const duplicate = ledger.entries.find(entry => entry?.reference?.idempotency_key === idempotencyKey);
    if (duplicate) return { entry: duplicate, duplicate: true, revision: revisionFor(ledger) };

    const balance = this.balanceFor(ledger, accountId);
    if (balance + amount < 0n) throw Object.assign(new Error('Insufficient canonical MYZ balance'), { code: 'INSUFFICIENT_MYZ_BALANCE' });

    const entry = {
      entry_id: `MYZ-LEDGER-${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      account_id: accountId,
      amount_myz: formatUnits(amount),
      entry_type: 'ADJUSTMENT_DEBIT',
      reference: {
        ...(input.reference && typeof input.reference === 'object' ? input.reference : {}),
        idempotency_key: idempotencyKey
      },
      status: 'RECORDED',
      evidence: Array.isArray(input.evidence) ? input.evidence.map(String) : [],
      reverses_entry_id: null,
      note: String(input.note || 'Marketplace redemption debit after independently reconciled external settlement')
    };

    ledger.entries.push(entry);
    const directory = path.dirname(this.ledgerPath);
    const temp = path.join(directory, `.${path.basename(this.ledgerPath)}.${process.pid}.${crypto.randomUUID()}.tmp`);
    const serialized = `${JSON.stringify(ledger, null, 2)}\n`;
    this.fs.writeFileSync(temp, serialized, { encoding: 'utf8', flag: 'wx' });
    this.fs.renameSync(temp, this.ledgerPath);

    const persisted = this.readLedger();
    const confirmed = persisted.entries.find(candidate => candidate.entry_id === entry.entry_id);
    if (!confirmed || confirmed.status !== 'RECORDED') throw Object.assign(new Error('Canonical debit persistence could not be verified'), { code: 'MYZ_LEDGER_PERSISTENCE_UNVERIFIED' });
    return { entry: confirmed, duplicate: false, revision: revisionFor(persisted) };
  }
}

module.exports = new MyzLedgerApiService();
module.exports.MyzLedgerApiService = MyzLedgerApiService;
module.exports.parseUnits = parseUnits;
module.exports.formatUnits = formatUnits;
module.exports.revisionFor = revisionFor;
