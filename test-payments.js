/**
 * Test del sistema di pagamenti
 */

const AgentCoreService = require('./src/services/aws/agentCore');
const BosonEscrowService = require('./src/services/boson/escrow');

async function testPayments() {
  console.log('🧪 TEST SISTEMA PAGAMENTI\n');
  
  // 1. Crea un wallet robot
  console.log('1. Creazione wallet robot...');
  const wallet = await AgentCoreService.createRobotWallet('robot-001', '0xOwnerAddress');
  console.log('   ✅ Wallet creato:', wallet.walletAddress);
  console.log('   💰 Saldo:', await AgentCoreService.getBalance(wallet.walletAddress), 'USDC\n');
  
  // 2. Crea un intento di pagamento
  console.log('2. Creazione intento di pagamento...');
  const payment = await AgentCoreService.createPaymentIntent(
    '0xClientWallet',
    wallet.walletAddress,
    20, // 20 USDC
    'job-001'
  );
  console.log('   💳 Payment ID:', payment.id);
  console.log('   💰 Importo:', payment.amount, 'USDC');
  console.log('   💸 Fee MyZ (2%):', payment.fee, 'USDC');
  console.log('   🤖 Al robot:', payment.robotAmount, 'USDC\n');
  
  // 3. Crea un escrow
  console.log('3. Creazione escrow...');
  const escrow = await BosonEscrowService.createEscrow({
    jobId: 'job-001',
    buyer: '0xClientWallet',
    seller: wallet.walletAddress,
    amount: 20,
    terms: 'Completamento lavoro entro 24h'
  });
  console.log('   🔒 Escrow ID:', escrow.id);
  console.log('   📊 Stato:', escrow.status, '\n');
  
  // 4. Rilascia fondi
  console.log('4. Rilascio fondi...');
  const released = await BosonEscrowService.releaseFunds(escrow.id, 'approved');
  console.log('   ✅ Fondi rilasciati!');
  console.log('   📊 Nuovo stato:', released.status, '\n');
  
  console.log('🎉 TEST COMPLETATO CON SUCCESSO!');
}

testPayments().catch(console.error);
