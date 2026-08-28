const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'seller-test-secret';
process.env.MARKETPLACE_SELLER_MONTHLY_EUR = '9.90';

const app = require('../server');
const User = require('../src/models/User');
const SellerMembership = require('../src/models/SellerMembership');

let mongo;
let seller;
let moderator;

function tokenFor(user) {
  return jwt.sign({ userId:String(user._id), username:user.username, role:user.role }, process.env.JWT_SECRET, { expiresIn:'1h' });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  seller = await User.create({ username:'paid-seller', email:'seller-paid@example.test', password:'test-password' });
  moderator = await User.create({ username:'seller-mod', email:'seller-mod@example.test', password:'test-password', role:'moderator' });
});

afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

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

  await request(app)
    .post('/api/listings/create')
    .set('Authorization', `Bearer ${sellerToken}`)
    .send({ title:'Paid seller listing', category:'tools', currency:'FREE' })
    .expect(201);
});
