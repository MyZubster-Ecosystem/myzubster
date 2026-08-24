'use strict';

const crypto = require('crypto');
const PaymentAttempt = require('../models/paymentAttemptModel');
const { PAYMENT_ATTEMPT_STATES } = require('../models/paymentAttemptModel');

function canonicalRequest(request = {}) {
  const normalized = {
    recipient: String(request.recipient ?? '').trim(),
    asset: String(request.asset ?? '').trim(),
    network: String(request.network ?? '').trim(),
    amount: String(request.amount ?? ''),
    issueNumber: request.issueNumber ?? null,
    prNumber: request.prNumber ?? null,
  };
  if (!normalized.recipient) throw new Error('payment attempt recipient is required');
  if (!normalized.asset) throw new Error('payment attempt asset is required');
  if (!normalized.network) throw new Error('payment attempt network is required');
  if (!normalized.amount) throw new Error('payment attempt amount is required');
  return normalized;
}

function requestHash(request) {
  const canonical = canonicalRequest(request);
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function snapshot(row) {
  if (!row) return null;
  return {
    attemptId: row.attemptId,
    reservationId: row.reservationId,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    recipient: row.recipient,
    asset: row.asset,
    network: row.network,
    amount: row.amount,
    issueNumber: row.issueNumber ?? null,
    prNumber: row.prNumber ?? null,
    state: row.state,
    txId: row.txId || null,
    lastError: row.lastError || null,
    submittingAt: row.submittingAt || null,
    submittedAt: row.submittedAt || null,
    confirmedAt: row.confirmedAt || null,
  };
}

class MongoPaymentAttemptStore {
  constructor({ Model = PaymentAttempt } = {}) {
    if (!Model) throw new Error('PaymentAttempt model is required');
    this.Model = Model;
  }

  async get(attemptId) {
    return snapshot(await this.Model.findOne({ attemptId }));
  }

  async prepare({ attemptId, reservationId, idempotencyKey = attemptId, request }) {
    if (!attemptId || typeof attemptId !== 'string') throw new Error('attemptId is required');
    if (!reservationId || typeof reservationId !== 'string') throw new Error('reservationId is required');
    if (!idempotencyKey || typeof idempotencyKey !== 'string') throw new Error('idempotencyKey is required');

    const canonical = canonicalRequest(request);
    const hash = requestHash(canonical);
    const existing = await this.Model.findOne({ attemptId });
    if (existing) return this.assertReplay(existing, { reservationId, idempotencyKey, hash });

    try {
      const created = await this.Model.create({
        attemptId,
        reservationId,
        idempotencyKey,
        requestHash: hash,
        ...canonical,
        state: PAYMENT_ATTEMPT_STATES.PREPARED,
      });
      return { attempt: snapshot(created), replay: false };
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const raced = await this.Model.findOne({ $or: [{ attemptId }, { idempotencyKey }] });
      if (!raced) throw error;
      return this.assertReplay(raced, { reservationId, idempotencyKey, hash, attemptId });
    }
  }

  assertReplay(existing, { reservationId, idempotencyKey, hash, attemptId = existing.attemptId }) {
    if (
      existing.attemptId !== attemptId ||
      existing.reservationId !== reservationId ||
      existing.idempotencyKey !== idempotencyKey ||
      existing.requestHash !== hash
    ) {
      throw new Error('payment attempt replay conflicts with durable attempt');
    }
    return { attempt: snapshot(existing), replay: true };
  }

  async markSubmitting({ attemptId }) {
    const changed = await this.Model.findOneAndUpdate(
      { attemptId, state: PAYMENT_ATTEMPT_STATES.PREPARED },
      { $set: { state: PAYMENT_ATTEMPT_STATES.SUBMITTING, submittingAt: new Date(), updatedAt: new Date(), lastError: null } },
      { new: true },
    );
    if (changed) return { attempt: snapshot(changed), replay: false };
    const existing = await this.Model.findOne({ attemptId });
    if (!existing) throw new Error('payment attempt not found');
    return { attempt: snapshot(existing), replay: true };
  }

  async markSubmitted({ attemptId, txId }) {
    if (!txId || typeof txId !== 'string') throw new Error('payment attempt txId is required');
    const changed = await this.Model.findOneAndUpdate(
      { attemptId, state: PAYMENT_ATTEMPT_STATES.SUBMITTING, txId: null },
      { $set: { state: PAYMENT_ATTEMPT_STATES.SUBMITTED, txId, submittedAt: new Date(), updatedAt: new Date(), lastError: null } },
      { new: true },
    );
    if (changed) return { attempt: snapshot(changed), replay: false };

    const existing = await this.Model.findOne({ attemptId });
    if (!existing) throw new Error('payment attempt not found');
    if (existing.txId && existing.txId !== txId) throw new Error('payment attempt txId conflicts with durable attempt');
    if ([PAYMENT_ATTEMPT_STATES.SUBMITTED, PAYMENT_ATTEMPT_STATES.CONFIRMED].includes(existing.state) && existing.txId === txId) {
      return { attempt: snapshot(existing), replay: true };
    }
    throw new Error(`payment attempt cannot record submission from state ${existing.state}`);
  }

  async markConfirmed({ attemptId }) {
    const changed = await this.Model.findOneAndUpdate(
      { attemptId, state: PAYMENT_ATTEMPT_STATES.SUBMITTED, txId: { $ne: null } },
      { $set: { state: PAYMENT_ATTEMPT_STATES.CONFIRMED, confirmedAt: new Date(), updatedAt: new Date(), lastError: null } },
      { new: true },
    );
    if (changed) return { attempt: snapshot(changed), replay: false };
    const existing = await this.Model.findOne({ attemptId });
    if (!existing) throw new Error('payment attempt not found');
    if (existing.state === PAYMENT_ATTEMPT_STATES.CONFIRMED) return { attempt: snapshot(existing), replay: true };
    throw new Error(`payment attempt cannot confirm from state ${existing.state}`);
  }

  async markTerminal({ attemptId, state, error = null }) {
    if (![PAYMENT_ATTEMPT_STATES.FAILED, PAYMENT_ATTEMPT_STATES.CANCELLED].includes(state)) {
      throw new Error('unsupported payment attempt terminal state');
    }
    const changed = await this.Model.findOneAndUpdate(
      { attemptId, state: { $in: [PAYMENT_ATTEMPT_STATES.PREPARED, PAYMENT_ATTEMPT_STATES.SUBMITTING] }, txId: null },
      { $set: { state, lastError: error, updatedAt: new Date() } },
      { new: true },
    );
    if (changed) return { attempt: snapshot(changed), replay: false };
    const existing = await this.Model.findOne({ attemptId });
    if (!existing) throw new Error('payment attempt not found');
    if (existing.state === state) return { attempt: snapshot(existing), replay: true };
    throw new Error(`payment attempt cannot become ${state} from state ${existing.state}`);
  }

  async noteError({ attemptId, error }) {
    const row = await this.Model.findOneAndUpdate(
      { attemptId },
      { $set: { lastError: error || null, updatedAt: new Date() } },
      { new: true },
    );
    if (!row) throw new Error('payment attempt not found');
    return { attempt: snapshot(row), replay: true };
  }
}

module.exports = {
  MongoPaymentAttemptStore,
  PAYMENT_ATTEMPT_STATES,
  canonicalRequest,
  requestHash,
  snapshot,
};
