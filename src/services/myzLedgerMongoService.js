'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');
const { createMongoConnector } = require('./mongoConnection');
const { parseUnits, formatUnits } = require('./myzLedgerApiService');
const {
  MyzLedgerAccount,
  MyzLedgerEntry,
  MyzLedgerOperation,
  MyzLedgerTransfer
} = require('../models/MyzLedgerMongo');

const connectMongo = createMongoConnector({
  mongoose,
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI,
  logger: console
});

function stableStringify(value) {
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

function payloadHash(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

function decimal128FromUnits(units) {
  return mongoose.Types.Decimal128.fromString(units.toString());
}

function unitsFromDecimal128(value) {
  return BigInt(value ? value.toString() : '0');
}

function entryDto(doc) {
  if (!doc) return null;
  return {
    entry_id: doc.entryId,
    timestamp: doc.timestamp.toISOString(),
    account_id: doc.accountId,
    amount_myz: doc.amountMyz,
    entry_type: doc.entryType,
    transfer_id: doc.transferId || undefined,
    reference: doc.reference || {},
    status: doc.status,
    evidence: doc.evidence || [],
    reverses_entry_id: doc.reversesEntryId || null,
    note: doc.note || ''
  };
}

class MyzLedgerMongoService {
  constructor(options = {}) {
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

  async ready() {
    await connectMongo();
  }

  async ensureIndexes() {
    await this.ready();
    await Promise.all([
      MyzLedgerAccount.init(),
      MyzLedgerEntry.init(),
      MyzLedgerOperation.init(),
      MyzLedgerTransfer.init()
    ]);
  }

  async getBalance(accountId) {
    await this.ready();
    const normalized = this.assertAuthorizedAccount(accountId);
    const account = await MyzLedgerAccount.findOne({ accountId: normalized }).lean();
    const balance = account ? unitsFromDecimal128(account.balanceUnits) : 0n;
    return {
      schema: 'myzubster-myz-ledger-balance/v1',
      asset: 'MYZ',
      accountId: normalized,
      balanceMyz: formatUnits(balance),
      revision: 'mongo:' + normalized + ':' + balance.toString()
    };
  }

  async getHistory(input = {}) {
    await this.ready();
    const accountId = this.assertAuthorizedAccount(input.accountId || input.account_id);
    const requestedLimit = Number(input.limit);
    const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 250) : 100;
    const [account, docs] = await Promise.all([
      MyzLedgerAccount.findOne({ accountId }).lean(),
      MyzLedgerEntry.find({ accountId }).sort({ timestamp: -1, _id: -1 }).limit(limit).lean()
    ]);
    const balance = account ? unitsFromDecimal128(account.balanceUnits) : 0n;
    return {
      schema: 'myzubster-myz-ledger-history/v1',
      asset: 'MYZ',
      assetType: 'internal-reward-accounting-unit',
      onChain: false,
      accountId,
      balanceMyz: formatUnits(balance),
      revision: 'mongo:' + accountId + ':' + balance.toString(),
      entries: docs.map(doc => ({ ...entryDto(doc), reversed: false, reversalEntryId: null }))
    };
  }

  async lookupEntries(input = {}) {
    await this.ready();
    const accountId = this.assertAuthorizedAccount(input.accountId || input.account_id);
    const entryId = String(input.entryId || input.entry_id || '').trim();
    const idempotencyKey = String(input.idempotencyKey || input.idempotency_key || '').trim();
    const redemptionId = String(input.redemptionId || input.redemption_id || '').trim();
    const providerTransactionId = String(input.providerTransactionId || input.provider_transaction_id || '').trim();
    if (!entryId && !idempotencyKey && !redemptionId && !providerTransactionId) {
      throw Object.assign(new Error('At least one canonical ledger lookup selector is required'), { code: 'INVALID_MYZ_LEDGER_LOOKUP' });
    }
    const filter = { accountId };
    if (entryId) filter.entryId = entryId;
    if (idempotencyKey) filter['reference.idempotency_key'] = idempotencyKey;
    if (redemptionId) filter['reference.redemption_id'] = redemptionId;
    if (providerTransactionId) filter['reference.provider_transaction_id'] = providerTransactionId;
    const docs = await MyzLedgerEntry.find(filter).sort({ timestamp: -1, _id: -1 }).lean();
    return {
      schema: 'myzubster-myz-ledger-lookup/v1',
      asset: 'MYZ',
      accountId,
      revision: 'mongo',
      matched: docs.length,
      entries: docs.map(doc => ({ ...entryDto(doc), reversed: false, reversalEntryId: null }))
    };
  }

  async transfer(input = {}) {
    await this.ready();
    const fromAccountId = this.assertAuthorizedAccount(input.from_account_id || input.fromAccountId);
    const toAccountId = this.assertAuthorizedAccount(input.to_account_id || input.toAccountId);
    if (fromAccountId === toAccountId) throw Object.assign(new Error('MYZ self-transfer is not allowed'), { code: 'MYZ_SELF_TRANSFER_FORBIDDEN' });

    const amount = parseUnits(String(input.amount_myz ?? input.amountMyz ?? '').trim());
    if (amount <= 0n) throw Object.assign(new Error('MYZ transfer amount must be positive'), { code: 'INVALID_MYZ_LEDGER_TRANSFER' });

    const idempotencyKey = String(input.idempotency_key || input.idempotencyKey || '').trim();
    if (!idempotencyKey) throw Object.assign(new Error('idempotency_key is required'), { code: 'INVALID_MYZ_LEDGER_TRANSFER' });

    const requestedTransferId = String(input.transfer_id || input.transferId || '').trim();
    const transferId = requestedTransferId || 'MYZ-TRANSFER-' + crypto.createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 32);
    const reference = input.reference && typeof input.reference === 'object' ? input.reference : {};
    const evidence = Array.isArray(input.evidence) ? input.evidence.map(String) : [];
    const semantic = { fromAccountId, toAccountId, amountMyz: formatUnits(amount), transferId, reference };
    const hash = payloadHash(semantic);

    const existing = await MyzLedgerOperation.findOne({ idempotencyKey }).lean();
    if (existing) {
      if (existing.kind !== 'TRANSFER' || existing.payloadHash !== hash) {
        throw Object.assign(new Error('Idempotency key already exists with a different ledger payload'), { code: 'MYZ_LEDGER_IDEMPOTENCY_CONFLICT' });
      }
      const [debit, credit, from, to] = await Promise.all([
        MyzLedgerEntry.findOne({ entryId: existing.debitEntryId }).lean(),
        MyzLedgerEntry.findOne({ entryId: existing.creditEntryId }).lean(),
        MyzLedgerAccount.findOne({ accountId: fromAccountId }).lean(),
        MyzLedgerAccount.findOne({ accountId: toAccountId }).lean()
      ]);
      return {
        transferId,
        debitEntry: entryDto(debit),
        creditEntry: entryDto(credit),
        duplicate: true,
        fromBalanceMyz: formatUnits(from ? unitsFromDecimal128(from.balanceUnits) : 0n),
        toBalanceMyz: formatUnits(to ? unitsFromDecimal128(to.balanceUnits) : 0n),
        revision: 'mongo:' + transferId
      };
    }

    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const conflictingTransfer = await MyzLedgerTransfer.findOne({ transferId }).session(session).lean();
        if (conflictingTransfer) {
          throw Object.assign(new Error('transfer_id already exists with a different idempotency key'), { code: 'MYZ_LEDGER_TRANSFER_CONFLICT' });
        }

        const from = await MyzLedgerAccount.findOneAndUpdate(
          { accountId: fromAccountId, balanceUnits: { $gte: decimal128FromUnits(amount) } },
          { $inc: { balanceUnits: decimal128FromUnits(-amount) } },
          { new: true, session }
        );
        if (!from) throw Object.assign(new Error('Insufficient canonical MYZ balance'), { code: 'INSUFFICIENT_MYZ_BALANCE' });

        const to = await MyzLedgerAccount.findOneAndUpdate(
          { accountId: toAccountId },
          { $inc: { balanceUnits: decimal128FromUnits(amount) }, $setOnInsert: { accountId: toAccountId } },
          { new: true, upsert: true, session }
        );

        const timestamp = new Date();
        const debitEntry = {
          entryId: 'MYZ-LEDGER-' + crypto.randomUUID(),
          timestamp,
          accountId: fromAccountId,
          amountMyz: formatUnits(-amount),
          entryType: 'INTERNAL_TRANSFER_DEBIT',
          transferId,
          reference: { ...reference, idempotency_key: idempotencyKey, transfer_id: transferId, counterparty_account_id: toAccountId },
          status: 'RECORDED',
          evidence,
          reversesEntryId: null,
          note: String(input.debit_note || input.note || 'Internal MYZ transfer to ' + toAccountId)
        };
        const creditEntry = {
          entryId: 'MYZ-LEDGER-' + crypto.randomUUID(),
          timestamp,
          accountId: toAccountId,
          amountMyz: formatUnits(amount),
          entryType: 'INTERNAL_TRANSFER_CREDIT',
          transferId,
          reference: { ...reference, idempotency_key: idempotencyKey, transfer_id: transferId, counterparty_account_id: fromAccountId },
          status: 'RECORDED',
          evidence,
          reversesEntryId: null,
          note: String(input.credit_note || input.note || 'Internal MYZ transfer from ' + fromAccountId)
        };

        await MyzLedgerEntry.create([debitEntry, creditEntry], { session });
        await MyzLedgerTransfer.create([{
          transferId,
          idempotencyKey,
          fromAccountId,
          toAccountId,
          amountMyz: formatUnits(amount),
          debitEntryId: debitEntry.entryId,
          creditEntryId: creditEntry.entryId,
          reference
        }], { session });
        await MyzLedgerOperation.create([{
          idempotencyKey,
          kind: 'TRANSFER',
          payloadHash: hash,
          transferId,
          debitEntryId: debitEntry.entryId,
          creditEntryId: creditEntry.entryId
        }], { session });

        result = {
          transferId,
          debitEntry: entryDto(debitEntry),
          creditEntry: entryDto(creditEntry),
          duplicate: false,
          fromBalanceMyz: formatUnits(unitsFromDecimal128(from.balanceUnits)),
          toBalanceMyz: formatUnits(unitsFromDecimal128(to.balanceUnits)),
          revision: 'mongo:' + transferId
        };
      });
      return result;
    } catch (error) {
      if (error && error.code === 11000) {
        const replay = await MyzLedgerOperation.findOne({ idempotencyKey }).lean();
        if (replay && replay.payloadHash === hash) return this.transfer(input);
        throw Object.assign(new Error('MYZ ledger uniqueness conflict'), { code: 'MYZ_LEDGER_IDEMPOTENCY_CONFLICT' });
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async appendDebit(input = {}) {
    await this.ready();
    const accountId = this.assertAuthorizedAccount(input.account_id);
    const amount = parseUnits(String(input.amount_myz || '').trim());
    const idempotencyKey = String(input.idempotency_key || '').trim();
    if (!idempotencyKey) throw Object.assign(new Error('idempotency_key is required'), { code: 'INVALID_MYZ_LEDGER_ENTRY' });
    if (amount >= 0n) throw Object.assign(new Error('ADJUSTMENT_DEBIT amount_myz must be negative'), { code: 'INVALID_MYZ_LEDGER_ENTRY' });
    const reference = input.reference && typeof input.reference === 'object' ? input.reference : {};
    const semantic = { accountId, amountMyz: formatUnits(amount), reference, entryType: 'ADJUSTMENT_DEBIT' };
    const hash = payloadHash(semantic);

    const existing = await MyzLedgerOperation.findOne({ idempotencyKey }).lean();
    if (existing) {
      if (existing.kind !== 'ADJUSTMENT_DEBIT' || existing.payloadHash !== hash) {
        throw Object.assign(new Error('Idempotency key already exists with a different ledger payload'), { code: 'MYZ_LEDGER_IDEMPOTENCY_CONFLICT' });
      }
      const entry = await MyzLedgerEntry.findOne({ entryId: existing.entryId }).lean();
      return { entry: entryDto(entry), duplicate: true, revision: 'mongo:' + existing.entryId };
    }

    const debit = -amount;
    const session = await mongoose.startSession();
    try {
      let result;
      await session.withTransaction(async () => {
        const account = await MyzLedgerAccount.findOneAndUpdate(
          { accountId, balanceUnits: { $gte: decimal128FromUnits(debit) } },
          { $inc: { balanceUnits: decimal128FromUnits(amount) } },
          { new: true, session }
        );
        if (!account) throw Object.assign(new Error('Insufficient canonical MYZ balance'), { code: 'INSUFFICIENT_MYZ_BALANCE' });

        const entry = {
          entryId: 'MYZ-LEDGER-' + crypto.randomUUID(),
          timestamp: new Date(),
          accountId,
          amountMyz: formatUnits(amount),
          entryType: 'ADJUSTMENT_DEBIT',
          reference: { ...reference, idempotency_key: idempotencyKey },
          status: 'RECORDED',
          evidence: Array.isArray(input.evidence) ? input.evidence.map(String) : [],
          reversesEntryId: null,
          note: String(input.note || 'Marketplace redemption debit after independently reconciled external settlement')
        };
        await MyzLedgerEntry.create([entry], { session });
        await MyzLedgerOperation.create([{
          idempotencyKey,
          kind: 'ADJUSTMENT_DEBIT',
          payloadHash: hash,
          entryId: entry.entryId
        }], { session });
        result = { entry: entryDto(entry), duplicate: false, revision: 'mongo:' + entry.entryId };
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
}

module.exports = new MyzLedgerMongoService();
module.exports.MyzLedgerMongoService = MyzLedgerMongoService;
