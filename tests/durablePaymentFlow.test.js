'use strict';

const { createDurablePaymentFlow } = require('../src/services/durablePaymentFlow');
const { PAYMENT_ATTEMPT_STATES, requestHash } = require('../src/services/mongoPaymentAttemptStore');

class MemoryAttempts {
  constructor() { this.rows = new Map(); }
  clone(row) { return row ? { ...row } : null; }
  async get(id) { return this.clone(this.rows.get(id)); }
  async prepare({ attemptId, reservationId, idempotencyKey, request }) {
    const existing = this.rows.get(attemptId);
    const hash = requestHash(request);
    if (existing) {
      if (existing.reservationId !== reservationId || existing.idempotencyKey !== idempotencyKey || existing.requestHash !== hash) throw new Error('payment attempt replay conflicts with durable attempt');
      return { attempt: this.clone(existing), replay: true };
    }
    const row = {
      attemptId, reservationId, idempotencyKey, requestHash: hash,
      recipient: request.recipient, asset: request.asset, network: request.network, amount: String(request.amount),
      issueNumber: request.issueNumber ?? null, prNumber: request.prNumber ?? null,
      state: PAYMENT_ATTEMPT_STATES.PREPARED, txId: null, lastError: null,
    };
    this.rows.set(attemptId, row);
    return { attempt: this.clone(row), replay: false };
  }
  async markSubmitting({ attemptId }) {
    const row = this.rows.get(attemptId);
    if (row.state !== PAYMENT_ATTEMPT_STATES.PREPARED) return { attempt: this.clone(row), replay: true };
    row.state = PAYMENT_ATTEMPT_STATES.SUBMITTING;
    return { attempt: this.clone(row), replay: false };
  }
  async markSubmitted({ attemptId, txId }) {
    const row = this.rows.get(attemptId);
    if (row.txId && row.txId !== txId) throw new Error('payment attempt txId conflicts with durable attempt');
    if (row.state === PAYMENT_ATTEMPT_STATES.SUBMITTED || row.state === PAYMENT_ATTEMPT_STATES.CONFIRMED) return { attempt: this.clone(row), replay: true };
    if (row.state !== PAYMENT_ATTEMPT_STATES.SUBMITTING) throw new Error('invalid state');
    row.state = PAYMENT_ATTEMPT_STATES.SUBMITTED;
    row.txId = txId;
    return { attempt: this.clone(row), replay: false };
  }
  async markConfirmed({ attemptId }) {
    const row = this.rows.get(attemptId);
    if (row.state === PAYMENT_ATTEMPT_STATES.CONFIRMED) return { attempt: this.clone(row), replay: true };
    if (row.state !== PAYMENT_ATTEMPT_STATES.SUBMITTED) throw new Error('invalid state');
    row.state = PAYMENT_ATTEMPT_STATES.CONFIRMED;
    return { attempt: this.clone(row), replay: false };
  }
  async markTerminal({ attemptId, state, error }) {
    const row = this.rows.get(attemptId);
    row.state = state;
    row.lastError = error || null;
    return { attempt: this.clone(row), replay: false };
  }
  async noteError({ attemptId, error }) {
    const row = this.rows.get(attemptId);
    row.lastError = error;
    return { attempt: this.clone(row), replay: true };
  }
}

function bounty() {
  return {
    paymentStatus: 'PENDING', paymentRecipient: 'recipient-1', paymentAsset: 'MYZ', paymentNetwork: 'Tari',
    rewardAmount: 25, issueNumber: 10, prNumber: 11,
  };
}

function verifier() {
  return {
    verify: jest.fn(async request => ({
      valid: true, txId: request.txId, recipient: request.recipient, asset: request.asset,
      network: request.network, amount: request.amount, transactionStatus: 'confirmed',
      checks: { recipient: true, asset: true, network: true, amount: true, transactionStatus: true },
    })),
  };
}

function treasury() {
  let state = 'RESERVED';
  return {
    reserve: jest.fn(async ({ reservationId }) => ({ reservation: { reservationId, state }, replay: state !== 'RESERVED' })),
    reconcile: jest.fn(async ({ reservationId, externalState }) => {
      if (externalState === 'confirmed') state = 'SETTLED';
      if (externalState === 'failed' || externalState === 'cancelled') state = 'RELEASED';
      return { reservation: { reservationId, state }, replay: false, unchanged: externalState === 'pending' };
    }),
  };
}

describe('durable payment flow', () => {
  test('persists SUBMITTING before adapter submission and confirms normally', async () => {
    const attempts = new MemoryAttempts();
    const t = treasury();
    const adapter = { submit: jest.fn(async request => ({ txId: `tx-${request.idempotencyKey}` })) };
    const flow = createDurablePaymentFlow({ treasury: t, attempts });

    const result = await flow.execute({
      bounty: bounty(), adapter, verifier: verifier(), reservationId: 'r-1', attemptId: 'a-1', idempotencyKey: 'key-1', amountAtomic: '25',
    });

    expect(result.state).toBe('CONFIRMED');
    expect(result.attempt.state).toBe(PAYMENT_ATTEMPT_STATES.CONFIRMED);
    expect(adapter.submit).toHaveBeenCalledWith(expect.objectContaining({ attemptId: 'a-1', idempotencyKey: 'key-1' }));
    expect(t.reconcile).toHaveBeenLastCalledWith({ reservationId: 'r-1', externalState: 'confirmed' });
  });

  test('ambiguous adapter failure keeps Treasury reserved and never marks failed', async () => {
    const attempts = new MemoryAttempts();
    const t = treasury();
    const adapter = { submit: jest.fn(async () => { throw new Error('connection reset after provider accepted request'); }) };
    const flow = createDurablePaymentFlow({ treasury: t, attempts });

    const result = await flow.execute({
      bounty: bounty(), adapter, verifier: verifier(), reservationId: 'r-2', attemptId: 'a-2', idempotencyKey: 'key-2', amountAtomic: '25',
    });

    expect(result.state).toBe('RECOVERY_REQUIRED');
    expect(result.attempt.state).toBe(PAYMENT_ATTEMPT_STATES.SUBMITTING);
    expect(result.treasury.reservation.state).toBe('RESERVED');
    expect(t.reconcile).toHaveBeenLastCalledWith({ reservationId: 'r-2', externalState: 'pending' });
  });

  test('restart recovery resolves SUBMITTING by idempotency key without resubmitting', async () => {
    const attempts = new MemoryAttempts();
    const t = treasury();
    const firstAdapter = { submit: jest.fn(async () => { throw new Error('process dies after provider submission'); }) };
    const firstFlow = createDurablePaymentFlow({ treasury: t, attempts });

    const first = await firstFlow.execute({
      bounty: bounty(), adapter: firstAdapter, verifier: verifier(), reservationId: 'r-3', attemptId: 'a-3', idempotencyKey: 'key-3', amountAtomic: '25',
    });
    expect(first.state).toBe('RECOVERY_REQUIRED');

    const recoveryAdapter = {
      submit: jest.fn(async () => { throw new Error('must not resubmit'); }),
      recoverSubmission: jest.fn(async request => ({ txId: `recovered-${request.idempotencyKey}` })),
    };
    const secondFlow = createDurablePaymentFlow({ treasury: t, attempts });
    const second = await secondFlow.execute({
      bounty: bounty(), adapter: recoveryAdapter, verifier: verifier(), reservationId: 'r-3', attemptId: 'a-3', idempotencyKey: 'key-3', amountAtomic: '25',
    });

    expect(second.state).toBe('CONFIRMED');
    expect(recoveryAdapter.submit).not.toHaveBeenCalled();
    expect(recoveryAdapter.recoverSubmission).toHaveBeenCalledWith(expect.objectContaining({ attemptId: 'a-3', idempotencyKey: 'key-3' }));
    expect(second.attempt.txId).toBe('recovered-key-3');
  });

  test('submitted payment with inconclusive verification remains reserved for later reconciliation', async () => {
    const attempts = new MemoryAttempts();
    const t = treasury();
    const badVerifier = { verify: jest.fn(async request => ({ valid: false, txId: request.txId, transactionStatus: 'unknown', reason: 'indexer lag' })) };
    const flow = createDurablePaymentFlow({ treasury: t, attempts });

    const result = await flow.execute({
      bounty: bounty(), adapter: { submit: jest.fn(async () => ({ txId: 'tx-pending' })) }, verifier: badVerifier,
      reservationId: 'r-4', attemptId: 'a-4', idempotencyKey: 'key-4', amountAtomic: '25',
    });

    expect(result.state).toBe('PENDING_VERIFICATION');
    expect(result.attempt.state).toBe(PAYMENT_ATTEMPT_STATES.SUBMITTED);
    expect(result.treasury.reservation.state).toBe('RESERVED');
  });

  test('conflicting replay is rejected before a second adapter submission', async () => {
    const attempts = new MemoryAttempts();
    const t = treasury();
    const adapter = { submit: jest.fn(async () => ({ txId: 'tx-1' })) };
    const flow = createDurablePaymentFlow({ treasury: t, attempts });

    await flow.execute({ bounty: bounty(), adapter, verifier: verifier(), reservationId: 'r-5', attemptId: 'a-5', idempotencyKey: 'key-5', amountAtomic: '25' });
    const changed = bounty();
    changed.rewardAmount = 30;

    await expect(flow.execute({ bounty: changed, adapter, verifier: verifier(), reservationId: 'r-5', attemptId: 'a-5', idempotencyKey: 'key-5', amountAtomic: '25' }))
      .rejects.toThrow('payment attempt replay conflicts');
    expect(adapter.submit).toHaveBeenCalledTimes(1);
  });
});
