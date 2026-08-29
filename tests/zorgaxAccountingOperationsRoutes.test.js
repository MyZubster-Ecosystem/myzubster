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
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'admin required' });
    }
    return next();
  };

  const operationsService = {
    recordExpense: jest.fn().mockResolvedValue({
      entryId: 'zel-expense-1',
      type: 'EXPENSE_RECOGNIZED',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 12000,
      sourceReference: 'expense:invoice-42'
    }),
    accrueLiability: jest.fn().mockResolvedValue({
      entryId: 'zel-liability-1',
      type: 'LIABILITY_ACCRUED',
      asset: 'BTC',
      network: 'mainnet',
      amountMinor: 30000,
      sourceReference: 'liability:accrue:hosting-q3'
    }),
    getLiabilityPosition: jest.fn().mockResolvedValue({
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC',
      network: 'mainnet',
      liabilityReference: 'hosting-q3',
      accruedMinor: 30000,
      settledMinor: 10000,
      outstandingMinor: 20000,
      entryCount: 2
    }),
    settleLiability: jest.fn().mockResolvedValue({
      replay: false,
      entry: {
        entryId: 'zel-settlement-1',
        type: 'LIABILITY_SETTLED',
        amountMinor: 10000
      },
      liability: {
        liabilityReference: 'hosting-q3',
        accruedMinor: 30000,
        settledMinor: 10000,
        outstandingMinor: 20000
      }
    })
  };

  const router = accountingRoutes.createZorgaxAccountingRouter({
    authenticateMiddleware,
    adminMiddleware,
    PaymentIntentModel: {},
    LedgerModel: {},
    ingestionService: {},
    operationsService,
    treasuryService: {},
    policyService: {}
  });

  const app = express();
  app.use(express.json());
  app.use('/api/zorgax/accounting', router);
  return { app, operationsService };
}

describe('Zorgax Accounting Operations API', () => {
  test('records an expense without executing a payment', async () => {
    const { app, operationsService } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/accounting/expenses')
      .send({
        asset: 'BTC',
        network: 'mainnet',
        amountMinor: 12000,
        expenseReference: 'invoice-42',
        description: 'Infrastructure invoice'
      })
      .expect(201);

    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.accountingWritePerformed).toBe(true);
    expect(response.body.entry.type).toBe('EXPENSE_RECOGNIZED');
    expect(operationsService.recordExpense).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'myzubster-ecosystem',
      recordedBy: 'admin-1',
      amountMinor: 12000,
      expenseReference: 'invoice-42'
    }));
  });

  test('accrues a liability as bookkeeping only', async () => {
    const { app, operationsService } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/accounting/liabilities')
      .send({
        asset: 'BTC',
        network: 'mainnet',
        amountMinor: 30000,
        liabilityReference: 'hosting-q3'
      })
      .expect(201);

    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.entry.type).toBe('LIABILITY_ACCRUED');
    expect(operationsService.accrueLiability).toHaveBeenCalledWith(expect.objectContaining({
      liabilityReference: 'hosting-q3',
      recordedBy: 'admin-1'
    }));
  });

  test('reads a scoped liability position', async () => {
    const { app, operationsService } = buildApp();
    const response = await request(app)
      .get('/api/zorgax/accounting/liabilities/hosting-q3?asset=BTC&network=mainnet')
      .expect(200);

    expect(response.body.executionEnabled).toBe(false);
    expect(response.body.liability.outstandingMinor).toBe(20000);
    expect(operationsService.getLiabilityPosition).toHaveBeenCalledWith(expect.objectContaining({
      asset: 'BTC',
      network: 'mainnet',
      liabilityReference: 'hosting-q3'
    }));
  });

  test('records an external liability settlement without moving funds', async () => {
    const { app, operationsService } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/accounting/liabilities/hosting-q3/settlements')
      .send({
        asset: 'BTC',
        network: 'mainnet',
        amountMinor: 10000,
        settlementReference: 'payment-1'
      })
      .expect(201);

    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.note).toMatch(/does not move funds/);
    expect(response.body.liability.outstandingMinor).toBe(20000);
    expect(operationsService.settleLiability).toHaveBeenCalledWith(expect.objectContaining({
      liabilityReference: 'hosting-q3',
      settlementReference: 'payment-1',
      amountMinor: 10000
    }));
  });

  test('keeps accounting writes admin-only', async () => {
    const { app } = buildApp({ role: 'user' });
    await request(app).post('/api/zorgax/accounting/expenses').send({}).expect(403);
    await request(app).post('/api/zorgax/accounting/liabilities').send({}).expect(403);
    await request(app).post('/api/zorgax/accounting/liabilities/x/settlements').send({}).expect(403);
  });
});
