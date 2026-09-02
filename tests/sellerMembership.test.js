const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'seller-test-secret';
process.env.MARKETPLACE_SELLER_MONTHLY_EUR = '9.90';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_seller_test_secret';

delete process.env.STRIPE_SECRET_KEY;
delete process.env.STRIPE_SELLER_PRICE_ID;

const app = require('../server');
const User = require('../src/models/User');
const SellerMembership = require('../src/models/SellerMembership');

let mongo;
let seller;
let moderator;

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
  seller = await User.create({ username:'paid-seller', email:'seller-paid@example.test', password:'test-password' });
  moderator = await User.create({ username:'seller-mod', email:'seller-mod@example.test', password:'test-password', role:'moderator' });
}, 30000);

afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); }, 30000);

test('publishing requires active seller membership, then works after verified activation', async () => {
  const sellerToken = tokenFor(seller);
  const modToken = tokenFor(moderator);

  const blocked = await request(app)
    .post('/api/listings/create')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ title:'Paid seller listing', category:'tools', currency:'FREE' })
    .expect(402);
  expect(blocked.body.code).toBe('SELLER_MEMBERSHIP_REQUIRED');

  const subscribe = await request(app)
    .post('/api/marketplace/seller/subscribe')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({})
    .expect(201);
  expect(subscribe.body.membership.status).toBe('PENDING_PAYMENT');
  expect(subscribe.body.plan.amount).toBe(9.9);

  await request(app)
    .patch(`/api/marketplace/seller/moderation/${seller._id}/activate`)
    .set('Authorization', `Bearer ${modToken}`)
    .send({ paymentReference:'verified-test-payment' })
    .expect(200);

  const membership = await SellerMembership.findOne({ userId:seller._id });
  expect(membership.status).toBe('ACTIVE');
  expect(membership.paymentProvider).toBe('MANUAL');

  await request(app)
    .post('/api/listings/create')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ title:'Paid seller listing', category:'tools', currency:'FREE' })
    .expect(201);
});

test('Stripe checkout fails closed until Stripe credentials are configured', async () => {
  const sellerToken = tokenFor(seller);
  const response = await request(app)
    .post('/api/marketplace/seller/checkout')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({})
    .expect(503);
  expect(response.body.success).toBe(false);
});

test('signed Stripe subscription webhook activates Seller without moderator', async () => {
  await SellerMembership.findOneAndUpdate(
    { userId:seller._id },
    { $set:{ status:'PENDING_PAYMENT', paymentProvider:'STRIPE', priceAmount:9.9, priceCurrency:'EUR', verifiedAt:null, paymentReference:'' } },
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
