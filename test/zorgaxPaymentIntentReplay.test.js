'use strict';

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');

describe('Zorgax payment intent replay protection', () => {
  test('declares a unique transaction index for submitted payment references', () => {
    const indexes = ZorgaxPaymentIntent.schema.indexes();
    const replayIndex = indexes.find(([fields]) => fields.txId === 1 && fields.asset === 1 && fields.network === 1);
    expect(replayIndex).toBeDefined();
    expect(replayIndex[1]).toEqual(expect.objectContaining({ unique: true, partialFilterExpression: { txId: { $type: 'string' } } }));
  });
});
