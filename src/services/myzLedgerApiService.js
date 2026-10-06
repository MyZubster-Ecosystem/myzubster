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
    const configuredPrefixes = options.allowedAccountPrefixes || process.env.MYZ_LEDGER_ALLOWED_ACCOUNT_PREFIXES || 'marketplace:user:,zorgax:system:,contributor:';
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

  getHistory(input = {}) {
    const accountId = this.assertAuthorizedAccount(input.accountId || input.account_id);
    const requestedLimit = Number(input.limit);
    const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 250) : 100;
    const ledger = this.readLedger();
    const reversedBy = new Map();
    for (const candidate of ledger.entries) {
      if (candidate?.entry_type === 'REVERSAL' && candidate?.status === 'RECORDED' && candidate?.reverses_entry_id) {
        reversedBy.set(candidate.reverses_entry_id, candidate);
      }
    }
    const entries = ledger.entries
      .filter(candidate => candidate?.account_id === accountId)
      .slice()
      .reverse()
      .slice(0, limit)
      .map(candidate => ({
        ...candidate,
        reversed: reversedBy.has(candidate.entry_id),
        reversalEntryId: reversedBy.get(candidate.entry_id)?.entry_id || null
      }));
    return {
      schema: 'myzubster-myz-ledger-history/v1',
      asset: 'MYZ',
      assetType: 'internal-reward-accounting-unit',
      onChain: false,
      accountId,
      balanceMyz: formatUnits(this.balanceFor(ledger, accountId)),
      revision: revisionFor(ledger),
      entries
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

  transfer(input = {}) {
    const fromAccountId = this.assertAuthorizedAccount(input.from_account_id || input.fromAccountId);
    const toAccountId = this.assertAuthorizedAccount(input.to_account_id || input.toAccountId);
    if (fromAccountId === toAccountId) {
      throw Object.assign(new Error('MYZ self-transfer is not allowed'), { code: 'MYZ_SELF_TRANSFER_FORBIDDEN' });
    }

    const amountText = String(input.amount_myz ?? input.amountMyz ?? '').trim();
    const amount = parseUnits(amountText);
    if (amount <= 0n) {
      throw Object.assign(new Error('MYZ transfer amount must be positive'), { code: 'INVALID_MYZ_LEDGER_TRANSFER' });
    }

    const idempotencyKey = String(input.idempotency_key || input.idempotencyKey || '').trim();
    if (!idempotencyKey) {
      throw Object.assign(new Error('idempotency_key is required'), { code: 'INVALID_MYZ_LEDGER_TRANSFER' });
    }

    const requestedTransferId = String(input.transfer_id || input.transferId || '').trim();
    const transferId = requestedTransferId || `MYZ-TRANSFER-${crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 32)}`;
    const reference = input.reference && typeof input.reference === 'object' ? input.reference : {};
    const evidence = Array.isArray(input.evidence) ? input.evidence.map(String) : [];

    return this.withWriteLock(() => {
      const ledger = this.readLedger();
      const replayEntries = ledger.entries.filter(entry => entry?.reference?.idempotency_key === idempotencyKey);
      if (replayEntries.length) {
        const debit = replayEntries.find(entry => entry?.entry_type === 'INTERNAL_TRANSFER_DEBIT');
        const credit = replayEntries.find(entry => entry?.entry_type === 'INTERNAL_TRANSFER_CREDIT');
        const replayReference = { ...(debit?.reference || {}) };
        delete replayReference.idempotency_key;
        delete replayReference.transfer_id;
        delete replayReference.counterparty_account_id;
        const samePayload = debit && credit &&
          debit.account_id === fromAccountId &&
          credit.account_id === toAccountId &&
          parseUnits(debit.amount_myz) === -amount &&
          parseUnits(credit.amount_myz) === amount &&
          String(debit.transfer_id || debit.reference?.transfer_id || '') === transferId &&
          String(credit.transfer_id || credit.reference?.transfer_id || '') === transferId &&
          stableStringify(replayReference) === stableStringify(reference);
        if (!samePayload) {
          throw Object.assign(new Error('Idempotency key already exists with a different ledger payload'), { code: 'MYZ_LEDGER_IDEMPOTENCY_CONFLICT' });
        }
        return {
          transferId,
          debitEntry: debit,
          creditEntry: credit,
          duplicate: true,
          fromBalanceMyz: formatUnits(this.balanceFor(ledger, fromAccountId)),
          toBalanceMyz: formatUnits(this.balanceFor(ledger, toAccountId)),
          revision: revisionFor(ledger)
        };
      }

      const transferConflict = ledger.entries.find(entry =>
        String(entry?.transfer_id || entry?.reference?.transfer_id || '') === transferId
      );
      if (transferConflict) {
        throw Object.assign(new Error('transfer_id already exists with a different idempotency key'), { code: 'MYZ_LEDGER_TRANSFER_CONFLICT' });
      }

      const balance = this.balanceFor(ledger, fromAccountId);
      if (balance - amount < 0n) {
        throw Object.assign(new Error('Insufficient canonical MYZ balance'), { code: 'INSUFFICIENT_MYZ_BALANCE' });
      }

      const timestamp = new Date().toISOString();
      const debitEntry = {
        entry_id: `MYZ-LEDGER-${crypto.randomUUID()}`,
        timestamp,
        account_id: fromAccountId,
        amount_myz: formatUnits(-amount),
        entry_type: 'INTERNAL_TRANSFER_DEBIT',
        transfer_id: transferId,
        reference: {
          ...reference,
          idempotency_key: idempotencyKey,
          transfer_id: transferId,
          counterparty_account_id: toAccountId
        },
        status: 'RECORDED',
        evidence,
        reverses_entry_id: null,
        note: String(input.debit_note || input.note || `Internal MYZ transfer to ${toAccountId}`)
      };
      const creditEntry = {
        entry_id: `MYZ-LEDGER-${crypto.randomUUID()}`,
        timestamp,
        account_id: toAccountId,
        amount_myz: formatUnits(amount),
        entry_type: 'INTERNAL_TRANSFER_CREDIT',
        transfer_id: transferId,
        reference: {
          ...reference,
          idempotency_key: idempotencyKey,
          transfer_id: transferId,
          counterparty_account_id: fromAccountId
        },
        status: 'RECORDED',
        evidence,
        reverses_entry_id: null,
        note: String(input.credit_note || input.note || `Internal MYZ transfer from ${fromAccountId}`)
      };

      ledger.entries.push(debitEntry, creditEntry);
      const directory = path.dirname(this.ledgerPath);
      const temp = path.join(directory, `.${path.basename(this.ledgerPath)}.${process.pid}.${crypto.randomUUID()}.tmp`);
      const serialized = `${JSON.stringify(ledger, null, 2)}\n`;
      this.fs.writeFileSync(temp, serialized, { encoding: 'utf8', flag: 'wx' });
      this.fs.renameSync(temp, this.ledgerPath);

      const persisted = this.readLedger();
      const persistedDebit = persisted.entries.find(candidate => candidate.entry_id === debitEntry.entry_id);
      const persistedCredit = persisted.entries.find(candidate => candidate.entry_id === creditEntry.entry_id);
      if (!persistedDebit || !persistedCredit || persistedDebit.status !== 'RECORDED' || persistedCredit.status !== 'RECORDED') {
        throw Object.assign(new Error('Canonical transfer persistence could not be verified'), { code: 'MYZ_LEDGER_PERSISTENCE_UNVERIFIED' });
      }

      return {
        transferId,
        debitEntry: persistedDebit,
        creditEntry: persistedCredit,
        duplicate: false,
        fromBalanceMyz: formatUnits(this.balanceFor(persisted, fromAccountId)),
        toBalanceMyz: formatUnits(this.balanceFor(persisted, toAccountId)),
        revision: revisionFor(persisted)
      };
    });
  }

  appendDebit(input = {}) {
    const accountId = this.assertAuthorizedAccount(input.account_id);
    const amountText = String(input.amount_myz || '').trim();
    const idempotencyKey = String(input.idempotency_key || '').trim();
    if (!idempotencyKey) throw Object.assign(new Error('idempotency_key is required'), { code: 'INVALID_MYZ_LEDGER_ENTRY' });

    const amount = parseUnits(amountText);
    if (amount >= 0n) throw Object.assign(new Error('ADJUSTMENT_DEBIT amount_myz must be negative'), { code: 'INVALID_MYZ_LEDGER_ENTRY' });

    const reference = input.reference && typeof input.reference === 'object' ? input.reference : {};

    return this.withWriteLock(() => {
      const ledger = this.readLedger();
      const duplicate = ledger.entries.find(entry => entry?.reference?.idempotency_key === idempotencyKey);
      if (duplicate) {
        const replayReference = { ...(duplicate.reference || {}) };
        delete replayReference.idempotency_key;
        const samePayload =
          duplicate.account_id === accountId &&
          parseUnits(duplicate.amount_myz) === amount &&
          duplicate.entry_type === 'ADJUSTMENT_DEBIT' &&
          stableStringify(replayReference) === stableStringify(reference);
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
          ...reference,
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
