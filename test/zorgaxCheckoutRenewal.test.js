'use strict';

jest.mock('../src/models/PaymentIntent');
jest.mock('../src/models/ZorgaxPurchase');
jest.mock('../src/services/zorgaxQuoteService');

const PaymentIntent=require('../src/models/PaymentIntent');
const { ZorgaxPurchase }=require('../src/models/ZorgaxPurchase');
const { quotePlan }=require('../src/services/zorgaxQuoteService');
const { createCheckoutIntent }=require('../src/services/zorgaxUnifiedCheckoutService');

describe('Zorgax checkout renewal metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    quotePlan.mockResolvedValue({ cryptoAmount:'0.00014728', eurPerCoin:67219, observedAt:new Date('2026-08-31T12:00:00Z'), source:'quote-test' });
    PaymentIntent.create.mockImplementation(async document => document);
    ZorgaxPurchase.create.mockImplementation(async document => document);
  });

  test('persists server-owned renewal intent metadata', async () => {
    const intent=await createCheckoutIntent({ ownerId:'owner-1', planId:'pro', asset:'BTC', renew:true });
    expect(PaymentIntent.create).toHaveBeenCalledWith(expect.objectContaining({
      ownerId:'owner-1',
      metadata:{ zorgax:expect.objectContaining({ plan:'pro', renew:true }) }
    }));
    expect(ZorgaxPurchase.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId:'owner-1', metadata:expect.objectContaining({ renew:true }) }));
    expect(intent.renewal).toBe(true);
  });

  test('normal checkout persists renewal false', async () => {
    const intent=await createCheckoutIntent({ ownerId:'owner-1', planId:'developer', asset:'BTC', renew:false });
    expect(PaymentIntent.create).toHaveBeenCalledWith(expect.objectContaining({ metadata:{ zorgax:expect.objectContaining({ renew:false }) } }));
    expect(intent.renewal).toBe(false);
  });
});
