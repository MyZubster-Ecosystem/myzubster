const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'seller-test-secret';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_seller_test_secret';

delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_SELLER_PRICE_ID;

const app = require('../server');
const User = require('../src/models/User');
const SellerMembership = require('../src/models/SellerMembership');

let mongo;
let seller;

function tokenFor(user) {
  return jwt.sign({ userId:String(user._id), username:user.username, role:user.role }, process.env.JWT_SECRET, { expiresIn:'1h' });
}

function stripeSignature(payload, timestamp = Math.floor(Date.now() / 1000)) {
  const digest = crypto
    .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  seller = await User.create({ username:'free-seller', email:'seller-free@example.test', password:'test-password' });
}, 30000);

afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); }, 30000);

test('publishing is unlocked by free Seller activation with no payment method', async () => {
  const sellerToken = tokenFor(seller);

  const blocked = await request(app)
    .post('/api/listings/create')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ title:'Free seller listing', category:'tools', currency:'FREE' })
    .expect(402);
  expect(blocked.body.code).toBe('SELLER_MEMBERSHIP_REQUIRED');

  const subscribe = await request(app)
    .post('/api/marketplace/seller/subscribe')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({})
    .expect(201);

  expect(subscribe.body.membership.status).toBe('ACTIVE');
  expect(subscribe.body.membership.plan).toBe('SELLER_FREE');
  expect(subscribe.body.membership.paymentProvider).toBe('NONE');
  expect(subscribe.body.plan.amount).toBe(0);
  expect(subscribe.body.plan.paymentMethodRequired).toBe(false);
  expect(subscribe.body.plan.automaticPaidConversion).toBe(false);
  expect(subscribe.body.plan.platformCommissionPercent).toBe(2);
  expect(subscribe.body.paymentRequired).toBe(false);

  await request(app)
    .post('/api/listings/create')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ title:'Free seller listing', category:'tools', currency:'FREE' })
    .expect(201);
});

test('legacy Seller checkout is not used for initial activation', async () => {
  const sellerToken = tokenFor(seller);
  const response = await request(app)
    .post('/api/marketplace/seller/checkout')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({})
    .expect(409);

  expect(response.body.code).toBe('SELLER_CHECKOUT_NOT_REQUIRED');
  expect(response.body.paymentRequired).toBe(false);
  expect(response.body.plan.id).toBe('SELLER_FREE');
});

test('payment onboarding is requested at first real earning and commission is 2 percent', async () => {
  const sellerToken = tokenFor(seller);
  const response = await request(app)
    .post('/api/marketplace/seller/payment-readiness')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ isPaidTransaction:true, grossAmount:100 })
    .expect(200);

  expect(response.body.paymentOnboarding.required).toBe(true);
  expect(response.body.paymentOnboarding.commissionPercent).toBe(2);
  expect(response.body.commission).toBe(2);
  expect(response.body.currency).toBe('EUR');
});

test('non-paid activity does not trigger payment onboarding', async () => {
  const sellerToken = tokenFor(seller);
  const response = await request(app)
    .post('/api/marketplace/seller/payment-readiness')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ isPaidTransaction:false, payoutRequested:false })
    .expect(200);

  expect(response.body.paymentOnboarding.required).toBe(false);
  expect(response.body.paymentOnboarding.monetizationStarted).toBe(false);
  expect(response.body.commission).toBeNull();
});

test('signed legacy Stripe subscription webhook remains supported for existing paid state', async () => {
  await SellerMembership.findOneAndUpdate(
    { userId:seller._id },
    { $set:{ plan:'SELLER_MONTHLY', status:'PENDING_PAYMENT', paymentProvider:'STRIPE', priceAmount:9.9, priceCurrency:'EUR', verifiedAt:null, paymentReference:'' } },
    { new:true, upsert:true }
  );

  const currentPeriodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const event = {
    id:'evt_seller_subscription_updated_1',
    type:'customer.subscription.updated',
    data:{
      object:{
        id:'sub_seller_test_1',
        customer:'cus_seller_test_1',
        status:'active',
        start_date:Math.floor(Date.now() / 1000),
        current_period_end:currentPeriodEnd,
        metadata:{ userId:String(seller._id) },
        items:{ data:[{ price:{ id:'price_seller_test_1' } }] }
      }
    }
  };
  const payload = JSON.stringify(event);

  await request(app)
    .post('/api/marketplace/seller/webhook')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', stripeSignature(payload))
    .send(payload)
    .expect(200);

  const membership = await SellerMembership.findOne({ userId:seller._id });
  expect(membership.plan).toBe('SELLER_MONTHLY');
  expect(membership.status).toBe('ACTIVE');
  expect(membership.paymentProvider).toBe('STRIPE');
  expect(membership.stripeSubscriptionId).toBe('sub_seller_test_1');
  expect(membership.stripeCustomerId).toBe('cus_seller_test_1');
  expect(membership.stripeLastEventId).toBe(event.id);
  expect(membership.expiresAt).toBeTruthy();
});

test('Stripe webhook rejects invalid signatures', async () => {
  await request(app)
    .post('/api/marketplace/seller/webhook')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', `t=${Math.floor(Date.now() / 1000)},v1=${'0'.repeat(64)}`)
    .send(JSON.stringify({ id:'evt_invalid', type:'customer.subscription.updated', data:{ object:{} } }))
    .expect(400);
});
