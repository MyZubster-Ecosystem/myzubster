'use strict';

jest.mock('../src/models/PaymentIntent');

const PaymentIntent = require('../src/models/PaymentIntent');
const { getPaymentIntent } = require('../src/services/zorgaxUnifiedCheckoutService');

describe('Zorgax payment intent expiry', () => {
  test('marks an expired unpaid intent as EXPIRED when read', async () => {
    const intent = {
      intentId:'zorgax_expired', ownerId:'owner-1', purpose:'zorgax:pro', asset:'BTC', amountMinor:10000,
      status:'AWAITING_PAYMENT', txId:null, expiresAt:new Date(Date.now()-1000),
      metadata:{ zorgax:{ plan:'pro', priceEur:9.9, cryptoAmount:'0.00010000', destination:'bc1qdest' } },
      save:jest.fn().mockResolvedValue(undefined)
    };
    PaymentIntent.findOne.mockResolvedValue(intent);

    const result = await getPaymentIntent({ ownerId:'owner-1', intentId:'zorgax_expired' });
    expect(PaymentIntent.findOne).toHaveBeenCalledWith({ ownerId:'owner-1', intentId:'zorgax_expired', purpose:/^zorgax:/ });
    expect(intent.status).toBe('EXPIRED');
    expect(intent.save).toHaveBeenCalled();
    expect(result.settlementStatus).toBe('EXPIRED');
  });
});
