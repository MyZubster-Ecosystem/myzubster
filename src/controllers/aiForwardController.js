const AIContract = require('../models/AIContract');
const githubController = require('./githubWebhookController');
const users = githubController.users || {};

const DISCOUNT_RATES = {
  1: 0.10,
  2: 0.15,
  3: 0.20,
  6: 0.30
};

const BASE_PRICE_MYZ = 10;

module.exports = {
  getQuote: (req, res) => {
    const { model, tokens, deliveryMonths } = req.body;
    if (!model || !tokens || !deliveryMonths) {
      return res.status(400).json({ error: 'Mancano parametri' });
    }
    const discount = DISCOUNT_RATES[deliveryMonths] || 0;
    const pricePerM = BASE_PRICE_MYZ * (1 - discount);
    const totalPrice = pricePerM * (tokens / 1_000_000);
    res.json({
      model,
      tokens,
      deliveryMonths,
      discount: discount * 100,
      pricePerM,
      totalPrice: Math.round(totalPrice * 100) / 100,
      currency: 'MYZ'
    });
  },

  purchaseContract: async (req, res) => {
    try {
      const { userId, model, tokens, deliveryMonths, paymentMethod } = req.body;
      if (!userId || !model || !tokens || !deliveryMonths) {
        return res.status(400).json({ error: 'Dati mancanti' });
      }

      const user = users[userId];
      if (!user) return res.status(404).json({ error: 'Utente non trovato' });

      const discount = DISCOUNT_RATES[deliveryMonths] || 0;
      const pricePerM = BASE_PRICE_MYZ * (1 - discount);
      const totalPrice = Math.round((pricePerM * (tokens / 1_000_000)) * 100) / 100;

      if (paymentMethod === 'MYZ') {
        if (user.myzBalance < totalPrice) {
          return res.status(400).json({ error: 'MYZ insufficienti' });
        }
        user.myzBalance -= totalPrice;
      } else {
        return res.status(501).json({ error: 'Pagamento XMR non ancora implementato' });
      }

      const deliveryDate = new Date();
      deliveryDate.setMonth(deliveryDate.getMonth() + deliveryMonths);
      deliveryDate.setDate(1);

      const contract = new AIContract({
        userId,
        model,
        tokens,
        priceMYZ: totalPrice,
        deliveryMonth: deliveryDate,
        discount: discount * 100,
        expiresAt: new Date(deliveryDate.getFullYear(), deliveryDate.getMonth() + 1, 0)
      });
      await contract.save();

      res.status(201).json({
        success: true,
        contract: {
          id: contract._id,
          model,
          tokens,
          priceMYZ: totalPrice,
          discount: discount * 100,
          deliveryMonth: deliveryDate,
          expiresAt: contract.expiresAt
        },
        newBalance: user.myzBalance
      });
    } catch (error) {
      console.error('❌ Errore acquisto contratto:', error);
      res.status(500).json({ error: 'Errore interno', details: error.message });
    }
  },

  getUserContracts: async (req, res) => {
    try {
      const { userId } = req.params;
      const contracts = await AIContract.find({ userId }).sort({ deliveryMonth: 1 });
      res.json({ success: true, contracts });
    } catch (error) {
      console.error('❌ Errore lista contratti:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  },

  consumeTokens: async (req, res) => {
    try {
      const { userId, model, tokensUsed } = req.body;
      if (!userId || !model || !tokensUsed) {
        return res.status(400).json({ error: 'userId, model e tokensUsed sono obbligatori' });
      }

      const contract = await AIContract.findOne({
        userId,
        model,
        status: 'active',
        expiresAt: { $gte: new Date() }
      }).sort({ deliveryMonth: 1 });

      if (!contract) {
        return res.status(404).json({ error: 'Nessun contratto attivo disponibile' });
      }

      const remaining = contract.tokens - contract.consumedTokens;
      if (remaining < tokensUsed) {
        return res.status(400).json({ error: `Token insufficienti. Rimasti: ${remaining}` });
      }

      contract.consumedTokens += tokensUsed;
      if (contract.consumedTokens >= contract.tokens) {
        contract.status = 'consumed';
      }
      await contract.save();

      res.json({
        success: true,
        contractId: contract._id,
        remaining: contract.tokens - contract.consumedTokens,
        totalConsumed: contract.consumedTokens
      });
    } catch (error) {
      console.error('❌ Errore consumo token:', error);
      res.status(500).json({ error: 'Errore interno', details: error.message });
    }
  },

  listForResale: async (req, res) => {
    try {
      const { contractId, resalePrice } = req.body;
      if (!contractId) return res.status(400).json({ error: 'contractId obbligatorio' });

      const contract = await AIContract.findById(contractId);
      if (!contract) return res.status(404).json({ error: 'Contratto non trovato' });
      if (contract.status !== 'active') return res.status(400).json({ error: 'Contratto non attivo' });

      contract.status = 'listed_for_sale';
      contract.resalePrice = resalePrice || contract.priceMYZ * 1.1;
      await contract.save();

      res.json({ success: true, contract });
    } catch (error) {
      console.error('❌ Errore rivendita:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  },

  // Nuovo: Ottieni il saldo token rimanente per un utente/modello
  getBalance: async (req, res) => {
    try {
      const { userId, model } = req.params;
      if (!userId || !model) {
        return res.status(400).json({ error: 'userId e model sono obbligatori' });
      }

      const contracts = await AIContract.find({
        userId,
        model,
        status: 'active',
        expiresAt: { $gte: new Date() }
      });

      let totalRemaining = 0;
      for (const c of contracts) {
        totalRemaining += (c.tokens - c.consumedTokens);
      }

      res.json({
        success: true,
        userId,
        model,
        totalRemaining,
        contracts: contracts.map(c => ({
          id: c._id,
          remaining: c.tokens - c.consumedTokens,
          expiresAt: c.expiresAt
        }))
      });
    } catch (error) {
      console.error('❌ Errore saldo token:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  }
};
