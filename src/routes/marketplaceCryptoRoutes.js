'use strict';

const express = require('express');
const SellerMembership = require('../models/SellerMembership');
const { authenticate } = require('../middleware/auth');
const {
  normalizeAcceptedCurrencies,
  validateSettlementCurrency,
  publicCryptoCapabilities
} = require('../services/marketplaceCryptoPolicy');

const router = express.Router();

router.get('/capabilities', (_req, res) => {
  res.json({ success:true, crypto:publicCryptoCapabilities(null) });
});

router.get('/seller/preferences', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId }).lean();
    if (!membership) return res.status(404).json({ success:false, message:'Account Seller non trovato' });
    res.json({ success:true, crypto:publicCryptoCapabilities(membership) });
  } catch (_error) {
    res.status(500).json({ success:false, message:'Preferenze crypto non disponibili' });
  }
});

router.patch('/seller/preferences', authenticate, async (req, res) => {
  try {
    const existing = await SellerMembership.findOne({ userId:req.userId }).lean();
    if (!existing) return res.status(404).json({ success:false, message:'Account Seller non trovato' });

    const acceptedCryptoCurrencies = normalizeAcceptedCurrencies(req.body?.acceptedCryptoCurrencies);
    const preferredSettlementCurrency = validateSettlementCurrency(req.body?.preferredSettlementCurrency, acceptedCryptoCurrencies);

    // Phase 1 deliberately stores preferences only. No exchange/custody is performed.
    const membership = await SellerMembership.findOneAndUpdate(
      { userId:req.userId },
      { $set:{ acceptedCryptoCurrencies, preferredSettlementCurrency, cryptoConversionEnabled:false } },
      { new:true, runValidators:true }
    ).lean();

    res.json({
      success:true,
      membership,
      crypto:publicCryptoCapabilities(membership),
      message:'Preferenze salvate. XMR, BTC ed ETH possono essere selezionati; conversione automatica resta disattivata in Phase 1.'
    });
  } catch (error) {
    res.status(400).json({ success:false, code:error.code || 'INVALID_CRYPTO_PREFERENCES', message:error.message || 'Preferenze crypto non valide' });
  }
});

module.exports = router;
