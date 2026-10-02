'use strict';

const ZorgaxPaymentIntent = require('../src/models/ZorgaxPaymentIntent');

describe('Zorgax payment intent replay protection', () => {
  test('uses the shared unique transaction index for replay protection', () => {
    const indexes = ZorgaxPaymentIntent.schema.indexes();
    const replayIndex = indexes.find(([fields]) => fields.asset === 1 && fields.network === 1 && fields.txId === 1);
    expect(replayIndex).toBeDefined();
    expect(replayIndex[1]).toEqual(expect.objectContaining({ unique: true }));
    expect(replayIndex[1].partialFilterExpression).toEqual({ txId: { $type: 'string' } });
  });
});
