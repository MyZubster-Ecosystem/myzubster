const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'preview-flow-test-secret';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');
const SellerMembership = require('../src/models/SellerMembership');

let mongo;
let sellerA;
let buyerB;
let bystanderC;

function tokenFor(user) {
  return jwt.sign(
    { userId: String(user._id), username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  [sellerA, buyerB, bystanderC] = await Promise.all([
    User.create({
      username: 'seller_google_a',
      email: 'seller.a@gmail.com',
      password: 'test-password',
      role: 'user',
      socialIdentities: { google: { id: 'google-seller-a-id' } }
    }),
    User.create({
      username: 'buyer_google_b',
      email: 'buyer.b@gmail.com',
      password: 'test-password',
      role: 'user',
      socialIdentities: { google: { id: 'google-buyer-b-id' } }
    }),
    User.create({
      username: 'bystander_c',
      email: 'bystander.c@gmail.com',
      password: 'test-password',
      role: 'user'
    })
  ]);

  await SellerMembership.create({
    userId: sellerA._id,
    plan: 'SELLER_FREE',
    status: 'ACTIVE'
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Preview Acceptance Flow: Two Google Accounts Request & Status Sync (Issue #1683, PR #1682)', () => {
  let freeListing;
  let createdOrderId;

  test('Account A (Seller) publishes a free listing: "TEST MyZubster Marketplace"', async () => {
    freeListing = await MarketplaceListing.create({
      ownerId: sellerA._id,
      ownerUsername: sellerA.username,
      title: 'TEST MyZubster Marketplace',
      category: 'services',
      price: 0,
      currency: 'FREE',
      exchangeMode: 'gift',
      stock: 10,
      status: 'active'
    });

    expect(freeListing._id).toBeDefined();
    expect(freeListing.currency).toBe('FREE');
    expect(freeListing.price).toBe(0);
  });

  test('Unauthenticated visitor attempting to request receives 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/marketplace/orders')
      .send({
        listingId: String(freeListing._id),
        quantity: 1,
        note: 'Vorrei richiedere questo servizio'
      });

    expect(res.status).toBe(401);
  });

  test('Account B (Buyer) requests the listing: order is created with status REQUESTED', async () => {
    const res = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(buyerB)}`)
      .send({
        listingId: String(freeListing._id),
        quantity: 1,
        note: 'Ciao! Vorrei provare questo servizio gratuito MyZubster.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.status).toBe('REQUESTED');
    expect(res.body.order.quantity).toBe(1);
    expect(res.body.order.note).toBe('Ciao! Vorrei provare questo servizio gratuito MyZubster.');
    expect(String(res.body.order.buyerId)).toBe(String(buyerB._id));
    expect(String(res.body.order.sellerId)).toBe(String(sellerA._id));

    createdOrderId = res.body.order._id;
  });

  test('Account B (Buyer) sees the request in "Le mie richieste" (viewerRole: BUYER, status: REQUESTED)', async () => {
    const res = await request(app)
      .get('/api/marketplace/orders/mine')
      .set('Authorization', `Bearer ${tokenFor(buyerB)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.orders)).toBe(true);

    const match = res.body.orders.find(o => String(o._id) === String(createdOrderId));
    expect(match).toBeDefined();
    expect(match.viewerRole).toBe('BUYER');
    expect(match.status).toBe('REQUESTED');
    expect(match.snapshot?.title).toBe('TEST MyZubster Marketplace');
    expect(match.snapshot?.currency).toBe('FREE');
  });

  test('Account A (Seller) sees incoming request in "Richieste ricevute" (viewerRole: SELLER, status: REQUESTED)', async () => {
    const res = await request(app)
      .get('/api/marketplace/orders/mine')
      .set('Authorization', `Bearer ${tokenFor(sellerA)}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.orders)).toBe(true);

    const match = res.body.orders.find(o => String(o._id) === String(createdOrderId));
    expect(match).toBeDefined();
    expect(match.viewerRole).toBe('SELLER');
    expect(match.status).toBe('REQUESTED');
    expect(match.note).toBe('Ciao! Vorrei provare questo servizio gratuito MyZubster.');
  });

  test('Access control: Account C (unrelated bystander) cannot see the order', async () => {
    const res = await request(app)
      .get('/api/marketplace/orders/mine')
      .set('Authorization', `Bearer ${tokenFor(bystanderC)}`);

    expect(res.status).toBe(200);
    const match = res.body.orders.find(o => String(o._id) === String(createdOrderId));
    expect(match).toBeUndefined();
  });

  test('Duplicate prevention: Account B cannot open a second concurrent request for the same listing (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(buyerB)}`)
      .send({
        listingId: String(freeListing._id),
        quantity: 1,
        note: 'Tentativo duplicato'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/richiesta aperta/i);
  });

  test('Account A (Seller) accepts the incoming request: status transitions to ACCEPTED', async () => {
    const res = await request(app)
      .patch(`/api/marketplace/orders/${createdOrderId}/status`)
      .set('Authorization', `Bearer ${tokenFor(sellerA)}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('ACCEPTED');
  });

  test('After page reload: both Account A and Account B see consistent ACCEPTED state', async () => {
    // Seller reload check
    const sellerRes = await request(app)
      .get('/api/marketplace/orders/mine')
      .set('Authorization', `Bearer ${tokenFor(sellerA)}`);
    const sellerOrder = sellerRes.body.orders.find(o => String(o._id) === String(createdOrderId));
    expect(sellerOrder.status).toBe('ACCEPTED');
    expect(sellerOrder.viewerRole).toBe('SELLER');

    // Buyer reload check
    const buyerRes = await request(app)
      .get('/api/marketplace/orders/mine')
      .set('Authorization', `Bearer ${tokenFor(buyerB)}`);
    const buyerOrder = buyerRes.body.orders.find(o => String(o._id) === String(createdOrderId));
    expect(buyerOrder.status).toBe('ACCEPTED');
    expect(buyerOrder.viewerRole).toBe('BUYER');
  });

  test('Account A (Seller) can decline (REJECTED) an incoming request on a separate order', async () => {
    // Buyer B requests a second listing
    const listing2 = await MarketplaceListing.create({
      ownerId: sellerA._id,
      ownerUsername: sellerA.username,
      title: 'Second Listing For Decline Test',
      category: 'art',
      price: 0,
      currency: 'FREE',
      exchangeMode: 'gift',
      stock: 5,
      status: 'active'
    });

    const createRes = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(buyerB)}`)
      .send({
        listingId: String(listing2._id),
        quantity: 1,
        note: 'Test decline'
      });
    expect(createRes.status).toBe(201);
    const order2Id = createRes.body.order._id;

    // Seller declines
    const declineRes = await request(app)
      .patch(`/api/marketplace/orders/${order2Id}/status`)
      .set('Authorization', `Bearer ${tokenFor(sellerA)}`)
      .send({ status: 'REJECTED' });

    expect(declineRes.status).toBe(200);
    expect(declineRes.body.order.status).toBe('REJECTED');

    // Both see consistent REJECTED state on reload
    const buyerCheck = await request(app)
      .get('/api/marketplace/orders/mine')
      .set('Authorization', `Bearer ${tokenFor(buyerB)}`);
    const found = buyerCheck.body.orders.find(o => String(o._id) === String(order2Id));
    expect(found.status).toBe('REJECTED');
  });

  test('Account B (Buyer) can cancel (CANCELLED) their own pending request', async () => {
    const listing3 = await MarketplaceListing.create({
      ownerId: sellerA._id,
      ownerUsername: sellerA.username,
      title: 'Third Listing For Buyer Cancel Test',
      category: 'knowledge',
      price: 0,
      currency: 'FREE',
      exchangeMode: 'gift',
      stock: 5,
      status: 'active'
    });

    const createRes = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${tokenFor(buyerB)}`)
      .send({
        listingId: String(listing3._id),
        quantity: 1,
        note: 'Test cancel'
      });
    expect(createRes.status).toBe(201);
    const order3Id = createRes.body.order._id;

    // Buyer cancels
    const cancelRes = await request(app)
      .patch(`/api/marketplace/orders/${order3Id}/status`)
      .set('Authorization', `Bearer ${tokenFor(buyerB)}`)
      .send({ status: 'CANCELLED' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.order.status).toBe('CANCELLED');
  });
});
