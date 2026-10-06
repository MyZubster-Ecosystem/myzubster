const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PaymentIntent = require('../src/models/PaymentIntent');
const {
  createPaymentService
} = require('../src/services/paymentService');

const VALID_TX =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

describe('paymentService', () => {
  let mongo;
  let btcRail;
  let service;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    await PaymentIntent.syncIndexes();
  });

  beforeEach(() => {
    btcRail = {
      allocate: jest.fn(),
      verify: jest.fn()
    };

    service = createPaymentService({
      rails: {
        BTC: btcRail
      }
    });
  });

  afterEach(async () => {
    await PaymentIntent.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  test('creates checkout and allocates a per-intent destination', async () => {
    btcRail.allocate.mockResolvedValue({
      destination:
        'bc1qcheckoutdestination00000000000000000000'
    });

    const result = await service.createCheckout({
      ownerId: 'user-1',
      purpose: 'zorgax-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    expect(result.intent.status).toBe('AWAITING_PAYMENT');
    expect(result.payment.destination).toBe(
      'bc1qcheckoutdestination00000000000000000000'
    );
    expect(result.payment.amountMinor).toBe(25000);
    expect(result.payment.paymentReference).toBeTruthy();

    expect(btcRail.allocate).toHaveBeenCalledTimes(1);
  });

  test('records a submitted transaction', async () => {
    btcRail.allocate.mockResolvedValue({
      destination:
        'bc1qsubmitdestination000000000000000000000'
    });

    const checkout = await service.createCheckout({
      ownerId: 'user-1',
      purpose: 'zorgax-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    const result = await service.submitTransaction({
      intentId: checkout.intent.intentId,
      txId: VALID_TX
    });

    expect(result.intent.status).toBe('SUBMITTED');
    expect(result.intent.txId).toBe(VALID_TX);
  });

  test('verifies and confirms payment using persisted intent data', async () => {
    const destination =
      'bc1qconfirmdestination00000000000000000000';

    btcRail.allocate.mockResolvedValue({
      destination
    });

    const checkout = await service.createCheckout({
      ownerId: 'user-1',
      purpose: 'zorgax-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    await service.submitTransaction({
      intentId: checkout.intent.intentId,
      txId: VALID_TX
    });

    btcRail.verify.mockResolvedValue({
      verified: true,
      confirmed: true,
      txId: VALID_TX,
      destination,
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    const result = await service.verifyAndConfirm({
      intentId: checkout.intent.intentId
    });

    expect(result.intent.status).toBe('CONFIRMED');
    expect(result.replay).toBe(false);
    expect(btcRail.verify).toHaveBeenCalledTimes(1);
  });

  test('does not confirm mismatched verification', async () => {
    const destination =
      'bc1qrejectdestination000000000000000000000';

    btcRail.allocate.mockResolvedValue({
      destination
    });

    const checkout = await service.createCheckout({
      ownerId: 'user-1',
      purpose: 'zorgax-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    await service.submitTransaction({
      intentId: checkout.intent.intentId,
      txId: VALID_TX
    });

    btcRail.verify.mockResolvedValue({
      verified: false,
      confirmed: false,
      txId: VALID_TX,
      destination,
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 24999
    });

    await expect(
      service.verifyAndConfirm({
        intentId: checkout.intent.intentId
      })
    ).rejects.toThrow(
      'payment verification did not match intent'
    );

    const stored = await PaymentIntent.findOne({
      intentId: checkout.intent.intentId
    });

    expect(stored.status).toBe('SUBMITTED');
  });

  test('confirmation replay is idempotent', async () => {
    const destination =
      'bc1qreplaydestination000000000000000000000';

    btcRail.allocate.mockResolvedValue({
      destination
    });

    const checkout = await service.createCheckout({
      ownerId: 'user-1',
      purpose: 'zorgax-access',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    await service.submitTransaction({
      intentId: checkout.intent.intentId,
      txId: VALID_TX
    });

    btcRail.verify.mockResolvedValue({
      verified: true,
      confirmed: true,
      txId: VALID_TX,
      destination,
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 25000
    });

    const first = await service.verifyAndConfirm({
      intentId: checkout.intent.intentId
    });

    const second = await service.verifyAndConfirm({
      intentId: checkout.intent.intentId
    });

    expect(first.replay).toBe(false);
    expect(second.replay).toBe(true);
  });

  test('rejects an asset without a configured rail', async () => {
    const serviceWithoutRails = createPaymentService();

    await expect(
      serviceWithoutRails.createCheckout({
        ownerId: 'user-1',
        purpose: 'zorgax-access',
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 25000
      })
    ).rejects.toThrow(
      'payment rail not configured for BTC'
    );
  });
});
