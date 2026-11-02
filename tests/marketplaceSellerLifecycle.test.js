'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'lifecycle-test-secret';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const SellerMembership = require('../src/models/SellerMembership');

let mongo;
let sellerUser;
let sellerToken;
let otherUser;
let otherToken;

function tokenFor(user) {
  return jwt.sign(
    { userId: String(user._id), username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());

  sellerUser = await User.create({
    username: 'digital-seller-verified',
    email: 'seller-digital@example.test',
    password: 'secure-test-password'
  });
  sellerToken = tokenFor(sellerUser);

  otherUser = await User.create({
    username: 'other-user',
    email: 'other@example.test',
    password: 'secure-test-password'
  });
  otherToken = tokenFor(otherUser);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}, 30000);

describe('Marketplace Seller Verified Lifecycle (login -> Seller Free -> crea annuncio -> annuncio visibile/modificabile)', () => {
  let createdListingId;

  test('Step 1: Unauthenticated user is prompted to log in before publishing', async () => {
    const unauthRes = await request(app)
      .post('/api/listings/create')
      .send({
        title: 'Unauthorized listing',
        category: 'digital_services',
        currency: 'EUR',
        price: 30
      });

    expect(unauthRes.status).toBe(401);
  });

  test('Step 2: Logged-in user activates free Seller membership (Seller Free)', async () => {
    const planRes = await request(app)
      .get('/api/marketplace/seller/plan');
    expect(planRes.status).toBe(200);
    expect(planRes.body.plan.id).toBe('SELLER_FREE');

    const meBefore = await request(app)
      .get('/api/marketplace/seller/me')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(meBefore.status).toBe(200);
    expect(meBefore.body.active).toBe(false);

    const subscribeRes = await request(app)
      .post('/api/marketplace/seller/subscribe')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({});
    expect(subscribeRes.status).toBe(201);
    expect(subscribeRes.body.success).toBe(true);
    expect(subscribeRes.body.plan.id).toBe('SELLER_FREE');

    const meAfter = await request(app)
      .get('/api/marketplace/seller/me')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(meAfter.status).toBe(200);
    expect(meAfter.body.active).toBe(true);
  });

  test('Step 3: Active Seller creates a listing in digital_services with EUR price', async () => {
    const payload = {
      title: 'Sviluppo bot open source e script API',
      category: 'digital_services',
      currency: 'EUR',
      price: 45,
      location: 'Italia / Remoto',
      description: 'Competenze digitali per script di automazione e bot verificati.'
    };

    const res = await request(app)
      .post('/api/listings/create')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.listing).toBeDefined();
    expect(res.body.listing.title).toBe(payload.title);
    expect(res.body.listing.category).toBe('digital_services');
    expect(res.body.listing.currency).toBe('EUR');
    expect(res.body.listing.price).toBe(45);
    expect(res.body.listing.id).toBeDefined();

    createdListingId = res.body.listing.id;
  });

  test('Step 4: Listing is visible in public marketplace filtered by digital_services', async () => {
    expect(createdListingId).toBeDefined();

    const publicRes = await request(app)
      .get('/api/listings?category=digital_services');

    expect(publicRes.status).toBe(200);
    expect(publicRes.body.success).toBe(true);
    expect(publicRes.body.listings.length).toBeGreaterThanOrEqual(1);

    const found = publicRes.body.listings.find(l => l.id === createdListingId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Sviluppo bot open source e script API');
    expect(found.category).toBe('digital_services');
    expect(found.price).toBe(45);
  });

  test('Step 5: Listing is visible in the seller personal listings dashboard (GET /mine)', async () => {
    expect(createdListingId).toBeDefined();

    const mineRes = await request(app)
      .get('/api/listings/mine')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(mineRes.status).toBe(200);
    expect(mineRes.body.success).toBe(true);
    expect(mineRes.body.listings.some(l => l.id === createdListingId)).toBe(true);
  });

  test('Step 6: Listing is editable by its owner (PATCH /api/listings/:id)', async () => {
    expect(createdListingId).toBeDefined();

    const patchPayload = {
      title: 'Sviluppo bot open source & script API (Aggiornato)',
      description: 'Descrizione aggiornata con dettagli su integrazioni e test.',
      price: 55,
      location: 'Remoto'
    };

    const patchRes = await request(app)
      .patch(`/api/listings/${createdListingId}`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(patchPayload);

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);
    expect(patchRes.body.listing.title).toBe(patchPayload.title);
    expect(patchRes.body.listing.description).toBe(patchPayload.description);
    expect(patchRes.body.listing.price).toBe(55);

    const getRes = await request(app)
      .get(`/api/listings/${createdListingId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.listing.title).toBe(patchPayload.title);
    expect(getRes.body.listing.price).toBe(55);
  });

  test('Step 7: Non-owner cannot modify another seller listing', async () => {
    expect(createdListingId).toBeDefined();

    const unauthorizedPatch = await request(app)
      .patch(`/api/listings/${createdListingId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hacked title' });

    expect(unauthorizedPatch.status).toBe(404);
  });

  test('Step 8: Listing with direct crypto agreement (BTC) publishes without mandatory checkout fees', async () => {
    const cryptoPayload = {
      title: 'Consulenza architettura distribuita e privacy',
      category: 'digital_services',
      currency: 'BTC',
      price: 0.002,
      location: 'Remoto',
      description: 'Accordo diretto peer-to-peer per consulenza tecnica.'
    };

    const cryptoRes = await request(app)
      .post('/api/listings/create')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(cryptoPayload);

    expect(cryptoRes.status).toBe(201);
    expect(cryptoRes.body.success).toBe(true);
    expect(cryptoRes.body.listing.currency).toBe('BTC');
    expect(cryptoRes.body.listing.price).toBe(0.002);
  });
});
