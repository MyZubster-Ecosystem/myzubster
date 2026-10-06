const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const ZorgaxCreditAccount = require('../src/models/ZorgaxCreditAccount');
const {
  ZorgaxLedgerEntry
} = require('../src/models/ZorgaxLedgerEntry');

const {
  consumeCredits,
  getBalance,
  grantPurchaseCredits,
  listLedger
} = require('../src/services/zorgaxCreditService');

jest.setTimeout(60000);

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1
    }
  });

  await mongoose.connect(replSet.getUri());

  await ZorgaxCreditAccount.syncIndexes();
  await ZorgaxLedgerEntry.syncIndexes();
});

afterEach(async () => {
  await ZorgaxLedgerEntry.deleteMany({});
  await ZorgaxCreditAccount.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();

  if (replSet) {
    await replSet.stop();
  }
});

describe('Zorgax credit service', () => {
  test('new user starts with zero balance', async () => {
    const balance = await getBalance('user-1');

    expect(balance).toEqual({
      ownerId: 'user-1',
      balanceCredits: 0,
      totalPurchasedCredits: 0,
      totalConsumedCredits: 0
    });
  });

  test('grants purchased credits and creates ledger entry', async () => {
    const result = await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 10000,
      paymentIntentId: 'intent-1',
      productId: 'zorgax_credits_starter'
    });

    expect(result.replay).toBe(false);
    expect(result.balanceCredits).toBe(10000);
    expect(result.entry.type).toBe('PURCHASE');
    expect(result.entry.amountCredits).toBe(10000);
    expect(result.entry.paymentIntentId).toBe('intent-1');

    const balance = await getBalance('user-1');

    expect(balance.balanceCredits).toBe(10000);
    expect(balance.totalPurchasedCredits).toBe(10000);
    expect(balance.totalConsumedCredits).toBe(0);
  });

  test('same payment intent grants credits only once', async () => {
    const first = await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 10000,
      paymentIntentId: 'intent-1',
      productId: 'zorgax_credits_starter'
    });

    const second = await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 10000,
      paymentIntentId: 'intent-1',
      productId: 'zorgax_credits_starter'
    });

    expect(first.replay).toBe(false);
    expect(second.replay).toBe(true);

    const balance = await getBalance('user-1');

    expect(balance.balanceCredits).toBe(10000);
    expect(balance.totalPurchasedCredits).toBe(10000);

    const entries = await ZorgaxLedgerEntry.find({
      paymentIntentId: 'intent-1'
    }).lean();

    expect(entries).toHaveLength(1);
  });

  test('payment intent cannot be reused for another owner', async () => {
    await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 10000,
      paymentIntentId: 'intent-1'
    });

    await expect(
      grantPurchaseCredits({
        ownerId: 'user-2',
        credits: 10000,
        paymentIntentId: 'intent-1'
      })
    ).rejects.toThrow(
      'paymentIntentId is already bound to another ledger operation'
    );

    const user2Balance = await getBalance('user-2');

    expect(user2Balance.balanceCredits).toBe(0);
  });

  test('consumes credits and records usage', async () => {
    await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 10000,
      paymentIntentId: 'intent-1'
    });

    const result = await consumeCredits({
      ownerId: 'user-1',
      credits: 250,
      usageReference: 'research-job-1',
      productId: 'zorgax_research'
    });

    expect(result.replay).toBe(false);
    expect(result.balanceCredits).toBe(9750);
    expect(result.entry.type).toBe('USAGE');
    expect(result.entry.amountCredits).toBe(-250);
    expect(result.entry.usageReference).toBe('research-job-1');

    const balance = await getBalance('user-1');

    expect(balance.balanceCredits).toBe(9750);
    expect(balance.totalPurchasedCredits).toBe(10000);
    expect(balance.totalConsumedCredits).toBe(250);
  });

  test('same usage reference consumes credits only once', async () => {
    await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 10000,
      paymentIntentId: 'intent-1'
    });

    const first = await consumeCredits({
      ownerId: 'user-1',
      credits: 250,
      usageReference: 'research-job-1'
    });

    const second = await consumeCredits({
      ownerId: 'user-1',
      credits: 250,
      usageReference: 'research-job-1'
    });

    expect(first.replay).toBe(false);
    expect(second.replay).toBe(true);

    const balance = await getBalance('user-1');

    expect(balance.balanceCredits).toBe(9750);
    expect(balance.totalConsumedCredits).toBe(250);

    const entries = await ZorgaxLedgerEntry.find({
      ownerId: 'user-1',
      usageReference: 'research-job-1'
    }).lean();

    expect(entries).toHaveLength(1);
  });

  test('rejects consumption when balance is insufficient', async () => {
    await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 100,
      paymentIntentId: 'intent-1'
    });

    await expect(
      consumeCredits({
        ownerId: 'user-1',
        credits: 250,
        usageReference: 'research-job-1'
      })
    ).rejects.toThrow(
      'Insufficient Zorgax credits: required 250, available 100'
    );

    const balance = await getBalance('user-1');

    expect(balance.balanceCredits).toBe(100);
    expect(balance.totalConsumedCredits).toBe(0);

    const usageEntries = await ZorgaxLedgerEntry.find({
      type: 'USAGE'
    }).lean();

    expect(usageEntries).toHaveLength(0);
  });

  test('balances are isolated by owner', async () => {
    await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 10000,
      paymentIntentId: 'intent-1'
    });

    await grantPurchaseCredits({
      ownerId: 'user-2',
      credits: 5000,
      paymentIntentId: 'intent-2'
    });

    await consumeCredits({
      ownerId: 'user-1',
      credits: 500,
      usageReference: 'user-1-job'
    });

    const user1 = await getBalance('user-1');
    const user2 = await getBalance('user-2');

    expect(user1.balanceCredits).toBe(9500);
    expect(user2.balanceCredits).toBe(5000);
  });

  test('lists ledger entries for one owner', async () => {
    await grantPurchaseCredits({
      ownerId: 'user-1',
      credits: 10000,
      paymentIntentId: 'intent-1'
    });

    await consumeCredits({
      ownerId: 'user-1',
      credits: 100,
      usageReference: 'job-1'
    });

    await consumeCredits({
      ownerId: 'user-1',
      credits: 200,
      usageReference: 'job-2'
    });

    await grantPurchaseCredits({
      ownerId: 'user-2',
      credits: 5000,
      paymentIntentId: 'intent-2'
    });

    const entries = await listLedger({
      ownerId: 'user-1'
    });

    expect(entries).toHaveLength(3);

    for (const entry of entries) {
      expect(entry.ownerId).toBe('user-1');
    }
  });
});