const { createControlledPaymentFlow } = require('../src/services/controlledPaymentFlow');

describe('controlled payment flow with async Treasury', () => {
  test('awaits reserve and reconciliation before returning confirmed state', async () => {
    const events = [];
    const treasury = {
      reserve: jest.fn(async () => {
        events.push('reserve');
        return { reservation: { reservationId: 'r-1', state: 'RESERVED' }, replay: false };
      }),
      reconcile: jest.fn(async ({ externalState }) => {
        events.push(`reconcile:${externalState}`);
        return { reservation: { reservationId: 'r-1', state: 'SETTLED' }, replay: false };
      }),
    };
    const bounty = {
      paymentStatus: 'PENDING',
      paymentRecipient: 'recipient-1',
      paymentAsset: 'MYZ',
      paymentNetwork: 'Tari',
      rewardAmount: 25,
      issueNumber: 1,
      prNumber: 2,
    };
    const adapter = {
      submit: jest.fn(async () => {
        events.push('submit');
        return { txId: 'tx-1' };
      }),
    };
    const verifier = {
      verify: jest.fn(async request => {
        events.push('verify');
        return {
          valid: true,
          txId: 'tx-1',
          recipient: request.recipient,
          asset: request.asset,
          network: request.network,
          amount: request.amount,
          transactionStatus: 'confirmed',
          checks: { recipient: true, asset: true, network: true, amount: true, transactionStatus: true },
        };
      }),
    };

    const flow = createControlledPaymentFlow({ treasury });
    const result = await flow.execute({ bounty, adapter, verifier, reservationId: 'r-1', amountAtomic: '25' });

    expect(result.payment.state).toBe('CONFIRMED');
    expect(result.treasury.reservation.state).toBe('SETTLED');
    expect(events).toEqual(['reserve', 'submit', 'verify', 'reconcile:confirmed']);
  });
});
