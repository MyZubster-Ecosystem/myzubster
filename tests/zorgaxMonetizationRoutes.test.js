const express = require('express');
const request = require('supertest');

const {
  createZorgaxMonetizationRouter
} = require('../src/routes/zorgaxMonetizationRoutes');

function createApp({
  monetizationService,
  pricingService,
  creditService,
  userId = 'user-1'
}) {
  const app = express();

  app.use(express.json());

  const fakeAuth = (req, _res, next) => {
    req.userId = userId;
    req.userRole = 'user';
    req.username = 'tester';
    next();
  };

  app.use(
    '/api/zorgax/monetization',
    createZorgaxMonetizationRouter({
      monetizationService,
      pricingService,
      creditService,
      authenticateMiddleware: fakeAuth
    })
  );

  return app;
}

describe('Zorgax monetization routes', () => {
  test('lists active products', async () => {
    const pricingService = {
      listProducts: jest.fn().mockResolvedValue([
        {
          productId: 'zorgax_credits_starter',
          name: 'Zorgax Starter Credits',
          active: true
        }
      ])
    };

    const app = createApp({
      pricingService,
      creditService: {
        getBalance: jest.fn(),
        listLedger: jest.fn()
      },
      monetizationService: {}
    });

    const response = await request(app)
      .get('/api/zorgax/monetization/products')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.products).toHaveLength(1);

    expect(pricingService.listProducts).toHaveBeenCalledWith({
      kind: null
    });
  });

  test('reads balance for authenticated user only', async () => {
    const creditService = {
      getBalance: jest.fn().mockResolvedValue({
        ownerId: 'user-1',
        balanceCredits: 10000,
        totalPurchasedCredits: 10000,
        totalConsumedCredits: 0
      }),

      listLedger: jest.fn()
    };

    const app = createApp({
      pricingService: {
        listProducts: jest.fn()
      },
      creditService,
      monetizationService: {}
    });

    const response = await request(app)
      .get('/api/zorgax/monetization/balance')
      .expect(200);

    expect(
      creditService.getBalance
    ).toHaveBeenCalledWith('user-1');

    expect(response.body.balance.balanceCredits).toBe(
      10000
    );
  });

  test('reads ledger scoped to authenticated user', async () => {
    const creditService = {
      getBalance: jest.fn(),

      listLedger: jest.fn().mockResolvedValue([
        {
          ownerId: 'user-1',
          type: 'PURCHASE',
          amountCredits: 10000
        }
      ])
    };

    const app = createApp({
      pricingService: {
        listProducts: jest.fn()
      },
      creditService,
      monetizationService: {}
    });

    const response = await request(app)
      .get('/api/zorgax/monetization/ledger?limit=25')
      .expect(200);

    expect(
      creditService.listLedger
    ).toHaveBeenCalledWith({
      ownerId: 'user-1',
      limit: 25,
      before: null
    });

    expect(response.body.entries).toHaveLength(1);
  });

  test('checkout derives owner from authenticated user', async () => {
    const monetizationService = {
      createCheckout: jest.fn().mockResolvedValue({
        purchase: {
          purchaseId: 'purchase-1',
          ownerId: 'user-1',
          productId: 'zorgax_credits_starter'
        },

        checkout: {
          intent: {
            intentId: 'intent-1'
          }
        }
      })
    };

    const app = createApp({
      pricingService: {
        listProducts: jest.fn()
      },
      creditService: {
        getBalance: jest.fn(),
        listLedger: jest.fn()
      },
      monetizationService
    });

    const response = await request(app)
      .post('/api/zorgax/monetization/checkout')
      .send({
        ownerId: 'attacker-controlled-owner',
        productId: 'zorgax_credits_starter',
        metadata: {
          source: 'test'
        }
      })
      .expect(201);

    expect(
      monetizationService.createCheckout
    ).toHaveBeenCalledWith({
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter',
      metadata: {
        source: 'test'
      }
    });

    expect(response.body.purchase.ownerId).toBe(
      'user-1'
    );
  });

  test('gets purchase using authenticated ownership', async () => {
    const purchase = {
      purchaseId: 'purchase-1',
      ownerId: 'user-1',
      productId: 'zorgax_credits_starter',
      paymentIntentId: 'intent-1',
      creditsGranted: 10000,
      payment: {
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 2500
      },
      status: 'PENDING',
      creditedAt: null,
      metadata: {}
    };

    const monetizationService = {
      getPurchase: jest.fn().mockResolvedValue(
        purchase
      )
    };

    const app = createApp({
      pricingService: {
        listProducts: jest.fn()
      },
      creditService: {
        getBalance: jest.fn(),
        listLedger: jest.fn()
      },
      monetizationService
    });

    const response = await request(app)
      .get(
        '/api/zorgax/monetization/purchases/purchase-1'
      )
      .expect(200);

    expect(
      monetizationService.getPurchase
    ).toHaveBeenCalledWith({
      ownerId: 'user-1',
      purchaseId: 'purchase-1'
    });

    expect(response.body.purchase.purchaseId).toBe(
      'purchase-1'
    );
  });

  test('settles purchase using authenticated ownership', async () => {
    const monetizationService = {
      settlePurchase: jest.fn().mockResolvedValue({
        purchase: {
          purchaseId: 'purchase-1',
          ownerId: 'user-1',
          status: 'CREDITED'
        },

        paymentIntent: {
          intentId: 'intent-1',
          status: 'CONFIRMED'
        },

        credit: {
          replay: false,
          balanceCredits: 10000
        }
      })
    };

    const app = createApp({
      pricingService: {
        listProducts: jest.fn()
      },
      creditService: {
        getBalance: jest.fn(),
        listLedger: jest.fn()
      },
      monetizationService
    });

    const response = await request(app)
      .post(
        '/api/zorgax/monetization/purchases/purchase-1/settle'
      )
      .send({
        ownerId: 'attacker',
        minimumConfirmations: 1
      })
      .expect(200);

    expect(
      monetizationService.settlePurchase
    ).toHaveBeenCalledWith({
      ownerId: 'user-1',
      purchaseId: 'purchase-1',
      minimumConfirmations: 1
    });

    expect(response.body.purchase.status).toBe(
      'CREDITED'
    );

    expect(response.body.credit.balanceCredits).toBe(
      10000
    );
  });

  test('rejects invalid minimum confirmations', async () => {
    const monetizationService = {
      settlePurchase: jest.fn()
    };

    const app = createApp({
      pricingService: {
        listProducts: jest.fn()
      },
      creditService: {
        getBalance: jest.fn(),
        listLedger: jest.fn()
      },
      monetizationService
    });

    const response = await request(app)
      .post(
        '/api/zorgax/monetization/purchases/purchase-1/settle'
      )
      .send({
        minimumConfirmations: -1
      })
      .expect(400);

    expect(response.body.success).toBe(false);

    expect(
      monetizationService.settlePurchase
    ).not.toHaveBeenCalled();
  });

  test('maps missing purchase to 404', async () => {
    const monetizationService = {
      getPurchase: jest
        .fn()
        .mockRejectedValue(
          new Error('Zorgax purchase not found')
        )
    };

    const app = createApp({
      pricingService: {
        listProducts: jest.fn()
      },
      creditService: {
        getBalance: jest.fn(),
        listLedger: jest.fn()
      },
      monetizationService
    });

    const response = await request(app)
      .get(
        '/api/zorgax/monetization/purchases/unknown'
      )
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  test('does not expose a public credit consumption route', async () => {
    const app = createApp({
      pricingService: {
        listProducts: jest.fn()
      },
      creditService: {
        getBalance: jest.fn(),
        listLedger: jest.fn()
      },
      monetizationService: {}
    });

    await request(app)
      .post('/api/zorgax/monetization/consume')
      .send({
        credits: 1,
        usageReference: 'fake-usage'
      })
      .expect(404);
  });
});