'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');
const myzLedgerApiService = require('../services/myzLedgerApiService');
const { myzAccountForUser } = require('../services/marketplaceMyzPaymentService');

const router = express.Router();

function fail(res, error, fallback) {
  const code = error?.code || fallback;
  const status = code === 'MYZ_LEDGER_ACCOUNT_FORBIDDEN' ? 403 : code === 'INVALID_MYZ_ACCOUNT' ? 400 : 503;
  return res.status(status).json({ success:false, code, error:error?.message || 'MYZ ledger unavailable' });
}

router.get('/balance', authenticate, (req, res) => {
  try {
    const result = myzLedgerApiService.getBalance(myzAccountForUser(req.userId));
    res.set('Cache-Control', 'no-store');
    return res.json({
      success:true,
      asset:'MYZ',
      assetType:'internal-reward-accounting-unit',
      onChain:false,
      redeemable:false,
      balanceMyz:result.balanceMyz,
      revision:result.revision
    });
  } catch (error) {
    return fail(res, error, 'MYZ_BALANCE_UNAVAILABLE');
  }
});

router.get('/history', authenticate, (req, res) => {
  try {
    const result = myzLedgerApiService.getHistory({
      accountId:myzAccountForUser(req.userId),
      limit:req.query.limit
    });
    res.set('Cache-Control', 'no-store');
    return res.json({ success:true, ...result, redeemable:false });
  } catch (error) {
    return fail(res, error, 'MYZ_HISTORY_UNAVAILABLE');
  }
});

module.exports = router;
