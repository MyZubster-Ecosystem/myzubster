'use strict';

const { xmrToAtomicString } = require('./moneroAmount');

function negative(request, reason, provider = 'monero-wallet-rpc/check_tx_proof') {
  return {
    valid: false,
    txId: request.txId,
    recipient: request.recipient,
    asset: request.asset,
    network: request.network,
    amount: request.amount,
    transactionStatus: 'unknown',
    checks: { recipient: false, asset: false, network: false, amount: false, transactionStatus: false },
    reason,
    provider,
  };
}

function createMoneroTxProofVerifier({ verifierRpc, submissionStore, minConfirmations = 1 } = {}) {
  if (!verifierRpc || typeof verifierRpc.checkTxProof !== 'function') throw new Error('Monero verifier RPC client is invalid');
  if (!submissionStore || typeof submissionStore.getByTxId !== 'function') throw new Error('Monero proof store is invalid');
  if (!Number.isInteger(minConfirmations) || minConfirmations < 0) throw new Error('minConfirmations must be a non-negative integer');

  return {
    async verify(request) {
      if (!request?.txId || !request.recipient) return negative(request || {}, 'txId and recipient are required');
      if (request.asset !== 'XMR' || request.network !== 'stagenet') return negative(request, 'verifier only accepts XMR stagenet');

      let expectedAtomic;
      try {
        expectedAtomic = xmrToAtomicString(request.amount);
      } catch (error) {
        return negative(request, error.message);
      }

      const evidence = await submissionStore.getByTxId(request.txId);
      if (!evidence?.proofSignature || !evidence?.proofMessage) {
        return negative(request, 'transaction proof is not available yet');
      }
      if (evidence.recipient !== request.recipient || evidence.amountAtomic !== expectedAtomic || evidence.network !== 'stagenet') {
        return negative(request, 'durable proof evidence does not match the requested payment');
      }

      let checked;
      try {
        checked = await verifierRpc.checkTxProof({
          txId: request.txId,
          address: request.recipient,
          message: evidence.proofMessage,
          signature: evidence.proofSignature,
        });
      } catch (error) {
        return negative(request, `independent Monero proof check failed: ${error.message}`);
      }

      const good = checked?.good === true;
      const amountMatch = String(checked?.received ?? '') === expectedAtomic;
      const confirmations = Number(checked?.confirmations || 0);
      const statusConfirmed = good && amountMatch && checked?.in_pool !== true && confirmations >= minConfirmations;

      return {
        valid: statusConfirmed,
        txId: request.txId,
        recipient: request.recipient,
        asset: request.asset,
        network: request.network,
        amount: request.amount,
        transactionStatus: statusConfirmed ? 'confirmed' : (good ? 'pending' : 'unknown'),
        confirmations,
        checks: {
          recipient: good,
          asset: true,
          network: true,
          amount: amountMatch,
          transactionStatus: statusConfirmed,
        },
        reason: statusConfirmed ? null : 'Monero transaction proof is not confirmed at the required depth',
        provider: 'monero-wallet-rpc/check_tx_proof',
      };
    },
  };
}

module.exports = { createMoneroTxProofVerifier, negative };
