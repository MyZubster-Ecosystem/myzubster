'use strict';

const express = require('express');
const request = require('supertest');
const routerModule = require('../src/routes/zorgaxDigitalBusinessRoutes');

function appWith(service) {
  const app = express();
  app.use(express.json());
  app.use('/api/zorgax/digital-business', routerModule.createZorgaxDigitalBusinessRouter({
    authenticateMiddleware: (req, _res, next) => { req.userId = 'owner-1'; next(); },
    ProjectModel: {},
    service
  }));
  return app;
}

describe('Zorgax digital product metrics routes', () => {
  test('records owner-scoped measurement without accounting or payment claims', async () => {
    const recordProductMetric = jest.fn().mockResolvedValue({ event: { eventId: 'e1', projectId: 'p1', metricType: 'SALE' }, replay: false });
    const app = appWith({ recordProductMetric });
    const response = await request(app).post('/api/zorgax/digital-business/projects/p1/metrics').send({ ownerId: 'attacker', metricType: 'SALE', quantity: 1, amountMinor: 4900, currency: 'EUR', sourceReference: 'sale:1' });
    expect(response.status).toBe(201);
    expect(response.body.accountingWritePerformed).toBe(false);
    expect(response.body.paymentVerified).toBe(false);
    expect(recordProductMetric).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', projectId: 'p1' }));
  });

  test('returns metric snapshot as measurement-only data', async () => {
    const getProductMetricSnapshot = jest.fn().mockResolvedValue({ projectId: 'p1', sales: 2, accountingIntegrated: false });
    const response = await request(appWith({ getProductMetricSnapshot })).get('/api/zorgax/digital-business/projects/p1/metrics?currency=EUR');
    expect(response.status).toBe(200);
    expect(response.body.measurementOnly).toBe(true);
    expect(response.body.accountingIntegrated).toBe(false);
  });

  test('returns advisory learning report and does not predict future sales', async () => {
    const getProductLearningReport = jest.fn().mockResolvedValue({ project: { projectId: 'p1', status: 'MEASURING' }, snapshot: { sales: 3 }, report: { advisoryOnly: true } });
    const response = await request(appWith({ getProductLearningReport })).get('/api/zorgax/digital-business/projects/p1/learning');
    expect(response.status).toBe(200);
    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.predictsFutureSales).toBe(false);
  });

  test('maps metric source conflicts to 409', async () => {
    const recordProductMetric = jest.fn().mockRejectedValue(new Error('metric source reference already exists with different data'));
    const response = await request(appWith({ recordProductMetric })).post('/api/zorgax/digital-business/projects/p1/metrics').send({ metricType: 'VISIT', sourceReference: 'x' });
    expect(response.status).toBe(409);
  });
});
