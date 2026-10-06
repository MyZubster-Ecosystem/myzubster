'use strict';

const { INTENT_TTL_MS } = require('../src/services/zorgaxMonetizationService');

describe('Zorgax payment intent TTL', () => {
  test('checkout quote is valid for fifteen minutes', () => {
    expect(INTENT_TTL_MS).toBe(15 * 60 * 1000);
  });
});
