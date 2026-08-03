/**
 * Payment Routes - v1 (Completa)
 * Gestisce le richieste di pagamento
 */

const express = require('express');
const router = express.Router();
const PaymentFlowService = require('../../services/paymentFlow');

/**
 * POST /api/v1/payments/process
 * Processa un pagamento completo
 */
router.post('/process', async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Verifica parametri obbligatori
    const required = ['robotId', 'ownerAddress', 'clientWallet', 'amount', 'jobId'];
    for (const field of required) {
      if (!paymentData[field]) {
        return res.status(400).json({
          success: false,
          error: `Campo mancante: ${field}`
        });
      }
    }
    
    const result = await PaymentFlowService.executeFullPaymentFlow(paymentData);
    
    res.json({
      success: true,
      message: 'Pagamento processato con successo!',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/v1/payments/robot/:robotId/reputation
 * Ottieni reputazione di un robot
 */
router.get('/robot/:robotId/reputation', async (req, res) => {
  try {
    const reputation = await ReputationService.getReputation(req.params.robotId);
    res.json({ success: true, data: reputation });
  } catch (error) {
    console.error('❌ Errore:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
