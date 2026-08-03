/**
 * Test completo del sistema di pagamenti
 */

const PaymentFlowService = require('./src/services/paymentFlow');

async function testFullPayment() {
  console.log('🧪 TEST COMPLETO SISTEMA PAGAMENTI\n');
  console.log('=' .repeat(50));
  
  const paymentData = {
    robotId: 'robot-001',
    ownerAddress: '0xOwnerAddress',
    clientWallet: '0xClientWallet',
    amount: 20.00,
    jobId: 'job-001',
    terms: 'Completamento lavoro entro 24h',
    scores: {
      punctuality: 95,
      quality: 90,
      reliability: 95
    },
    rating: 5,
    comment: 'Robot eccellente! Lavoro perfetto!'
  };
  
  console.log('📋 Dati pagamento:');
  console.log(`   Robot ID: ${paymentData.robotId}`);
  console.log(`   Importo: ${paymentData.amount} USDC`);
  console.log(`   Lavoro: ${paymentData.jobId}`);
  console.log('');
  
  try {
    const result = await PaymentFlowService.executeFullPaymentFlow(paymentData);
    
    console.log('✅ RISULTATO COMPLETO:');
    console.log('=' .repeat(50));
    console.log(`✅ Wallet robot: ${result.wallet.walletAddress}`);
    console.log(`✅ Payment Intent: ${result.paymentIntent.id}`);
    console.log(`   💰 Importo: ${result.paymentIntent.amount} USDC`);
    console.log(`   💸 Fee MyZ: ${result.paymentIntent.fee} USDC`);
    console.log(`   🤖 Netto robot: ${result.paymentIntent.netAmount} USDC`);
    console.log(`✅ Escrow: ${result.escrow.id}`);
    console.log(`   📊 Stato: ${result.escrow.status}`);
    console.log(`✅ Reputazione NFT: ${result.reputation.id}`);
    console.log(`   ⭐ Score: ${result.reputation.scores.overall}/100`);
    console.log(`✅ Recensione: ${result.review.id}`);
    console.log(`   ⭐ Rating: ${result.review.rating}/5`);
    
    console.log('\n🎉 TEST COMPLETATO CON SUCCESSO!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error.message);
  }
}

testFullPayment().catch(console.error);
