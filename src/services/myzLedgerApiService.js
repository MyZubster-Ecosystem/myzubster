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
    const configuredPrefixes = options.allowedAccountPrefixes || process.env.MYZ_LEDGER_ALLOWED_ACCOUNT_PREFIXES || 'marketplace:user:';
    this.allowedAccountPrefixes = String(configuredPrefixes).split(',').map(value => value.trim()).filter(Boolean);
  }

  assertAuthorizedAccount(accountId) {
    const normalized = String(accountId || '').trim();
    if (!normalized) throw Object.assign(new Error('accountId is required'), { code: 'INVALID_MYZ_ACCOUNT' });
    if (!this.allowedAccountPrefixes.some(prefix => normalized.startsWith(prefix))) {
      throw Object.assign(new Error('Account is outside the authorized MYZ ledger namespace'), { code: 'MYZ_LEDGER_ACCOUNT_FORBIDDEN' });
    }
    return normalized;
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
    const normalized = this.assertAuthorizedAccount(accountId);
    const ledger = this.readLedger();
    return {
      schema: 'myzubster-myz-ledger-balance/v1',
      asset: 'MYZ',
      accountId: normalized,
      balanceMyz: formatUnits(this.balanceFor(ledger, normalized)),
      revision: revisionFor(ledger)
    };
  }

  lookupEntries(input = {}) {
    const accountId = this.assertAuthorizedAccount(input.accountId || input.account_id);
    const entryId = String(input.entryId || input.entry_id || '').trim();
    const idempotencyKey = String(input.idempotencyKey || input.idempotency_key || '').trim();
    const redemptionId = String(input.redemptionId || input.redemption_id || '').trim();
    const providerTransactionId = String(input.providerTransactionId || input.provider_transaction_id || '').trim();
    if (!entryId && !idempotencyKey && !redemptionId && !providerTransactionId) {
      throw Object.assign(new Error('At least one canonical ledger lookup selector is required'), { code: 'INVALID_MYZ_LEDGER_LOOKUP' });
    }

    const ledger = this.readLedger();
    const reversedBy = new Map();
    for (const candidate of ledger.entries) {
      if (candidate?.entry_type === 'REVERSAL' && candidate?.status === 'RECORDED' && candidate?.reverses_entry_id) {
        reversedBy.set(candidate.reverses_entry_id, candidate);
      }
    }

    const matches = ledger.entries.filter(candidate => {
      if (candidate?.account_id !== accountId) return false;
      if (entryId && candidate?.entry_id !== entryId) return false;
      if (idempotencyKey && candidate?.reference?.idempotency_key !== idempotencyKey) return false;
      if (redemptionId && candidate?.reference?.redemption_id !== redemptionId) return false;
      if (providerTransactionId && candidate?.reference?.provider_transaction_id !== providerTransactionId) return false;
      return true;
    }).map(candidate => ({
      ...candidate,
      reversed: reversedBy.has(candidate.entry_id),
      reversalEntryId: reversedBy.get(candidate.entry_id)?.entry_id || null
    }));

    return {
      schema: 'myzubster-myz-ledger-lookup/v1',
      asset: 'MYZ',
      accountId,
      revision: revisionFor(ledger),
      matched: matches.length,
      entries: matches
    };
  }

  withWriteLock(fn) {
    const lockPath = `${this.ledgerPath}.lock`;
    let fd;
    try {
      fd = this.fs.openSync(lockPath, 'wx');
    } catch (error) {
      if (error && error.code === 'EEXIST') throw Object.assign(new Error('Canonical MYZ ledger is busy; retry safely with the same idempotency key'), { code: 'MYZ_LEDGER_BUSY' });
      throw error;
    }
    try {
      return fn();
    } finally {
      try { if (fd !== undefined) this.fs.closeSync(fd); } catch (_) {}
      try { this.fs.unlinkSync(lockPath); } catch (_) {}
    }
  }

  appendDebit(input = {}) {
    const accountId = this.assertAuthorizedAccount(input.account_id);
    const amountText = String(input.amount_myz || '').trim();
    const idempotencyKey = String(input.idempotency_key || '').trim();
    if (!idempotencyKey) throw Object.assign(new Error('idempotency_key is required'), { code: 'INVALID_MYZ_LEDGER_ENTRY' });

    const amount = parseUnits(amountText);
    if (amount >= 0n) throw Object.assign(new Error('ADJUSTMENT_DEBIT amount_myz must be negative'), { code: 'INVALID_MYZ_LEDGER_ENTRY' });

    return this.withWriteLock(() => {
      const ledger = this.readLedger();
      const duplicate = ledger.entries.find(entry => entry?.reference?.idempotency_key === idempotencyKey);
      if (duplicate) {
        const samePayload = duplicate.account_id === accountId && parseUnits(duplicate.amount_myz) === amount && duplicate.entry_type === 'ADJUSTMENT_DEBIT';
        if (!samePayload) throw Object.assign(new Error('Idempotency key already exists with a different ledger payload'), { code: 'MYZ_LEDGER_IDEMPOTENCY_CONFLICT' });
        return { entry: duplicate, duplicate: true, revision: revisionFor(ledger) };
      }

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
    });
  }
}

module.exports = new MyzLedgerApiService();
module.exports.MyzLedgerApiService = MyzLedgerApiService;
module.exports.parseUnits = parseUnits;
module.exports.formatUnits = formatUnits;
module.exports.revisionFor = revisionFor;
