'use strict';

const express = require('express');
const router = express.Router();
const myzLedgerApiService = require('../services/myzLedgerApiService');
const { requireMyzLedgerService } = require('../middleware/myzLedgerServiceAuth');

router.use(requireMyzLedgerService);

router.get('/accounts/:accountId/balance', (req, res) => {
  try {
    return res.json(myzLedgerApiService.getBalance(req.params.accountId));
  } catch (error) {
    const status = error.code === 'INVALID_MYZ_ACCOUNT' ? 400 : 503;
    return res.status(status).json({ success: false, code: error.code || 'MYZ_LEDGER_READ_FAILED', error: error.message });
  }
});

router.post('/entries', (req, res) => {
  try {
    const result = myzLedgerApiService.appendDebit(req.body || {});
    return res.status(result.duplicate ? 200 : 201).json({
      schema: 'myzubster-myz-ledger-entry/v1',
      asset: 'MYZ',
      ...result.entry,
      duplicate: result.duplicate,
      revision: result.revision
    });
  } catch (error) {
    const clientCodes = ['INVALID_MYZ_AMOUNT', 'INVALID_MYZ_LEDGER_ENTRY', 'INSUFFICIENT_MYZ_BALANCE'];
    return res.status(clientCodes.includes(error.code) ? 400 : 503).json({
      success: false,
      code: error.code || 'MYZ_LEDGER_APPEND_FAILED',
      error: error.message
    });
  }
});

module.exports = router;
