'use strict';

const mongoose = require('mongoose');

const decimalField = {
  type: mongoose.Schema.Types.Decimal128,
  required: true
};

const accountSchema = new mongoose.Schema({
  accountId: { type: String, required: true, unique: true, index: true, trim: true },
  balanceUnits: { ...decimalField, default: () => mongoose.Types.Decimal128.fromString('0') }
}, { timestamps: true, versionKey: false, collection: 'myz_ledger_accounts' });

const entrySchema = new mongoose.Schema({
  entryId: { type: String, required: true, unique: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  accountId: { type: String, required: true, index: true },
  amountMyz: { type: String, required: true },
  entryType: { type: String, required: true, index: true },
  transferId: { type: String, default: null, index: true },
  reference: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, required: true, default: 'RECORDED', index: true },
  evidence: { type: [String], default: [] },
  reversesEntryId: { type: String, default: null, index: true },
  note: { type: String, default: '' }
}, { timestamps: false, versionKey: false, collection: 'myz_ledger_entries' });

entrySchema.index({ accountId: 1, timestamp: -1 });
entrySchema.index({ 'reference.idempotency_key': 1 }, { sparse: true });
entrySchema.index({ 'reference.redemption_id': 1 }, { sparse: true });
entrySchema.index({ 'reference.provider_transaction_id': 1 }, { sparse: true });

const operationSchema = new mongoose.Schema({
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  kind: { type: String, required: true, enum: ['TRANSFER', 'ADJUSTMENT_DEBIT'] },
  payloadHash: { type: String, required: true },
  transferId: { type: String, default: null },
  debitEntryId: { type: String, default: null },
  creditEntryId: { type: String, default: null },
  entryId: { type: String, default: null }
}, { timestamps: true, versionKey: false, collection: 'myz_ledger_operations' });

const transferSchema = new mongoose.Schema({
  transferId: { type: String, required: true, unique: true, index: true },
  idempotencyKey: { type: String, required: true, unique: true, index: true },
  fromAccountId: { type: String, required: true, index: true },
  toAccountId: { type: String, required: true, index: true },
  amountMyz: { type: String, required: true },
  debitEntryId: { type: String, required: true, unique: true },
  creditEntryId: { type: String, required: true, unique: true },
  reference: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, versionKey: false, collection: 'myz_ledger_transfers' });

const MyzLedgerAccount = mongoose.models.MyzLedgerAccount || mongoose.model('MyzLedgerAccount', accountSchema);
const MyzLedgerEntry = mongoose.models.MyzLedgerEntry || mongoose.model('MyzLedgerEntry', entrySchema);
const MyzLedgerOperation = mongoose.models.MyzLedgerOperation || mongoose.model('MyzLedgerOperation', operationSchema);
const MyzLedgerTransfer = mongoose.models.MyzLedgerTransfer || mongoose.model('MyzLedgerTransfer', transferSchema);

module.exports = {
  MyzLedgerAccount,
  MyzLedgerEntry,
  MyzLedgerOperation,
  MyzLedgerTransfer
};
