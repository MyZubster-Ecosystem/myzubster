const express = require('express');
const request = require('supertest');

const {
  createPaymentRouter
} = require('../src/routes/paymentRoutes');

function createApp({
  paymentService,
  PaymentIntentModel,
  userId = 'user-123'
}) {
  const app = express();

  app.use(express.json());

  const authenticateMiddleware = (req, _res, next) => {
    req.userId = userId;
    req.userRole = 'user';
    req.username = 'tester';
    next();
  };

  app.use(
    '/api/payments',
    createPaymentRouter({
      paymentService,
      PaymentIntentModel,
      authenticateMiddleware
    })
  );

  return app;
}

describe('payment routes', () => {
  test('creates a payment intent using the authenticated user as owner', async () => {
    const paymentService = {
      createCheckout: jest.fn().mockResolvedValue({
        intent: {
          intentId: 'intent-1',
          ownerId: 'user-123',
          purpose: 'marketplace-order',
          asset: 'BTC',
          network: 'bitcoin',
          amountMinor: 5000,
          destination: 'bc1qexample',
          paymentReference: 'ref-1',
          txId: null,
          status: 'AWAITING_PAYMENT'
        },
        payment: {
          asset: 'BTC',
          network: 'bitcoin',
          amountMinor: 5000,
          destination: 'bc1qexample',
          paymentReference: 'ref-1'
        }
      })
    };

    const PaymentIntentModel = {
      findOne: jest.fn()
    };

    const app = createApp({
      paymentService,
      PaymentIntentModel
    });

    const response = await request(app)
      .post('/api/payments/intents')
      .send({
        purpose: 'marketplace-order',
        asset: 'BTC',
        network: 'bitcoin',
        amountMinor: 5000
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    expect(paymentService.createCheckout).toHaveBeenCalledWith({
      ownerId: 'user-123',
      purpose: 'marketplace-order',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 5000,
      metadata: undefined,
      ttlMs: undefined
    });
  });

  test('returns only an intent owned by the authenticated user', async () => {
    const ownedIntent = {
      intentId: 'intent-1',
      ownerId: 'user-123',
      asset: 'BTC',
      network: 'bitcoin',
      amountMinor: 5000,
      status: 'AWAITING_PAYMENT'
    };

    const PaymentIntentModel = {
      findOne: jest.fn().mockResolvedValue(ownedIntent)
    };

    const paymentService = {};

    const app = createApp({
      paymentService,
      PaymentIntentModel
    });

    const response = await request(app)
      .get('/api/payments/intents/intent-1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(PaymentIntentModel.findOne).toHaveBeenCalledWith({
      intentId: 'intent-1',
      ownerId: 'user-123'
    });
  });

  test('returns 404 when the intent is not owned by the authenticated user', async () => {
    const PaymentIntentModel = {
      findOne: jest.fn().mockResolvedValue(null)
    };

    const paymentService = {};

    const app = createApp({
      paymentService,
      PaymentIntentModel,
      userId: 'other-user'
    });

    const response = await request(app)
      .get('/api/payments/intents/intent-1');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);

    expect(PaymentIntentModel.findOne).toHaveBeenCalledWith({
      intentId: 'intent-1',
      ownerId: 'other-user'
    });
  });

  test('submits only txId for an owned intent', async () => {
    const PaymentIntentModel = {
      findOne: jest.fn().mockResolvedValue({
        intentId: 'intent-1',
        ownerId: 'user-123'
      })
    };

    const paymentService = {
      submitTransaction: jest.fn().mockResolvedValue({
        replay: false,
        intent: {
          intentId: 'intent-1',
          asset: 'BTC',
          network: 'bitcoin',
          amountMinor: 5000,
          destination: 'bc1qexample',
          paymentReference: 'ref-1',
          txId: 'a'.repeat(64),
          status: 'SUBMITTED'
        }
      })
    };

    const app = createApp({
      paymentService,
      PaymentIntentModel
    });

    const response = await request(app)
      .post('/api/payments/intents/intent-1/transactions')
      .send({
        txId: 'a'.repeat(64),
        destination: 'attacker-destination',
        paymentReference: 'attacker-reference',
        amountMinor: 1
      });

    expect(response.status).toBe(200);

    expect(paymentService.submitTransaction).toHaveBeenCalledWith({
      intentId: 'intent-1',
      txId: 'a'.repeat(64)
    });
  });

  test('verify does not accept client destination, paymentReference, or amount', async () => {
    const PaymentIntentModel = {
      findOne: jest.fn().mockResolvedValue({
        intentId: 'intent-1',
        ownerId: 'user-123'
      })
    };

    const paymentService = {
      verifyAndConfirm: jest.fn().mockResolvedValue({
        replay: false,
        intent: {
          intentId: 'intent-1',
          asset: 'BTC',
          network: 'bitcoin',
          amountMinor: 5000,
          destination: 'bc1qtrusted',
          paymentReference: 'trusted-reference',
          txId: 'a'.repeat(64),
          status: 'CONFIRMED'
        }
      })
    };

    const app = createApp({
      paymentService,
      PaymentIntentModel
    });

    const response = await request(app)
      .post('/api/payments/intents/intent-1/verify')
      .send({
        minimumConfirmations: 2,
        destination: 'attacker-destination',
        paymentReference: 'attacker-reference',
        amountMinor: 1,
        txId: 'b'.repeat(64)
      });

    expect(response.status).toBe(200);

    expect(paymentService.verifyAndConfirm).toHaveBeenCalledWith({
      intentId: 'intent-1',
      minimumConfirmations: 2
    });
  });

  test('does not submit a transaction for an unowned intent', async () => {
    const PaymentIntentModel = {
      findOne: jest.fn().mockResolvedValue(null)
    };

    const paymentService = {
      submitTransaction: jest.fn()
    };

    const app = createApp({
      paymentService,
      PaymentIntentModel
    });

    const response = await request(app)
      .post('/api/payments/intents/intent-secret/transactions')
      .send({
        txId: 'a'.repeat(64)
      });

    expect(response.status).toBe(404);
    expect(paymentService.submitTransaction).not.toHaveBeenCalled();
  });

  test('does not verify an unowned intent', async () => {
    const PaymentIntentModel = {
      findOne: jest.fn().mockResolvedValue(null)
    };

    const paymentService = {
      verifyAndConfirm: jest.fn()
    };

    const app = createApp({
      paymentService,
      PaymentIntentModel
    });

    const response = await request(app)
      .post('/api/payments/intents/intent-secret/verify')
      .send({
        minimumConfirmations: 1
      });

    expect(response.status).toBe(404);
    expect(paymentService.verifyAndConfirm).not.toHaveBeenCalled();
  });
});