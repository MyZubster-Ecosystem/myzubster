const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const {
  ZorgaxEntitlement
} = require('../src/models/ZorgaxEntitlement');

const {
  getAccess,
  grantPurchaseEntitlement,
  listEntitlements
} = require('../src/services/zorgaxEntitlementService');

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await ZorgaxEntitlement.syncIndexes();
});

afterEach(async () => {
  await ZorgaxEntitlement.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

describe('Zorgax entitlement service', () => {
  test('returns FREE access when no paid entitlement exists', async () => {
    const access = await getAccess('user-1');

    expect(access).toMatchObject({
      ownerId: 'user-1',
      entitlementKey: 'zorgax.access',
      tier: 'FREE',
      active: true,
      source: 'DEFAULT_FREE'
    });
  });

  test('grants PRO access from a purchase once', async () => {
    const first = await grantPurchaseEntitlement({
      ownerId: 'user-1',
      purchaseId: 'purchase-1',
      productId: 'zorgax_pro_monthly',
      tier: 'PRO',
      durationDays: 30
    });

    const replay = await grantPurchaseEntitlement({
      ownerId: 'user-1',
      purchaseId: 'purchase-1',
      productId: 'zorgax_pro_monthly',
      tier: 'PRO',
      durationDays: 30
    });

    expect(first.replay).toBe(false);
    expect(replay.replay).toBe(true);
    expect(replay.entitlement.entitlementId).toBe(
      first.entitlement.entitlementId
    );

    expect(await ZorgaxEntitlement.countDocuments()).toBe(1);
  });

  test('stacks renewals of the same tier', async () => {
    const first = await grantPurchaseEntitlement({
      ownerId: 'user-1',
      purchaseId: 'purchase-1',
      productId: 'zorgax_pro_monthly',
      tier: 'PRO',
      durationDays: 30
    });

    const second = await grantPurchaseEntitlement({
      ownerId: 'user-1',
      purchaseId: 'purchase-2',
      productId: 'zorgax_pro_monthly',
      tier: 'PRO',
      durationDays: 30
    });

    expect(new Date(second.entitlement.startsAt).getTime()).toBe(
      new Date(first.entitlement.endsAt).getTime()
    );

    expect(new Date(second.entitlement.endsAt).getTime()).toBeGreaterThan(
      new Date(first.entitlement.endsAt).getTime()
    );
  });

  test('DEVELOPER access outranks PRO access', async () => {
    await grantPurchaseEntitlement({
      ownerId: 'user-1',
      purchaseId: 'purchase-pro',
      productId: 'zorgax_pro_monthly',
      tier: 'PRO',
      durationDays: 30
    });

    await grantPurchaseEntitlement({
      ownerId: 'user-1',
      purchaseId: 'purchase-dev',
      productId: 'zorgax_developer_monthly',
      tier: 'DEVELOPER',
      durationDays: 30
    });

    const access = await getAccess('user-1');
    expect(access.tier).toBe('DEVELOPER');
    expect(access.source).toBe('PURCHASE');
  });

  test('lists only the authenticated owners entitlements', async () => {
    await grantPurchaseEntitlement({
      ownerId: 'user-1',
      purchaseId: 'purchase-1',
      productId: 'zorgax_pro_monthly',
      tier: 'PRO',
      durationDays: 30
    });

    await grantPurchaseEntitlement({
      ownerId: 'user-2',
      purchaseId: 'purchase-2',
      productId: 'zorgax_developer_monthly',
      tier: 'DEVELOPER',
      durationDays: 30
    });

    const entries = await listEntitlements({ ownerId: 'user-1' });

    expect(entries).toHaveLength(1);
    expect(entries[0].ownerId).toBe('user-1');
  });

  test('rejects FREE as a paid purchase grant', async () => {
    await expect(
      grantPurchaseEntitlement({
        ownerId: 'user-1',
        purchaseId: 'purchase-free',
        productId: 'zorgax_free',
        tier: 'FREE',
        durationDays: 30
      })
    ).rejects.toThrow('Paid purchase cannot grant the FREE entitlement tier');
  });
});
