'use strict';

const express = require('express');
const router = express.Router();
const myzLedgerApiService = require('../services/myzLedgerApiService');
const { requireMyzLedgerService } = require('../middleware/myzLedgerServiceAuth');

router.use(requireMyzLedgerService);

function statusFor(error) {
  if (error.code === 'MYZ_LEDGER_ACCOUNT_FORBIDDEN') return 403;
  if (['MYZ_LEDGER_IDEMPOTENCY_CONFLICT', 'MYZ_LEDGER_TRANSFER_CONFLICT'].includes(error.code)) return 409;
  if (['INVALID_MYZ_ACCOUNT', 'INVALID_MYZ_AMOUNT', 'INVALID_MYZ_LEDGER_ENTRY', 'INVALID_MYZ_LEDGER_LOOKUP', 'INVALID_MYZ_LEDGER_TRANSFER', 'INSUFFICIENT_MYZ_BALANCE', 'MYZ_SELF_TRANSFER_FORBIDDEN'].includes(error.code)) return 400;
  return 503;
}

router.get('/accounts/:accountId/balance', (req, res) => {
  try {
    return res.json(myzLedgerApiService.getBalance(req.params.accountId));
  } catch (error) {
    return res.status(statusFor(error)).json({ success: false, code: error.code || 'MYZ_LEDGER_READ_FAILED', error: error.message });
  }
});

router.get('/accounts/:accountId/history', (req, res) => {
  try {
    return res.json(myzLedgerApiService.getHistory({ accountId: req.params.accountId, limit: req.query.limit }));
  } catch (error) {
    return res.status(statusFor(error)).json({
      success: false,
      code: error.code || 'MYZ_LEDGER_HISTORY_FAILED',
      error: error.message
    });
  }
});

router.get('/entries/lookup', (req, res) => {
  try {
    return res.json(myzLedgerApiService.lookupEntries({
      accountId: req.query.accountId,
      entryId: req.query.entryId,
      idempotencyKey: req.query.idempotencyKey,
      redemptionId: req.query.redemptionId,
      providerTransactionId: req.query.providerTransactionId
    }));
  } catch (error) {
    return res.status(statusFor(error)).json({
      success: false,
      code: error.code || 'MYZ_LEDGER_LOOKUP_FAILED',
      error: error.message
    });
  }
});

router.post('/transfers', (req, res) => {
  try {
    const headerKey = String(req.headers['idempotency-key'] || '').trim();
    const body = { ...(req.body || {}) };
    if (headerKey) body.idempotency_key = headerKey;
    const result = myzLedgerApiService.transfer(body);
    return res.status(result.duplicate ? 200 : 201).json({
      schema: 'myzubster-myz-ledger-transfer/v1',
      asset: 'MYZ',
      asset_type: 'internal-reward-accounting-unit',
      on_chain: false,
      transfer_id: result.transferId,
      duplicate: result.duplicate,
      debit_entry: result.debitEntry,
      credit_entry: result.creditEntry,
      from_balance_myz: result.fromBalanceMyz,
      to_balance_myz: result.toBalanceMyz,
      revision: result.revision
    });
  } catch (error) {
    return res.status(statusFor(error)).json({
      success: false,
      code: error.code || 'MYZ_LEDGER_TRANSFER_FAILED',
      error: error.message
    });
  }
});

router.post('/entries', (req, res) => {
  try {
    const headerKey = String(req.headers['idempotency-key'] || '').trim();
    const body = { ...(req.body || {}) };
    if (headerKey) body.idempotency_key = headerKey;
    const result = myzLedgerApiService.appendDebit(body);
    return res.status(result.duplicate ? 200 : 201).json({
      schema: 'myzubster-myz-ledger-entry/v1',
      asset: 'MYZ',
      ...result.entry,
      duplicate: result.duplicate,
      revision: result.revision
    });
  } catch (error) {
    return res.status(statusFor(error)).json({
      success: false,
      code: error.code || 'MYZ_LEDGER_APPEND_FAILED',
      error: error.message
    });
  }
});

module.exports = router;
