'use strict';

const {
  readMonthlyCosts,
  calculateEconomics,
  createZorgaxUnitEconomicsService
} = require('../src/services/zorgaxUnitEconomicsService');

describe('Zorgax unit economics', () => {
  test('accounts for provider costs and Stripe fees', () => {
    const report = calculateEconomics({
      paidSubscriptions: [
        { plan: 'pro', asset: 'STRIPE' },
        { plan: 'developer', asset: 'BTC' }
      ],
      monthlyCosts: { openai_api: 8, vercel: 5, aruba: 2 },
      stripePercent: 2,
      stripeFixedEur: 0.25
    });

    expect(report.grossRevenueEur).toBe(39.8);
    expect(report.costsEur.providerTotal).toBe(15);
    expect(report.costsEur.estimatedStripeFees).toBe(0.45);
    expect(report.netMarginEur).toBe(24.35);
    expect(report.sustainable).toBe(true);
  });

  test('reports a loss warning', () => {
    const report = calculateEconomics({
      paidSubscriptions: [{ plan: 'pro', asset: 'STRIPE' }],
      monthlyCosts: { openai_api: 20 }
    });
    expect(report.sustainable).toBe(false);
    expect(report.warning).toMatch(/costs exceed revenue/);
  });

  test('rejects malformed provider configuration', () => {
    expect(() => readMonthlyCosts({
      ZORGAX_MONTHLY_COSTS_JSON: '{bad json'
    })).toThrow(/valid JSON/);
  });

  test('loads verified payments for an exact UTC month', async () => {
    const lean = jest.fn().mockResolvedValue([
      { plan: 'pro', asset: 'STRIPE' }
    ]);
    const find = jest.fn().mockReturnValue({ lean });
    const service = createZorgaxUnitEconomicsService({
      SubscriptionModel: { find },
      env: {
        ZORGAX_MONTHLY_COSTS_JSON: '{"openai_api":3,"vercel":2}'
      }
    });

    const report = await service.getMonthlyReport({ month: '2026-09' });
    expect(find).toHaveBeenCalledWith({
      'verification.status': 'VERIFIED',
      createdAt: {
        $gte: new Date('2026-09-01T00:00:00.000Z'),
        $lt: new Date('2026-10-01T00:00:00.000Z')
      }
    });
    expect(report.netMarginEur).toBe(4.9);
  });
});
