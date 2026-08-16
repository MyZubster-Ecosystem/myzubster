const express = require('express');
const payments = require('../services/payment');

const router = express.Router();
const VALID_CURRENCIES = ['MYZ', 'XMR'];

// POST /api/bounty-payments - create a payment record
router.post('/', async (req, res) => {
  const { issueId, contributor, amount, currency, kind, address } = req.body || {};
  if (!issueId || !contributor || amount == null || !currency) {
    return res.status(400).json({ success: false, error: 'issueId, contributor, amount, currency are required' });
  }
  if (VALID_CURRENCIES.indexOf(currency) === -1) {
    return res.status(400).json({ success: false, error: 'currency must be MYZ or XMR' });
  }
  try {
    const payment = await payments.createPayment({ issueId, contributor, amount, currency, kind, address });
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unable to create payment' });
  }
});

// GET /api/bounty-payments - list payments
router.get('/', async (_req, res) => {
  try {
    const list = await payments.listPayments();
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unable to list payments' });
  }
});

// GET /api/bounty-payments/myz/metadata - MYZ payment rail documentation
router.get('/myz/metadata', (_req, res) => {
  res.json({ success: true, data: payments.MYZ_METADATA });
});

// GET /api/bounty-payments/:id - read one payment + its verification state
router.get('/:id', async (req, res) => {
  try {
    const payment = await payments.getPayment(req.params.id);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unable to read payment' });
  }
});

// POST /api/bounty-payments/:id/submit - PENDING -> SUBMITTED
router.post('/:id/submit', async (req, res) => {
  try {
    const payment = await payments.submitPayment(req.params.id, req.body && req.body.txid);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/bounty-payments/:id/confirm - SUBMITTED -> CONFIRMED (requires real txid)
router.post('/:id/confirm', async (req, res) => {
  try {
    const payment = await payments.confirmPayment(req.params.id, req.body && req.body.txid);
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
