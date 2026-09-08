'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { createStripeCheckout, handleStripeWebhook, stripeConfigured } = require('../services/zorgaxStripeService');

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

router.post('/webhook', async (req, res) => {
  try {
    const result = await handleStripeWebhook(req.body, req.headers['stripe-signature']);
    res.json(result);
  } catch (error) {
    const status = /Firma webhook|Payload webhook/i.test(error.message) ? 400 : 500;
    res.status(status).json({ ok:false, error:error.message || 'Webhook Stripe Zorgax non elaborato' });
  }
});

module.exports = router;
