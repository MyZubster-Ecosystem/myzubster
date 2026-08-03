/**
 * Payment Routes - v1
 * Gestisce le richieste di pagamento
 */

const express = require('express');
const router = express.Router();
const AgentCoreService = require('../../services/aws/agentCore');
const BosonEscrowService = require('../../services/boson/escrow');

/**
 * POST /api/v1/payments/create-payment
 * Crea un intento di pagamento
 */
router.post('/create-payment', async (req, res) => {
  try {
    const { fromWallet, toWallet, amount, jobId } = req.body;
    
    if (!fromWallet || !toWallet || !amount) {
      return res.status(400).json({ 
        error: 'Parametri mancanti: fromWallet, toWallet, amount' 
      });
    }
    
    const paymentIntent = await AgentCoreService.createPaymentIntent(
      fromWallet, toWallet, amount, jobId
    );
    
    res.json({ success: true, data: paymentIntent });
  } catch (error) {
    console.error('❌ Errore:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/payments/create-escrow
 * Crea un escrow per un lavoro
 */
router.post('/create-escrow', async (req, res) => {
  try {
    const { jobId, buyer, seller, amount, terms } = req.body;
    
    if (!jobId || !buyer || !seller || !amount) {
      return res.status(400).json({ 
        error: 'Parametri mancanti: jobId, buyer, seller, amount' 
      });
    }
    
    const escrow = await BosonEscrowService.createEscrow({
      jobId, buyer, seller, amount, terms
    });
    
    res.json({ success: true, data: escrow });
  } catch (error) {
    console.error('❌ Errore:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/payments/release-funds
 * Rilascia i fondi dall'escrow
 */
router.post('/release-funds', async (req, res) => {
  try {
    const { escrowId, signature } = req.body;
    
    if (!escrowId || !signature) {
      return res.status(400).json({ 
        error: 'Parametri mancanti: escrowId, signature' 
      });
    }
    
    const result = await BosonEscrowService.releaseFunds(escrowId, signature);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ Errore:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/payments/escrow/:id
 * Ottieni lo stato di un escrow
 */
router.get('/escrow/:id', async (req, res) => {
  try {
    const escrow = await BosonEscrowService.getEscrowStatus(req.params.id);
    res.json({ success: true, data: escrow });
  } catch (error) {
    console.error('❌ Errore:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
