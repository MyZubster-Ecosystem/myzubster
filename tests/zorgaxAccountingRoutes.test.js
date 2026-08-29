'use strict';

const express = require('express');
const request = require('supertest');
const accountingRoutes = require('../src/routes/zorgaxAccountingRoutes');

function buildApp({ role = 'admin' } = {}) {
  const authenticateMiddleware = (req, _res, next) => {
    req.userId = 'admin-1';
    req.userRole = role;
    next();
  };
  const adminMiddleware = (req, res, next) => {
    if (req.userRole !== 'admin') return res.status(403).json({ success: false, message: 'admin required' });
    return next();
  };

  const ingestionService = {
    syncConfirmedPaymentIntents: jest.fn().mockResolvedValue({
      asset: 'BTC',
      network: 'mainnet',
      confirmedIntentCount: 2,
      recognizedEntryCount: 2,
      recognitionPolicy: 'confirmed_payment_intent_explicit_v1'
    }),
    recognizeConfirmedPaymentIntent: jest.fn().mockResolvedValue({
      entryId: 'entry-1',
      type: 'REVENUE_RECOGNIZED',
      amountMinor: 25000
    })
  };
  const treasuryService = {
    getTreasurySnapshot: jest.fn().mockResolvedValue({
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      recognizedRevenueMinor: 100000,
      recognizedExpensesMinor: 20000,
      recognizedProfitMinor: 80000,
      outstandingLiabilitiesMinor: 10000,
      treasuryBalanceMinor: 80000,
      reserveMinor: 10000,
      capitalBeforeReserveMinor: 70000,
      investableCapitalMinor: 60000,
      accountingBasis: 'zorgax_economic_ledger_v1'
    })
  };
  const policyService = {
    getCapitalPolicy: jest.fn().mockReturnValue({
      reserveMinor: 10000,
      maxAllocationBps: 5000,
      policySource: 'server_configuration'
    })
  };

  const router = accountingRoutes.createZorgaxAccountingRouter({
    authenticateMiddleware,
    adminMiddleware,
    PaymentIntentModel: {},
    LedgerModel: {},
    ingestionService,
    treasuryService,
    policyService
  });

  const app = express();
  app.use(express.json());
  app.use('/api/zorgax/accounting', router);
  return { app, ingestionService, treasuryService };
}

describe('Zorgax Accounting API', () => {
  test('syncs confirmed payments through an explicit admin write action', async () => {
    const { app, ingestionService } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/accounting/sync-confirmed-payments')
      .send({ asset: 'BTC', network: 'mainnet', windowDays: 30 })
      .expect(200);

    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.accountingWritePerformed).toBe(true);
    expect(response.body.result.recognizedEntryCount).toBe(2);
    expect(ingestionService.syncConfirmedPaymentIntents).toHaveBeenCalledWith(expect.objectContaining({
      asset: 'BTC',
      network: 'mainnet',
      ecosystemOwnerId: 'myzubster-ecosystem'
    }));
  });

  test('returns a ledger-backed treasury snapshot', async () => {
    const { app, treasuryService } = buildApp();
    const response = await request(app)
      .get('/api/zorgax/accounting/treasury?asset=BTC&network=mainnet')
      .expect(200);

    expect(response.body.executionEnabled).toBe(false);
    expect(response.body.snapshot.accountingBasis).toBe('zorgax_economic_ledger_v1');
    expect(response.body.snapshot.investableCapitalMinor).toBe(60000);
    expect(treasuryService.getTreasurySnapshot).toHaveBeenCalledWith(expect.objectContaining({
      asset: 'BTC',
      network: 'mainnet',
      reserveMinor: 10000
    }));
  });

  test('recognizes one confirmed payment intent explicitly', async () => {
    const { app, ingestionService } = buildApp();
    await request(app)
      .post('/api/zorgax/accounting/recognize-payment/pi-1')
      .send({})
      .expect(200);
    expect(ingestionService.recognizeConfirmedPaymentIntent).toHaveBeenCalledWith(expect.objectContaining({
      intentId: 'pi-1'
    }));
  });

  test('keeps accounting endpoints admin-only', async () => {
    const { app } = buildApp({ role: 'user' });
    await request(app).get('/api/zorgax/accounting/treasury').expect(403);
    await request(app).post('/api/zorgax/accounting/sync-confirmed-payments').send({}).expect(403);
  });
});
