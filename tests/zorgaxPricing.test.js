const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const ZorgaxProduct = require('../src/models/ZorgaxProduct');

const {
  getProduct,
  listProducts,
  resolvePurchase,
  resolveUsage
} = require('../src/services/zorgaxPricingService');

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await ZorgaxProduct.syncIndexes();
});

afterEach(async () => {
  await ZorgaxProduct.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

async function createProduct(overrides = {}) {
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
    },

    ...overrides
  });
}

describe('Zorgax pricing service', () => {
  test('loads an active product by server-side product id', async () => {
    await createProduct();

    const product = await getProduct(
      'zorgax_credits_starter'
    );

    expect(product.productId).toBe(
      'zorgax_credits_starter'
    );

    expect(product.pricing.amountMinor).toBe(2500);
    expect(product.creditsGranted).toBe(10000);
  });

  test('rejects inactive products', async () => {
    await createProduct({
      active: false
    });

    await expect(
      getProduct('zorgax_credits_starter')
    ).rejects.toThrow(
      'Zorgax product not found or inactive'
    );
  });

  test('lists active products only', async () => {
    await createProduct();

    await createProduct({
      productId: 'zorgax_research',
      name: 'Zorgax Research',
      kind: 'RESEARCH',
      creditsGranted: 0,
      pricing: {
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 1000
      },
      usage: {
        unit: 'RESEARCH_JOB',
        creditsPerUnit: 250
      }
    });

    await createProduct({
      productId: 'zorgax_disabled',
      name: 'Disabled Product',
      active: false
    });

    const products = await listProducts();

    expect(products).toHaveLength(2);

    expect(
      products.map((product) => product.productId)
    ).toEqual(
      expect.arrayContaining([
        'zorgax_credits_starter',
        'zorgax_research'
      ])
    );
  });

  test('resolves purchase price and credits from persisted product', async () => {
    await createProduct();

    const purchase = await resolvePurchase(
      'zorgax_credits_starter'
    );

    expect(purchase).toMatchObject({
      productId: 'zorgax_credits_starter',
      purpose: 'zorgax:zorgax_credits_starter',
      creditsGranted: 10000,

      payment: {
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 2500
      }
    });
  });

  test('rejects purchase product with no granted credits', async () => {
    await createProduct({
      productId: 'zorgax_research',
      name: 'Zorgax Research',
      kind: 'RESEARCH',
      creditsGranted: 0,
      usage: {
        unit: 'RESEARCH_JOB',
        creditsPerUnit: 250
      }
    });

    await expect(
      resolvePurchase('zorgax_research')
    ).rejects.toThrow(
      'Product does not grant purchasable Zorgax credits'
    );
  });

  test('resolves usage cost from persisted product', async () => {
    await createProduct({
      productId: 'zorgax_research',
      name: 'Zorgax Research',
      kind: 'RESEARCH',
      creditsGranted: 0,
      usage: {
        unit: 'RESEARCH_JOB',
        creditsPerUnit: 250
      }
    });

    const usage = await resolveUsage(
      'zorgax_research',
      3
    );

    expect(usage).toEqual({
      productId: 'zorgax_research',
      unit: 'RESEARCH_JOB',
      units: 3,
      creditsPerUnit: 250,
      credits: 750
    });
  });

  test('rejects invalid usage units', async () => {
    await createProduct({
      productId: 'zorgax_research',
      name: 'Zorgax Research',
      kind: 'RESEARCH',
      creditsGranted: 0,
      usage: {
        unit: 'RESEARCH_JOB',
        creditsPerUnit: 250
      }
    });

    await expect(
      resolveUsage('zorgax_research', 0)
    ).rejects.toThrow(
      'units must be a positive safe integer'
    );
  });

  test('rejects products without billable usage', async () => {
    await createProduct();

    await expect(
      resolveUsage('zorgax_credits_starter', 1)
    ).rejects.toThrow(
      'Product does not define billable Zorgax usage'
    );
  });
});