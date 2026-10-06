const { actorHash, logConversionEvent } = require('./conversionFunnel');

describe('conversionFunnel', () => {
  test('hashes actor ids without logging the raw user id', () => {
    const first = actorHash('user-123');
    const second = actorHash('user-123');
    expect(first).toBe(second);
    expect(first).toHaveLength(16);
    expect(first).not.toContain('user-123');
  });

  test('emits structured zorgax funnel events', () => {
    const logger = { info: jest.fn() };
    const payload = logConversionEvent('seller_checkout_started', {
      userId: 'user-123',
      path: '/api/marketplace/seller/checkout',
      provider: 'STRIPE',
      plan: 'SELLER_MONTHLY',
      amount: 9.9,
      currency: 'EUR',
      metadata: { trialEligible: true },
      logger
    });

    expect(payload.event).toBe('seller_checkout_started');
    expect(payload.actor).toHaveLength(16);
    expect(payload.amount).toBe(9.9);
    expect(payload.trialEligible).toBe(true);
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info.mock.calls[0][0]).toBe('[zorgax-funnel]');
    expect(logger.info.mock.calls[0][1]).toContain('seller_checkout_started');
  });

  test('keeps missing amounts null instead of reporting zero revenue', () => {
    const logger = { info: jest.fn() };
    const payload = logConversionEvent('seller_checkout_succeeded', { logger });
    expect(payload.amount).toBeNull();
  });
});
