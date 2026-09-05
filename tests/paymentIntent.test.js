const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PaymentIntent = require('../src/models/PaymentIntent');
const {
  createPaymentIntent,
  allocateDestination,
  recordTransaction,
  confirmPaymentIntent
} = require('../src/services/paymentIntentService');

describe('PaymentIntent', () => {
  let mongo;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await PaymentIntent.syncIndexes();
  });

  afterEach(async () => {
    await PaymentIntent.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  test('creates an intent using integer minor units', async () => {
    const intent = await createPaymentIntent({
      ownerId: 'user-1',
      purpose: 'zorgax-access',
      asset: 'btc',
      network: 'bitcoin',
      amountMinor: 12500
    });

    expect(intent.asset).toBe('BTC');
    expect(intent.amountMinor).toBe(12500);
    expect(intent.status).toBe('PENDING');
    expect(intent.intentId).toBeTruthy();
    expect(intent.paymentReference).toBeTruthy();
  });

  test('rejects non-integer monetary values', async () => {
    await expect(
      createPaymentIntent({
        ownerId: 'user-1',
        purpose: 'zorgax-access',
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 12.5
      })
    ).rejects.toThrow(
      'amountMinor must be a positive safe integer'
    );
  });

  test('allocates one destination and moves to awaiting payment', async () => {
    const intent = await createPaymentIntent({
      ownerId: 'user-1',
      purpose: 'zorgax-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 10000
    });

    const updated = await allocateDestination({
      intentId: intent.intentId,
      destination: 'bc1qexampledestination0001'
    });

    expect(updated.destination).toBe(
      'bc1qexampledestination0001'
    );

    expect(updated.status).toBe('AWAITING_PAYMENT');
  });

  test('prevents the same destination being used by two intents', async () => {
    const first = await createPaymentIntent({
      ownerId: 'user-1',
      purpose: 'checkout-1',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 10000
    });

    const second = await createPaymentIntent({
      ownerId: 'user-2',
      purpose: 'checkout-2',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 20000
    });

    await allocateDestination({
      intentId: first.intentId,
      destination: 'bc1quniquedestination'
    });

    await expect(
      allocateDestination({
        intentId: second.intentId,
        destination: 'bc1quniquedestination'
      })
    ).rejects.toMatchObject({
      code: 11000
    });
  });

  test('recording the same txId twice on the same intent is idempotent', async () => {
    const intent = await createPaymentIntent({
      ownerId: 'user-1',
      purpose: 'zorgax-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 10000
    });

    await allocateDestination({
      intentId: intent.intentId,
      destination: 'bc1qidempotent'
    });

    const first = await recordTransaction({
      intentId: intent.intentId,
      txId: 'tx-abc'
    });

    const second = await recordTransaction({
      intentId: intent.intentId,
      txId: 'tx-abc'
    });

    expect(first.replay).toBe(false);
    expect(second.replay).toBe(false);
    expect(second.intent.txId).toBe('tx-abc');
  });

  test('prevents one blockchain transaction settling two intents', async () => {
    const first = await createPaymentIntent({
      ownerId: 'user-1',
      purpose: 'checkout-1',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 10000
    });

    const second = await createPaymentIntent({
      ownerId: 'user-2',
      purpose: 'checkout-2',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 10000
    });

    await allocateDestination({
      intentId: first.intentId,
      destination: 'bc1qdestination1'
    });

    await allocateDestination({
      intentId: second.intentId,
      destination: 'bc1qdestination2'
    });

    await recordTransaction({
      intentId: first.intentId,
      txId: 'shared-tx'
    });

    await expect(
      recordTransaction({
        intentId: second.intentId,
        txId: 'shared-tx'
      })
    ).rejects.toMatchObject({
      code: 11000
    });
  });

  test('only a verified matching payment confirms the intent', async () => {
    const intent = await createPaymentIntent({
      ownerId: 'user-1',
      purpose: 'zorgax-30-day-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    await allocateDestination({
      intentId: intent.intentId,
      destination: 'bc1qverifiedpayment'
    });

    await recordTransaction({
      intentId: intent.intentId,
      txId: 'tx-confirmed'
    });

    const result = await confirmPaymentIntent({
      intentId: intent.intentId,
      verification: {
        verified: true,
        confirmed: true,
        txId: 'tx-confirmed',
        destination: 'bc1qverifiedpayment',
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 25000
      }
    });

    expect(result.replay).toBe(false);
    expect(result.intent.status).toBe('CONFIRMED');
    expect(result.intent.confirmedAt).toBeTruthy();
  });

  test('rejects verification bound to another destination or amount', async () => {
    const intent = await createPaymentIntent({
      ownerId: 'user-1',
      purpose: 'zorgax-30-day-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    await allocateDestination({
      intentId: intent.intentId,
      destination: 'bc1qcorrectdestination'
    });

    await recordTransaction({
      intentId: intent.intentId,
      txId: 'tx-invalid'
    });

    await expect(
      confirmPaymentIntent({
        intentId: intent.intentId,
        verification: {
          verified: true,
          confirmed: true,
          txId: 'tx-invalid',
          destination: 'bc1qattacker',
          asset: 'BTC',
          network: 'bitcoin',
          amountMinor: 25000
        }
      })
    ).rejects.toThrow(
      'payment verification did not match intent'
    );

    const stored = await PaymentIntent.findOne({
      intentId: intent.intentId
    });

    expect(stored.status).not.toBe('CONFIRMED');
  });

  test('confirmed settlement is idempotent for the same transaction', async () => {
    const intent = await createPaymentIntent({
      ownerId: 'user-1',
      purpose: 'zorgax-30-day-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    await allocateDestination({
      intentId: intent.intentId,
      destination: 'bc1qidempotentconfirmation'
    });

    await recordTransaction({
      intentId: intent.intentId,
      txId: 'tx-final'
    });

    const verification = {
      verified: true,
      confirmed: true,
      txId: 'tx-final',
      destination: 'bc1qidempotentconfirmation',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    };

    const first = await confirmPaymentIntent({
      intentId: intent.intentId,
      verification
    });

    const second = await confirmPaymentIntent({
      intentId: intent.intentId,
      verification
    });

    expect(first.replay).toBe(false);
    expect(second.replay).toBe(true);
    expect(second.intent.status).toBe('CONFIRMED');
  });
});