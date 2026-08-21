'use strict';

const { xmrToAtomicString } = require('./moneroAmount');

function assertStagenetRequest({ asset, network, recipient, amount }) {
  if (asset !== 'XMR') throw new Error('Monero stagenet adapter only supports XMR');
  if (network !== 'stagenet') throw new Error('Monero stagenet adapter refuses non-stagenet networks');
  if (!recipient || typeof recipient !== 'string') throw new Error('Monero recipient is required');
  return xmrToAtomicString(amount);
}

function visibleTransfer(result, txId) {
  const rows = [];
  if (result?.transfer) rows.push(result.transfer);
  if (Array.isArray(result?.transfers)) rows.push(...result.transfers);
  return rows.some(row => row?.txid === txId && ['out', 'pending', 'pool'].includes(row?.type));
}

function createMoneroStagenetAdapter({ walletRpc, submissionStore, allowRelay = false } = {}) {
  if (!walletRpc || typeof walletRpc.transfer !== 'function' || typeof walletRpc.relayTx !== 'function') {
    throw new Error('Monero wallet RPC client is invalid');
  }
  if (!submissionStore || typeof submissionStore.prepare !== 'function' || typeof submissionStore.getByIdempotencyKey !== 'function') {
    throw new Error('Monero submission store is invalid');
  }

  async function ensureProof(submission) {
    if (submission.proofSignature) return submission;
    if (typeof walletRpc.getTxProof !== 'function') return submission;
    const message = `myzubster-p0:${submission.idempotencyKey}`;
    try {
      const proof = await walletRpc.getTxProof({ txId: submission.txId, address: submission.recipient, message });
      if (proof?.signature && typeof submissionStore.saveProof === 'function') {
        return submissionStore.saveProof({ txId: submission.txId, message, signature: proof.signature });
      }
    } catch (_) {
      // Proof creation is recoverable later. The already-known txId remains the durable identity.
    }
    return submission;
  }

  async function relayPrepared(submission) {
    if (!submission.txMetadata) {
      const error = new Error('prepared Monero submission is missing relay metadata');
      error.ambiguousSubmission = true;
      throw error;
    }

    try {
      const relayed = await walletRpc.relayTx(submission.txMetadata);
      if (relayed?.tx_hash && relayed.tx_hash !== submission.txId) {
        throw new Error('Monero relay returned a different transaction hash');
      }
      const marked = await submissionStore.markRelayed({ idempotencyKey: submission.idempotencyKey, txId: submission.txId });
      return ensureProof(marked);
    } catch (relayError) {
      try {
        const lookup = await walletRpc.getTransferByTxId(submission.txId);
        if (visibleTransfer(lookup, submission.txId)) {
          const marked = await submissionStore.markRelayed({ idempotencyKey: submission.idempotencyKey, txId: submission.txId });
          return ensureProof(marked);
        }
      } catch (_) {
        // Keep the durable PREPARED record so recovery can retry the exact same tx metadata.
      }
      const error = new Error(`Monero relay outcome is ambiguous: ${relayError.message}`);
      error.ambiguousSubmission = true;
      throw error;
    }
  }

  return {
    async submit(request) {
      const amountAtomic = assertStagenetRequest(request);
      if (!request.attemptId || !request.idempotencyKey) throw new Error('attemptId and idempotencyKey are required');

      const existing = await submissionStore.getByIdempotencyKey(request.idempotencyKey);
      if (existing) {
        if (existing.attemptId !== request.attemptId || existing.recipient !== request.recipient || existing.amountAtomic !== amountAtomic) {
          throw new Error('Monero idempotency key conflicts with the requested payment');
        }
        if (existing.state === 'RELAYED') {
          await ensureProof(existing);
          return { txId: existing.txId, replay: true, provider: 'monero-wallet-rpc', network: 'stagenet' };
        }
        if (!allowRelay) {
          const error = new Error('Monero stagenet relay is disabled');
          error.definitelyNotSubmitted = true;
          throw error;
        }
        const relayed = await relayPrepared(existing);
        return { txId: relayed.txId, replay: true, provider: 'monero-wallet-rpc', network: 'stagenet' };
      }

      if (!allowRelay) {
        const error = new Error('Monero stagenet relay is disabled');
        error.definitelyNotSubmitted = true;
        throw error;
      }

      const prepared = await walletRpc.transfer({
        destinations: [{ address: request.recipient, amount: Number(amountAtomic) }],
        do_not_relay: true,
        get_tx_metadata: true,
        get_tx_key: false,
      });
      if (!prepared?.tx_hash || !prepared?.tx_metadata) {
        const error = new Error('Monero wallet RPC did not return tx_hash and tx_metadata for do_not_relay transfer');
        error.definitelyNotSubmitted = true;
        throw error;
      }

      const stored = await submissionStore.prepare({
        idempotencyKey: request.idempotencyKey,
        attemptId: request.attemptId,
        recipient: request.recipient,
        amountAtomic,
        txId: prepared.tx_hash,
        txMetadata: prepared.tx_metadata,
      });
      const relayed = stored.submission.state === 'RELAYED' ? stored.submission : await relayPrepared(stored.submission);
      return { txId: relayed.txId, replay: stored.replay, provider: 'monero-wallet-rpc', network: 'stagenet' };
    },

    async recoverSubmission(request) {
      const amountAtomic = assertStagenetRequest(request);
      const existing = await submissionStore.getByIdempotencyKey(request.idempotencyKey);
      if (!existing) {
        return {
          definitivelyNotSubmitted: true,
          reason: 'no durable Monero prepared submission exists for this idempotency key',
        };
      }
      if (existing.attemptId !== request.attemptId || existing.recipient !== request.recipient || existing.amountAtomic !== amountAtomic) {
        throw new Error('Monero recovery request conflicts with durable submission');
      }
      if (existing.state === 'RELAYED') {
        await ensureProof(existing);
        return { txId: existing.txId, recovered: true };
      }
      if (!allowRelay) {
        return { reason: 'durable Monero transaction is prepared but relay is disabled' };
      }
      const relayed = await relayPrepared(existing);
      return { txId: relayed.txId, recovered: true };
    },
  };
}

module.exports = { assertStagenetRequest, createMoneroStagenetAdapter, visibleTransfer };
