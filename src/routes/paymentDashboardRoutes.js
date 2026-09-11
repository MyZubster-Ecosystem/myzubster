'use strict';

/**
 * paymentDashboardRoutes — myzubster#306
 *
 * Exposes the six funding-flow layers as separate resources so the dashboard can
 * show them independently instead of collapsing them into a single "paid" flag.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const dashboard = require('../services/settlementDashboardService');
const { stripeFundingInputsProvider } = require('../services/paymentDashboardStripeProvider');

const router = express.Router();
const FILTER_KEYS = ['q', 'status', 'program', 'account', 'from', 'to'];

function readFilter(query = {}) {
  const filter = {};
  for (const key of FILTER_KEYS) {
    if (query[key] === undefined || query[key] === '') continue;
    filter[key] = query[key];
  }
  return filter;
}

function auth(req, res, next) {
  const header = req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(503).json({ error: 'Authentication is not configured' });
  try { req.user = jwt.verify(token, secret); return next(); }
  catch (error) { return res.status(401).json({ error: 'Invalid token' }); }
}

function admin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  return next();
}

function resolveAccountId(user) {
  if (!user) return null;
  if (typeof user.accountId === 'string' && user.accountId) return user.accountId;
  const login = user.github || user.username || user.login;
  if (typeof login === 'string' && login) return `contributor:github:${login}`;
  if (user.userId) return `contributor:${user.userId}`;
  return null;
}

function scopeItems(items, accountId) {
  if (!accountId) return items;
  return items.filter((item) => item.accountId === accountId);
}

function buildFor(req) {
  const isAdmin = req.user?.role === 'admin';
  const requestedAccount = typeof req.query.account === 'string' && req.query.account ? req.query.account : null;
  const ownAccount = resolveAccountId(req.user);
  return dashboard.buildDashboard({ filter: readFilter(req.query), accountId: isAdmin ? requestedAccount : ownAccount });
}

router.get('/summary', auth, (req, res) => {
  try {
    const payload = buildFor(req);
    if (req.user?.role !== 'admin') {
      const accountId = resolveAccountId(req.user);
      payload.layers.bounty_rewards.items = scopeItems(payload.layers.bounty_rewards.items, accountId);
      payload.layers.xmr_payouts.items = scopeItems(payload.layers.xmr_payouts.items, accountId);
    }
    return res.json(payload);
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

router.get('/meta', auth, (req, res) => {
  try {
    const payload = buildFor(req);
    return res.json({ generatedAt: payload.generatedAt, live: payload.live, policy: payload.policy, sources: payload.sources, warnings: payload.warnings, integrity: payload.integrity,
      configured: { fundingInputs: payload.layers.funding_inputs.configured, conversion: payload.layers.conversion.configured, escrow: payload.layers.escrow.configured } });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

router.get('/balances', auth, (req, res) => {
  try { return res.json(buildFor(req).balances); }
  catch (error) { return res.status(500).json({ error: error.message }); }
});

/* Live Stripe is intentionally read-only and admin-only. It performs GET requests only. */
router.get('/funding-inputs/stripe', auth, admin, async (_req, res) => {
  try { return res.json(await stripeFundingInputsProvider()); }
  catch (error) { return res.status(502).json({ configured: true, provider: 'stripe-readonly', items: [], error: error.message }); }
});

router.get('/funding-inputs', auth, admin, (req, res) => {
  try { return res.json(buildFor(req).layers.funding_inputs); }
  catch (error) { return res.status(500).json({ error: error.message }); }
});
router.get('/available-balance', auth, admin, (req, res) => {
  try { return res.json(buildFor(req).layers.available_balance); }
  catch (error) { return res.status(500).json({ error: error.message }); }
});
router.get('/conversion', auth, admin, (req, res) => {
  try { return res.json(buildFor(req).layers.conversion); }
  catch (error) { return res.status(500).json({ error: error.message }); }
});
router.get('/escrow', auth, (req, res) => {
  try { const layer = buildFor(req).layers.escrow; return res.json(layer.configured ? layer : { ...layer, items: [] }); }
  catch (error) { return res.status(500).json({ error: error.message }); }
});
router.get('/bounties', auth, (req, res) => {
  try { const layer = buildFor(req).layers.bounty_rewards; if (req.user?.role !== 'admin') layer.items = scopeItems(layer.items, resolveAccountId(req.user)); return res.json(layer); }
  catch (error) { return res.status(500).json({ error: error.message }); }
});
router.get('/payouts', auth, (req, res) => {
  try { const layer = buildFor(req).layers.xmr_payouts; if (req.user?.role !== 'admin') layer.items = scopeItems(layer.items, resolveAccountId(req.user)); return res.json(layer); }
  catch (error) { return res.status(500).json({ error: error.message }); }
});

module.exports = router;
module.exports._internal = { auth, admin, readFilter, resolveAccountId, scopeItems };
