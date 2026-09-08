'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { createStripeCheckout, stripeConfigured } = require('../services/zorgaxStripeService');

const router = express.Router();

router.get('/status', (_req, res) => {
  res.json({ ok:true, provider:'stripe', configured:stripeConfigured(), plans:['pro','developer'] });
});

router.post('/checkout', authenticate, async (req, res) => {
  try {
    const checkout = await createStripeCheckout({ ownerId:req.userId, planId:req.body?.plan });
    res.status(201).json({ ok:true, provider:'stripe', ...checkout });
  } catch (error) {
    const status = /non configurat/i.test(error.message) ? 503 : 400;
    res.status(status).json({ ok:false, error:error.message || 'Checkout Stripe Zorgax non disponibile' });
  }
});

module.exports = router;
