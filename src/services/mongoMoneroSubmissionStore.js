'use strict';

const MoneroPreparedSubmission = require('../models/moneroPreparedSubmissionModel');

function snapshot(row) {
  if (!row) return null;
  return {
    idempotencyKey: row.idempotencyKey,
    attemptId: row.attemptId,
    network: row.network,
    recipient: row.recipient,
    amountAtomic: row.amountAtomic,
    txId: row.txId,
    txMetadata: row.txMetadata || null,
    proofMessage: row.proofMessage || null,
    proofSignature: row.proofSignature || null,
    state: row.state,
    relayedAt: row.relayedAt || null,
  };
}

class MongoMoneroSubmissionStore {
  constructor({ Model = MoneroPreparedSubmission } = {}) {
    if (!Model) throw new Error('Monero prepared submission model is required');
    this.Model = Model;
  }

  async prepare({ idempotencyKey, attemptId, recipient, amountAtomic, txId, txMetadata }) {
    if (!idempotencyKey || !attemptId || !recipient || !amountAtomic || !txId || !txMetadata) {
      throw new Error('prepared Monero submission fields are required');
    }

    try {
      const row = await this.Model.create({
        idempotencyKey,
        attemptId,
        network: 'stagenet',
        recipient,
        amountAtomic: String(amountAtomic),
        txId,
        txMetadata,
        state: 'PREPARED',
      });
      return { submission: snapshot(row), replay: false };
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const existing = await this.Model.findOne({ idempotencyKey });
      if (!existing) throw error;
      if (existing.attemptId !== attemptId || existing.recipient !== recipient || existing.amountAtomic !== String(amountAtomic)) {
        throw new Error('Monero idempotency key conflicts with existing submission');
      }
      return { submission: snapshot(existing), replay: true };
    }
  }

  async markRelayed({ idempotencyKey, txId }) {
    const row = await this.Model.findOneAndUpdate(
      { idempotencyKey, txId },
      { $set: { state: 'RELAYED', relayedAt: new Date(), txMetadata: null } },
      { new: true },
    );
    if (!row) throw new Error('prepared Monero submission not found');
    return snapshot(row);
  }

  async saveProof({ txId, message, signature }) {
    const row = await this.Model.findOneAndUpdate(
      { txId },
      { $set: { proofMessage: message, proofSignature: signature } },
      { new: true },
    );
    if (!row) throw new Error('Monero submission not found for proof');
    return snapshot(row);
  }

  async getByIdempotencyKey(idempotencyKey) {
    return snapshot(await this.Model.findOne({ idempotencyKey }));
  }

  async getByTxId(txId) {
    return snapshot(await this.Model.findOne({ txId }));
  }
}

module.exports = { MongoMoneroSubmissionStore, snapshot };
