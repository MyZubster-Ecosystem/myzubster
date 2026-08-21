const { createControlledPaymentFlow } = require('../src/services/controlledPaymentFlow');
const {
  InMemoryTreasuryStore,
  createTreasuryReservationService,
} = require('../src/services/treasuryReservationService');

function setup(balanceAtomic = '100') {
  const store = new InMemoryTreasuryStore();
  store.configureAccount({ asset: 'MYZ', network: 'Tari', balanceAtomic });
  const treasury = createTreasuryReservationService({ store });
  const flow = createControlledPaymentFlow({ treasury });
  return { store, treasury, flow };
}

function bounty(overrides = {}) {
  return {
    paymentStatus: 'PENDING',
    paymentRecipient: 'recipient-1',
    paymentAsset: 'MYZ',
    paymentNetwork: 'Tari',
    rewardAmount: 25,
    issueNumber: 289,
    prNumber: 300,
    ...overrides,
  };
}

function validVerifier() {
  return {
    verify: jest.fn(async request => ({
      valid: true,
      txId: request.txId,
      recipient: request.recipient,
      asset: request.asset,
      network: request.network,
      amount: request.amount,
      transactionStatus: 'confirmed',
      checks: {
        recipient: true,
        asset: true,
        network: true,
        amount: true,
        transactionStatus: true,
      },
      provider: 'controlled-test-verifier',
    })),
  };
}

describe('controlled P0 payment flow', () => {
  test('reserves before submit, confirms through verifier and reconciles to settled', async () => {
    const { store, flow } = setup('100');
    const payment = bounty();
    const adapter = { submit: jest.fn().mockResolvedValue({ txId: 'tx-1' }) };

    const result = await flow.execute({
      bounty: payment,
      adapter,
      verifier: validVerifier(),
      reservationId: 'issue-289-pr-300',
      amountAtomic: '25',
      reference: 'issue:289/pr:300',
    });

    expect(adapter.submit).toHaveBeenCalledTimes(1);
    expect(result.payment.state).toBe('CONFIRMED');
    expect(result.treasury.reservation.state).toBe('SETTLED');
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '75',
      reservedAtomic: '0',
      settledAtomic: '25',
    }));
  });

  test('insufficient Treasury balance rejects before adapter submission', async () => {
    const { flow } = setup('20');
    const adapter = { submit: jest.fn() };

    await expect(flow.execute({
      bounty: bounty(),
      adapter,
      verifier: validVerifier(),
      reservationId: 'too-large',
      amountAtomic: '25',
    })).rejects.toThrow('insufficient treasury balance');

    expect(adapter.submit).not.toHaveBeenCalled();
  });

  test('missing independent verifier fails before submit and releases reservation', async () => {
    const { store, flow } = setup('100');
    const adapter = { submit: jest.fn() };

    await expect(flow.execute({
      bounty: bounty(),
      adapter,
      verifier: null,
      reservationId: 'missing-verifier',
      amountAtomic: '25',
    })).rejects.toThrow('payment verifier is not configured');

    expect(adapter.submit).not.toHaveBeenCalled();
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '100',
      reservedAtomic: '0',
      settledAtomic: '0',
    }));
  });

  test('wrong verifier evidence fails payment and releases reservation', async () => {
    const { store, flow } = setup('100');
    const adapter = { submit: jest.fn().mockResolvedValue({ txId: 'tx-wrong' }) };
    const verifier = validVerifier();
    verifier.verify.mockImplementation(async request => ({
      valid: true,
      txId: request.txId,
      recipient: 'wrong-recipient',
      asset: request.asset,
      network: request.network,
      amount: request.amount,
      transactionStatus: 'confirmed',
      checks: {
        recipient: true,
        asset: true,
        network: true,
        amount: true,
        transactionStatus: true,
      },
    }));

    const result = await flow.execute({
      bounty: bounty(),
      adapter,
      verifier,
      reservationId: 'wrong-evidence',
      amountAtomic: '25',
    });

    expect(result.payment.state).toBe('FAILED');
    expect(result.treasury.reservation.state).toBe('RELEASED');
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '100',
      reservedAtomic: '0',
      settledAtomic: '0',
    }));
  });

  test('adapter failure releases the reserved funds', async () => {
    const { store, flow } = setup('100');
    const adapter = { submit: jest.fn().mockRejectedValue(new Error('gateway unavailable')) };

    const result = await flow.execute({
      bounty: bounty(),
      adapter,
      verifier: validVerifier(),
      reservationId: 'adapter-failure',
      amountAtomic: '25',
    });

    expect(result.payment.state).toBe('FAILED');
    expect(result.treasury.reservation.state).toBe('RELEASED');
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' }).availableAtomic).toBe('100');
  });

  test('replaying an already confirmed flow does not submit or settle twice', async () => {
    const { store, flow } = setup('100');
    const payment = bounty();
    const adapter = { submit: jest.fn().mockResolvedValue({ txId: 'tx-replay' }) };
    const verifier = validVerifier();
    const args = {
      bounty: payment,
      adapter,
      verifier,
      reservationId: 'replay-1',
      amountAtomic: '25',
    };

    const first = await flow.execute(args);
    const second = await flow.execute(args);

    expect(first.payment.state).toBe('CONFIRMED');
    expect(second.payment).toEqual({ state: 'CONFIRMED', replay: true });
    expect(adapter.submit).toHaveBeenCalledTimes(1);
    expect(store.getAccount({ asset: 'MYZ', network: 'Tari' })).toEqual(expect.objectContaining({
      availableAtomic: '75',
      reservedAtomic: '0',
      settledAtomic: '25',
    }));
  });

  test('a released reservation cannot silently fund a retry', async () => {
    const { flow } = setup('100');
    const payment = bounty();
    const badVerifier = validVerifier();
    badVerifier.verify.mockResolvedValue({ valid: false, reason: 'not confirmed' });

    await flow.execute({
      bounty: payment,
      adapter: { submit: jest.fn().mockResolvedValue({ txId: 'tx-failed' }) },
      verifier: badVerifier,
      reservationId: 'retry-id',
      amountAtomic: '25',
    });

    await expect(flow.execute({
      bounty: payment,
      adapter: { submit: jest.fn().mockResolvedValue({ txId: 'tx-retry' }) },
      verifier: validVerifier(),
      reservationId: 'retry-id',
      amountAtomic: '25',
    })).rejects.toThrow('released reservation cannot be reused');
  });
});
