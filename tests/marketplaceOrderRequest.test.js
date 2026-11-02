const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'marketplace-test-secret';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');
const SellerMembership = require('../src/models/SellerMembership');

let mongo;
let buyer;
let seller;
let otherBuyer;

function tokenFor(user) {
  return jwt.sign({ userId: String(user._id), username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  [buyer, seller, otherBuyer] = await Promise.all([
    User.create({ username: 'buyer_test', email: 'buyer@example.com', password: 'test-password', role: 'user' }),
    User.create({ username: 'seller_test', email: 'seller@example.com', password: 'test-password', role: 'user' }),
    User.create({ username: 'other_buyer', email: 'other@example.com', password: 'test-password', role: 'user' })
  ]);

  await SellerMembership.create({
    userId: seller._id,
    plan: 'SELLER_FREE',
    status: 'ACTIVE'
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Marketplace Request / Contact Flow (Issue #1680)', () => {
  test('rejects unauthenticated request attempt with 401', async () => {
    const listing = await MarketplaceListing.create({
      ownerId: seller._id,
      ownerUsername: seller.username,
      title: 'Reparation PC 100 EUR',
      category: 'services',
      price: 100,
      currency: 'EUR',
      exchangeMode: 'payment',
      stock: 5,
      status: 'active'
    });

    const res = await request(app)
      .post('/api/marketplace/orders')
      .send({ listingId: String(listing._id), quantity: 1, note: 'Ciao vorrei info' });

    expect(res.status).toBe(401);
  });

  test('prevents seller from requesting their own listing', async () => {
    const listing = await MarketplaceListing.create({
      ownerId: seller._id,
      ownerUsername: seller.username,
      title: 'Consulting Session 100 EUR',
      category: 'services',
      price: 100,
      currency: 'EUR',
      exchangeMode: 'payment',
      stock: 2,
      status: 'active'
    });

    const res = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(seller)}`)
      .send({ listingId: String(listing._id), quantity: 1, note: 'Own test' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/stesso annuncio/i);
  });

  test('successfully creates order for 100 EUR listing preserving exact price and payment details', async () => {
    const listing = await MarketplaceListing.create({
      ownerId: seller._id,
      ownerUsername: seller.username,
      title: 'Assistenza Tecnica Elettronica Specializzata',
      category: 'electronics',
      price: 100,
      currency: 'EUR',
      exchangeMode: 'payment',
      stock: 3,
      status: 'active'
    });

    const res = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(buyer)}`)
      .send({
        listingId: String(listing._id),
        quantity: 1,
        note: 'Vorrei richiedere questo intervento da 100 EUR la prossima settimana.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.status).toBe('REQUESTED');
    expect(res.body.order.quantity).toBe(1);
    expect(res.body.order.note).toBe('Vorrei richiedere questo intervento da 100 EUR la prossima settimana.');

    // Verify snapshot preserves exact price and currency without alteration
    expect(res.body.order.snapshot.price).toBe(100);
    expect(res.body.order.snapshot.currency).toBe('EUR');
    expect(res.body.order.snapshot.title).toBe('Assistenza Tecnica Elettronica Specializzata');

    // Verify original listing price is strictly preserved
    const checkListing = await MarketplaceListing.findById(listing._id);
    expect(checkListing.price).toBe(100);
    expect(checkListing.currency).toBe('EUR');
    expect(checkListing.stock).toBe(3); // stock is reserved upon ACCEPTED, not upon initial REQUESTED
  });

  test('rejects duplicate open request from the same buyer', async () => {
    const listing = await MarketplaceListing.create({
      ownerId: seller._id,
      ownerUsername: seller.username,
      title: 'Corso Avanzato di Elettronica 100 EUR',
      category: 'services',
      price: 100,
      currency: 'EUR',
      exchangeMode: 'payment',
      stock: 10,
      status: 'active'
    });

    const first = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(buyer)}`)
      .send({ listingId: String(listing._id), quantity: 1, note: 'Prima richiesta' });
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(buyer)}`)
      .send({ listingId: String(listing._id), quantity: 1, note: 'Seconda richiesta duplicata' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.success).toBe(false);
    expect(duplicate.body.message).toMatch(/già una richiesta aperta/i);
  });

  test('allows a different buyer to request the same listing', async () => {
    const listing = await MarketplaceListing.findOne({ title: 'Corso Avanzato di Elettronica 100 EUR' });

    const other = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(otherBuyer)}`)
      .send({ listingId: String(listing._id), quantity: 1, note: 'Richiesta da altro acquirente' });

    expect(other.status).toBe(201);
    expect(other.body.success).toBe(true);
    expect(other.body.order.buyerId).toBe(String(otherBuyer._id));
  });

  test('rejects request when requested quantity exceeds available stock', async () => {
    const listing = await MarketplaceListing.create({
      ownerId: seller._id,
      ownerUsername: seller.username,
      title: 'Prototipo Esclusivo 100 EUR',
      category: 'electronics',
      price: 100,
      currency: 'EUR',
      exchangeMode: 'payment',
      stock: 1,
      status: 'active'
    });

    const res = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(buyer)}`)
      .send({ listingId: String(listing._id), quantity: 5, note: 'Vorrei 5 unità' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/superiore alla disponibilità/i);
  });
});
