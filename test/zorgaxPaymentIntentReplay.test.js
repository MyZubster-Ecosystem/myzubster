'use strict';

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');

describe('Zorgax payment intent replay protection', () => {
  test('declares a unique sparse payment reference index', () => {
    const indexes = ZorgaxPaymentIntent.schema.indexes();
    const replayIndex = indexes.find(([fields]) => fields['settlement.paymentReference'] === 1);
    expect(replayIndex).toBeDefined();
    expect(replayIndex[1]).toEqual(expect.objectContaining({ unique: true, sparse: true }));
  });
});
