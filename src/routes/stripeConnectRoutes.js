const express = require('express');
const SellerMembership = require('../models/SellerMembership');
const { authenticate } = require('../middleware/auth');
const { isFreeSellerActive } = require('../services/freeSellerPolicy');
const { createConnectAccount, retrieveConnectAccount, createAccountLink, connectState } = require('../services/stripeConnectService');

const router = express.Router();

function sellerActive(membership) {
  return Boolean(membership && (isFreeSellerActive(membership) || (membership.plan === 'SELLER_MONTHLY' && membership.status === 'ACTIVE')));
}

async function syncAccount(membership, account) {
  const state = connectState(account);
  membership.stripeConnectAccountId = account.id;
  membership.stripeConnectDetailsSubmitted = state.stripeConnectDetailsSubmitted;
  membership.stripeConnectChargesEnabled = state.stripeConnectChargesEnabled;
  membership.stripeConnectPayoutsEnabled = state.stripeConnectPayoutsEnabled;
  if (state.stripeConnectDetailsSubmitted && !membership.stripeConnectOnboardedAt) membership.stripeConnectOnboardedAt = new Date();
  if (state.stripeConnectChargesEnabled || state.stripeConnectPayoutsEnabled) membership.paymentProvider = 'STRIPE';
  await membership.save();
  return state;
}

router.post('/connect/onboarding', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId });
    if (!sellerActive(membership)) return res.status(403).json({ success:false, message:'Attiva prima il profilo Seller gratuito' });
    let account;
    if (membership.stripeConnectAccountId) account = await retrieveConnectAccount(membership.stripeConnectAccountId);
    else {
      account = await createConnectAccount(req.userId);
      membership.stripeConnectAccountId = account.id;
      await membership.save();
    }
    const state = await syncAccount(membership, account);
    const link = await createAccountLink(account.id);
    res.status(201).json({ success:true, testMode:true, accountId:account.id, onboardingUrl:link.url, expiresAt:link.expires_at, state });
  } catch (error) {
    const status = error.code === 'STRIPE_CONNECT_TEST_MODE_REQUIRED' ? 409 : 400;
    res.status(status).json({ success:false, code:error.code || 'STRIPE_CONNECT_ONBOARDING_FAILED', message:error.message || 'Onboarding Stripe Connect non disponibile' });
  }
});

router.get('/connect/status', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId });
    if (!sellerActive(membership)) return res.status(403).json({ success:false, message:'Attiva prima il profilo Seller gratuito' });
    if (!membership.stripeConnectAccountId) return res.json({ success:true, testMode:true, connected:false, ready:false });
    const account = await retrieveConnectAccount(membership.stripeConnectAccountId);
    const state = await syncAccount(membership, account);
    res.json({ success:true, testMode:true, connected:true, accountId:account.id, ready:state.stripeConnectChargesEnabled && state.stripeConnectPayoutsEnabled, state });
  } catch (error) {
    const status = error.code === 'STRIPE_CONNECT_TEST_MODE_REQUIRED' ? 409 : 400;
    res.status(status).json({ success:false, code:error.code || 'STRIPE_CONNECT_STATUS_FAILED', message:error.message || 'Stato Stripe Connect non disponibile' });
  }
});

module.exports = router;
