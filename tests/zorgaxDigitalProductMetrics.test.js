'use strict';

const service = require('../src/services/zorgaxDigitalProductMetricsService');

function metricModel(rows = []) {
  const stored = [...rows];
  return {
    findOne: jest.fn(async (query) => stored.find((row) => row.ownerId === query.ownerId && row.projectId === query.projectId && row.sourceReference === query.sourceReference) || null),
    create: jest.fn(async (row) => {
      const created = { eventId: `evt_${stored.length + 1}`, ...row };
      stored.push(created);
      return created;
    }),
    find: jest.fn(() => ({ sort: () => ({ lean: async () => stored }) }))
  };
}

describe('zorgaxDigitalProductMetricsService', () => {
  test('records idempotent product metric events', async () => {
    const MetricModel = metricModel();
    const first = await service.recordMetricEvent({ MetricModel, ownerId: 'o1', projectId: 'p1', metricType: 'VISIT', quantity: 10, sourceReference: 'analytics:day-1' });
    const replay = await service.recordMetricEvent({ MetricModel, ownerId: 'o1', projectId: 'p1', metricType: 'VISIT', quantity: 10, sourceReference: 'analytics:day-1' });
    expect(first.replay).toBe(false);
    expect(replay.replay).toBe(true);
    expect(MetricModel.create).toHaveBeenCalledTimes(1);
  });

  test('rejects reuse of source reference with different data', async () => {
    const MetricModel = metricModel([{ ownerId: 'o1', projectId: 'p1', sourceReference: 'same', metricType: 'VISIT', quantity: 1, amountMinor: null, currency: null }]);
    await expect(service.recordMetricEvent({ MetricModel, ownerId: 'o1', projectId: 'p1', metricType: 'QUALIFIED_LEAD', quantity: 1, sourceReference: 'same' })).rejects.toThrow('different data');
  });

  test('requires amount and currency for sales and refunds', async () => {
    await expect(service.recordMetricEvent({ MetricModel: metricModel(), ownerId: 'o1', projectId: 'p1', metricType: 'SALE', sourceReference: 'sale-1' })).rejects.toThrow('amountMinor');
  });

  test('builds funnel and revenue snapshot from recorded events', async () => {
    const MetricModel = metricModel([
      { metricType: 'VISIT', quantity: 100 },
      { metricType: 'QUALIFIED_LEAD', quantity: 20 },
      { metricType: 'SALE', quantity: 4, amountMinor: 20000, currency: 'EUR' },
      { metricType: 'REFUND', quantity: 1, amountMinor: 5000, currency: 'EUR' },
      { metricType: 'SUPPORT_REQUEST', quantity: 2 }
    ]);
    const snapshot = await service.getMetricSnapshot({ MetricModel, ownerId: 'o1', projectId: 'p1', currency: 'EUR' });
    expect(snapshot.conversionRateBps).toBe(400);
    expect(snapshot.leadConversionRateBps).toBe(2000);
    expect(snapshot.refundRateBps).toBe(2500);
    expect(snapshot.grossRevenueMinor).toBe(20000);
    expect(snapshot.netRevenueMinor).toBe(15000);
    expect(snapshot.accountingIntegrated).toBe(false);
  });

  test('learning remains advisory and reacts to observed support/refund signals', () => {
    const report = service.buildLearningReport({ projectId: 'p1', eventCount: 10, visits: 200, qualifiedLeads: 20, sales: 5, refunds: 1, supportRequests: 6, conversionRateBps: 250, leadConversionRateBps: 2500, refundRateBps: 2000 });
    expect(report.advisoryOnly).toBe(true);
    expect(report.predictsFutureSales).toBe(false);
    expect(report.recommendations.join(' ')).toMatch(/refund rate|Support load/);
  });
});
