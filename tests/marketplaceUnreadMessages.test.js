const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'marketplace-unread-test-secret';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');
const MarketplaceMessage = require('../src/models/MarketplaceMessage');

let mongo;
let seller;
let buyer;
let bystander;
let sellerToken;
let buyerToken;
let bystanderToken;
let listing;
let order1;
let order2;

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

  [seller, buyer, bystander] = await Promise.all([
    User.create({
      username: 'seller_unread_test',
      email: 'seller.unread@example.test',
      password: 'password123',
      role: 'user'
    }),
    User.create({
      username: 'buyer_unread_test',
      email: 'buyer.unread@example.test',
      password: 'password123',
      role: 'user'
    }),
    User.create({
      username: 'bystander_unread_test',
      email: 'bystander.unread@example.test',
      password: 'password123',
      role: 'user'
    })
  ]);

  sellerToken = tokenFor(seller);
  buyerToken = tokenFor(buyer);
  bystanderToken = tokenFor(bystander);

  listing = await MarketplaceListing.create({
    ownerId: seller._id,
    title: 'Vintage Camera Lens 50mm',
    description: 'Manual prime lens in pristine condition with original cap',
    category: 'Elettronica',
    price: 95,
    currency: 'EUR',
    stock: 5,
    status: 'active'
  });

  order1 = await MarketplaceOrder.create({
    listingId: listing._id,
    buyerId: buyer._id,
    sellerId: seller._id,
    quantity: 1,
    status: 'REQUESTED',
    payment: { status: 'NOT_REQUIRED' },
    snapshot: {
      title: listing.title,
      price: listing.price,
      currency: listing.currency,
      exchangeMode: 'DIRECT'
    }
  });

  order2 = await MarketplaceOrder.create({
    listingId: listing._id,
    buyerId: buyer._id,
    sellerId: seller._id,
    quantity: 1,
    status: 'ACCEPTED',
    payment: { status: 'NOT_REQUIRED' },
    snapshot: {
      title: listing.title,
      price: listing.price,
      currency: listing.currency,
      exchangeMode: 'DIRECT'
    }
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('GET /api/marketplace/orders/messages/unread (Issue #1685)', () => {
  test('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .get('/api/marketplace/orders/messages/unread');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('rejects malformed auth tokens with 401', async () => {
    const res = await request(app)
      .get('/api/marketplace/orders/messages/unread')
      .set('Authorization', 'Bearer invalid-token-xyz');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('returns 0 totalUnread and empty byOrder for user with no messages', async () => {
    const res = await request(app)
      .get('/api/marketplace/orders/messages/unread')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalUnread).toBe(0);
    expect(res.body.byOrder).toEqual({});
  });

  test('tracks unread messages accurately per order and total without exposing private text', async () => {
    // Buyer sends message on order1 to Seller
    const postRes1 = await request(app)
      .post(`/api/marketplace/orders/${order1._id}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ body: 'Ciao! La lente è disponibile per ritiro a mano?' });

    expect(postRes1.status).toBe(201);
    expect(postRes1.body.success).toBe(true);
    expect(postRes1.body.message.body).toBe('Ciao! La lente è disponibile per ritiro a mano?');

    // Buyer sends second message on order1
    const postRes2 = await request(app)
      .post(`/api/marketplace/orders/${order1._id}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ body: 'Posso passare questo pomeriggio verso le 17:00.' });

    expect(postRes2.status).toBe(201);

    // Buyer sends message on order2
    const postRes3 = await request(app)
      .post(`/api/marketplace/orders/${order2._id}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ body: 'Domanda per il secondo ordine: ha la custodia?' });

    expect(postRes3.status).toBe(201);

    // Seller checks unread messages count
    const sellerUnread = await request(app)
      .get('/api/marketplace/orders/messages/unread')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(sellerUnread.status).toBe(200);
    expect(sellerUnread.body.success).toBe(true);
    expect(sellerUnread.body.totalUnread).toBe(3);
    expect(sellerUnread.body.byOrder[String(order1._id)]).toBe(2);
    expect(sellerUnread.body.byOrder[String(order2._id)]).toBe(1);

    // Data minimization: verify no personal data or message bodies leaked
    expect(sellerUnread.body.messages).toBeUndefined();
    expect(sellerUnread.body.body).toBeUndefined();
    expect(sellerUnread.body.recipientId).toBeUndefined();

    // Buyer checks unread count: should be 0 because Buyer sent them (not recipient)
    const buyerUnread = await request(app)
      .get('/api/marketplace/orders/messages/unread')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(buyerUnread.status).toBe(200);
    expect(buyerUnread.body.totalUnread).toBe(0);
    expect(buyerUnread.body.byOrder).toEqual({});
  });

  test('prevents IDOR: bystander account cannot see unread counts of others', async () => {
    const bystanderRes = await request(app)
      .get('/api/marketplace/orders/messages/unread')
      .set('Authorization', `Bearer ${bystanderToken}`);

    expect(bystanderRes.status).toBe(200);
    expect(bystanderRes.body.totalUnread).toBe(0);
    expect(bystanderRes.body.byOrder).toEqual({});
  });

  test('reading messages for order1 marks them read for recipient only and updates unread counts', async () => {
    // Seller opens conversation for order1
    const readRes = await request(app)
      .get(`/api/marketplace/orders/${order1._id}/messages`)
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.success).toBe(true);
    expect(readRes.body.messages.length).toBe(2);

    // After reading order1, seller's unread for order1 is cleared, order2 remains
    const sellerUnreadAfter = await request(app)
      .get('/api/marketplace/orders/messages/unread')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(sellerUnreadAfter.status).toBe(200);
    expect(sellerUnreadAfter.body.totalUnread).toBe(1);
    expect(sellerUnreadAfter.body.byOrder[String(order1._id)]).toBeUndefined();
    expect(sellerUnreadAfter.body.byOrder[String(order2._id)]).toBe(1);
  });

  test('seller replies to order1, incrementing buyer unread count', async () => {
    const replyRes = await request(app)
      .post(`/api/marketplace/orders/${order1._id}/messages`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ body: 'Certamente, ci vediamo alle 17:00 in piazza centrale.' });

    expect(replyRes.status).toBe(201);

    // Buyer now has 1 unread message on order1
    const buyerUnread = await request(app)
      .get('/api/marketplace/orders/messages/unread')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(buyerUnread.status).toBe(200);
    expect(buyerUnread.body.totalUnread).toBe(1);
    expect(buyerUnread.body.byOrder[String(order1._id)]).toBe(1);

    // Buyer reads conversation
    const buyerRead = await request(app)
      .get(`/api/marketplace/orders/${order1._id}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(buyerRead.status).toBe(200);
    expect(buyerRead.body.messages.length).toBe(3);

    // Buyer unread is now 0
    const buyerUnreadAfter = await request(app)
      .get('/api/marketplace/orders/messages/unread')
      .set('Authorization', `Bearer ${buyerToken}`);

    expect(buyerUnreadAfter.body.totalUnread).toBe(0);
    expect(buyerUnreadAfter.body.byOrder).toEqual({});
  });

  test('bystander cannot read or send messages in unauthorized order (403 IDOR guard)', async () => {
    const getRes = await request(app)
      .get(`/api/marketplace/orders/${order1._id}/messages`)
      .set('Authorization', `Bearer ${bystanderToken}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.success).toBe(false);

    const postRes = await request(app)
      .post(`/api/marketplace/orders/${order1._id}/messages`)
      .set('Authorization', `Bearer ${bystanderToken}`)
      .send({ body: 'Tentativo di intrusione non autorizzato' });

    expect(postRes.status).toBe(403);
    expect(postRes.body.success).toBe(false);
  });

  test('blocks sending messages on closed/rejected/cancelled orders (409)', async () => {
    const closedOrder = await MarketplaceOrder.create({
      listingId: listing._id,
      buyerId: buyer._id,
      sellerId: seller._id,
      quantity: 1,
      status: 'REJECTED',
      payment: { status: 'NOT_REQUIRED' },
      snapshot: {
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        exchangeMode: 'DIRECT'
      }
    });

    const res = await request(app)
      .post(`/api/marketplace/orders/${closedOrder._id}/messages`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ body: 'Posso ancora averla?' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('La conversazione di questo scambio è chiusa');
  });

  test('rejects empty or oversized messages (400)', async () => {
    const emptyRes = await request(app)
      .post(`/api/marketplace/orders/${order2._id}/messages`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ body: '   ' });

    expect(emptyRes.status).toBe(400);
    expect(emptyRes.body.success).toBe(false);

    const longBody = 'x'.repeat(2001);
    const longRes = await request(app)
      .post(`/api/marketplace/orders/${order2._id}/messages`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ body: longBody });

    expect(longRes.status).toBe(400);
    expect(longRes.body.success).toBe(false);
  });
});
