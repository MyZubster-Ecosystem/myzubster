const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const PaymentIntent = require('../src/models/PaymentIntent');
const ZorgaxCreditAccount = require('../src/models/ZorgaxCreditAccount');
const ZorgaxProduct = require('../src/models/ZorgaxProduct');

const {
  ZorgaxLedgerEntry
} = require('../src/models/ZorgaxLedgerEntry');

const {
  ZorgaxPurchase,
  PURCHASE_STATUSES
} = require('../src/models/ZorgaxPurchase');

const {
  grantPurchaseCredits
} = require('../src/services/zorgaxCreditService');

const {
  resolvePurchase
} = require('../src/services/zorgaxPricingService');

const {
  createZorgaxMonetizationService
} = require('../src/services/zorgaxMonetizationService');

jest.setTimeout(60000);

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1
    }
  });

  await mongoose.connect(replSet.getUri());

  await Promise.all([
    PaymentIntent.syncIndexes(),
    ZorgaxCreditAccount.syncIndexes(),
    ZorgaxLedgerEntry.syncIndexes(),
    ZorgaxProduct.syncIndexes(),
    ZorgaxPurchase.syncIndexes()
  ]);
});

afterEach(async () => {
  await Promise.all([
    PaymentIntent.deleteMany({}),
    ZorgaxCreditAccount.deleteMany({}),
    ZorgaxLedgerEntry.deleteMany({}),
    ZorgaxProduct.deleteMany({}),
    ZorgaxPurchase.deleteMany({})
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();

  if (replSet) {
    await replSet.stop();
  }
});

async function createStarterProduct() {
  return ZorgaxProduct.create({
    productId: 'zorgax_credits_starter',
    name: 'Zorgax Starter Credits',
    description: 'Starter Zorgax credit pack',
    kind: 'CREDIT_PACK',
    active: true,
    creditsGranted: 10000,

    pricing: {
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 2500
    },

    usage: {
      unit: 'CREDITS',
      creditsPerUnit: 0
    }
  });
}

function createFakePaymentService() {
  let counter = 0;

  return {
    async createCheckout({
      ownerId,
      purpose,
      asset,
      network,
      amountMinor,
      metadata
    }) {
      counter += 1;

      const intent = await PaymentIntent.create({
        intentId: `intent-${counter}`,
        ownerId,
        purpose,
        asset,
        network,
        amountMinor,
        destination: `bc1qtestdestination${counter}`,
        paymentReference: `payment-reference-${counter}`,
        txId: null,
        status: 'AWAITING_PAYMENT',
        expiresAt: new Date(
          Date.now() + 30 * 60 * 1000
        ),
        metadata
      });

      return {
        intent
      };
    },

    async verifyAndConfirm({
      intentId
    }) {
      const intent = await PaymentIntent.findOne({
        intentId
      });

      if (!intent) {
        throw new Error('Payment intent not found');
      }

      intent.txId =
        'a'.repeat(63) +
        String(intentId).slice(-1);

      intent.status = 'CONFIRMED';
      intent.confirmedAt = new Date();

      await intent.save();

      return {
        intent,
        replay: false
      };
    }
  };
}

function createService(paymentService) {
  return createZorgaxMonetizationService({
    paymentService,

    pricingService: {
      resolvePurchase
    },

    creditService: {
      grantPurchaseCredits
    }
  });
}

describe('Zorgax monetization service', () => {
  test('creates checkout using persisted server-side product pricing', async () => {
    await createStarterProduct();

    const paymentService = createFakePaymentService();
    const service = createService(paymentService);

    const result = await service.createCheckout({
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter',

      metadata: {
        source: 'test'
      }
    });

    expect(result.purchase).toMatchObject({
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter',
      creditsGranted: 10000,
      status: PURCHASE_STATUSES.PENDING,

      payment: {
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 2500
      }
    });

    const intent = await PaymentIntent.findOne({
      intentId: result.purchase.paymentIntentId
    }).lean();

    expect(intent.ownerId).toBe('user-1');
    expect(intent.amountMinor).toBe(2500);
    expect(intent.asset).toBe('BTC');
    expect(intent.network).toBe('bitcoin');
  });

  test('client cannot override server-side price or granted credits', async () => {
    await createStarterProduct();

    const paymentService = createFakePaymentService();
    const service = createService(paymentService);

    const result = await service.createCheckout({
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter',

      metadata: {
        amountMinor: 1,
        creditsGranted: 999999999
      }
    });

    expect(result.purchase.payment.amountMinor).toBe(2500);
    expect(result.purchase.creditsGranted).toBe(10000);

    const intent = await PaymentIntent.findOne({
      intentId: result.purchase.paymentIntentId
    }).lean();

    expect(intent.amountMinor).toBe(2500);
  });

  test('confirmed payment grants Zorgax credits', async () => {
    await createStarterProduct();

    const paymentService = createFakePaymentService();
    const service = createService(paymentService);

    const checkout = await service.createCheckout({
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter'
    });

    const result = await service.settlePurchase({
      ownerId: 'user-1',
      purchaseId: checkout.purchase.purchaseId
    });

    expect(result.purchase.status).toBe(
      PURCHASE_STATUSES.CREDITED
    );

    expect(result.credit.replay).toBe(false);
    expect(result.credit.balanceCredits).toBe(10000);

    const account = await ZorgaxCreditAccount.findOne({
      ownerId: 'user-1'
    }).lean();

    expect(account.balanceCredits).toBe(10000);
    expect(account.totalPurchasedCredits).toBe(10000);
  });

  test('settling the same purchase repeatedly grants credits only once', async () => {
    await createStarterProduct();

    const paymentService = createFakePaymentService();
    const service = createService(paymentService);

    const checkout = await service.createCheckout({
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter'
    });

    const first = await service.settlePurchase({
      ownerId: 'user-1',
      purchaseId: checkout.purchase.purchaseId
    });

    const second = await service.settlePurchase({
      ownerId: 'user-1',
      purchaseId: checkout.purchase.purchaseId
    });

    expect(first.credit.replay).toBe(false);
    expect(second.credit.replay).toBe(true);

    const account = await ZorgaxCreditAccount.findOne({
      ownerId: 'user-1'
    }).lean();

    expect(account.balanceCredits).toBe(10000);
    expect(account.totalPurchasedCredits).toBe(10000);

    const entries = await ZorgaxLedgerEntry.find({
      paymentIntentId:
        checkout.purchase.paymentIntentId
    }).lean();

    expect(entries).toHaveLength(1);
  });

  test('purchase ownership is enforced', async () => {
    await createStarterProduct();

    const paymentService = createFakePaymentService();
    const service = createService(paymentService);

    const checkout = await service.createCheckout({
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter'
    });

    await expect(
      service.settlePurchase({
        ownerId: 'user-2',
        purchaseId: checkout.purchase.purchaseId
      })
    ).rejects.toThrow(
      'Zorgax purchase not found'
    );

    const user2Account =
      await ZorgaxCreditAccount.findOne({
        ownerId: 'user-2'
      });

    expect(user2Account).toBeNull();
  });

  test('mismatched confirmed payment intent does not grant credits', async () => {
    await createStarterProduct();

    const paymentService = createFakePaymentService();
    const service = createService(paymentService);

    const checkout = await service.createCheckout({
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter'
    });

    await PaymentIntent.updateOne(
      {
        intentId:
          checkout.purchase.paymentIntentId
      },
      {
        $set: {
          amountMinor: 1
        }
      }
    );

    await expect(
      service.settlePurchase({
        ownerId: 'user-1',
        purchaseId: checkout.purchase.purchaseId
      })
    ).rejects.toThrow(
      'Confirmed PaymentIntent does not match Zorgax purchase'
    );

    const account = await ZorgaxCreditAccount.findOne({
      ownerId: 'user-1'
    });

    expect(account).toBeNull();

    const entries = await ZorgaxLedgerEntry.find({
      ownerId: 'user-1'
    }).lean();

    expect(entries).toHaveLength(0);
  });
});