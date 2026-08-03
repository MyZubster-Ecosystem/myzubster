/**
 * Payment Flow Service
 * Orchestra il flusso completo di pagamento
 */

const AgentCoreService = require('./aws/agentCore');
const BosonEscrowService = require('./boson/escrow');
const FeeService = require('./fee/feeService');
const ReputationService = require('./erc8004/reputation');

class PaymentFlowService {
  async executeFullPaymentFlow(paymentData) {
    try {
      console.log('🚀 Avvio flusso di pagamento...');
      
      // 1. Crea wallet robot
      console.log('📝 Creazione wallet robot...');
      const wallet = await AgentCoreService.createRobotWallet(
        paymentData.robotId,
        paymentData.ownerAddress
      );
      
      // 2. Crea payment intent
      console.log('📝 Creazione payment intent...');
      const paymentIntent = await AgentCoreService.createPaymentIntent(
        paymentData.clientWallet,
        wallet.walletAddress,
        paymentData.amount,
        paymentData.jobId
      );
      
      // 3. Applica fee MyZ
      console.log('📝 Applicazione fee MyZ...');
      const paymentWithFee = FeeService.applyFee(paymentIntent);
      
      // 4. Crea escrow
      console.log('📝 Creazione escrow...');
      const escrow = await BosonEscrowService.createEscrow({
        jobId: paymentData.jobId,
        buyer: paymentData.clientWallet,
        seller: wallet.walletAddress,
        amount: paymentData.amount,
        terms: paymentData.terms || 'Standard terms apply'
      });
      
      // 5. Rilascia fondi
      console.log('📝 Rilascio fondi...');
      const releaseResult = await BosonEscrowService.releaseFunds(
        escrow.id,
        'approved'
      );
      
      // 6. Crea NFT reputazione
      console.log('📝 Creazione NFT reputazione...');
      const reputationNFT = await ReputationService.mintSoulboundNFT(
        paymentData.robotId,
        wallet.walletAddress,
        {
          punctuality: paymentData.scores?.punctuality || 90,
          quality: paymentData.scores?.quality || 85,
          reliability: paymentData.scores?.reliability || 95
        }
      );
      
      // 7. Crea recensione
      console.log('📝 Aggiunta recensione...');
      const review = await ReputationService.addReview(
        paymentData.robotId,
        {
          reviewer: paymentData.clientWallet,
          rating: paymentData.rating || 5,
          comment: paymentData.comment || 'Great work!',
          punctuality: paymentData.scores?.punctuality || 90,
          quality: paymentData.scores?.quality || 85,
          reliability: paymentData.scores?.reliability || 95
        }
      );
      
      console.log('✅ Flusso di pagamento completato!');
      
      return {
        success: true,
        wallet,
        paymentIntent: paymentWithFee,
        escrow,
        release: releaseResult,
        reputation: reputationNFT,
        review
      };
      
    } catch (error) {
      console.error('❌ Errore flusso di pagamento:', error.message);
      throw error;
    }
  }
}

module.exports = new PaymentFlowService();
