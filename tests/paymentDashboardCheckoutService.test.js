'use strict';
const { validate, MIN_AMOUNT_CENTS, MAX_AMOUNT_CENTS } = require('../src/services/paymentDashboardCheckoutService');
describe('controlled Payment Dashboard Stripe checkout',()=>{
 test('accepts bounded EUR amounts',()=>{expect(validate({amountCents:500,currency:'EUR',description:'Test funding'})).toEqual({amountCents:500,currency:'eur',description:'Test funding'});});
 test('rejects amounts below minimum',()=>{expect(()=>validate({amountCents:MIN_AMOUNT_CENTS-1})).toThrow();});
 test('rejects amounts above maximum',()=>{expect(()=>validate({amountCents:MAX_AMOUNT_CENTS+1})).toThrow();});
 test('rejects unsupported currencies',()=>{expect(()=>validate({amountCents:500,currency:'usd'})).toThrow('Only EUR');});
});
