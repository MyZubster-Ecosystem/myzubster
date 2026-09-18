const { monthStart } = require('../src/services/zorgaxAIUsageService');

describe('Zorgax Astra usage ledger', () => {
  test('uses UTC month boundary for monthly budget', () => {
    expect(monthStart(new Date('2026-09-18T12:00:00Z')).toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });
});
