const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'marketplace-e2e-qa-secret';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');
const MarketplaceMessage = require('../src/models/MarketplaceMessage');

let mongo;
let sellerA;
let buyerB;
let bystanderC;
let sellerToken;
let buyerToken;
let bystanderToken;

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
      username: 'qa_seller_a',
      email: 'qa.seller@example.test',
      password: 'password123',
      role: 'user'
    }),
    User.create({
      username: 'qa_buyer_b',
      email: 'qa.buyer@example.test',
      password: 'password123',
      role: 'user'
    }),
    User.create({
      username: 'qa_bystander_c',
      email: 'qa.bystander@example.test',
      password: 'password123',
      role: 'user'
    })
  ]);

  sellerToken = tokenFor(sellerA);
  buyerToken = tokenFor(buyerB);
  bystanderToken = tokenFor(bystanderC);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('End-to-End Marketplace QA: Orders, Chat, Notifications & Lifecycle (Issue #1686)', () => {
  let listing1;
  let listingLimited;
  let order1;

  beforeAll(async () => {
    listing1 = await MarketplaceListing.create({
      title: 'QA Free Community Book Exchange',
      description: 'Used programming handbook free for pick up',
      category: 'Libri',
      price: 0,
      currency: 'EUR',
      stock: 5,
      exchangeMode: 'gift',
      status: 'active',
      ownerId: sellerA._id,
      ownerUsername: sellerA.username
    });

    listingLimited = await MarketplaceListing.create({
      title: 'QA Single Item Widget',
      description: 'Only 1 item available to test auto-close',
      category: 'Oggetti',
      price: 15,
      currency: 'EUR',
      stock: 1,
      exchangeMode: 'payment',
      status: 'active',
      ownerId: sellerA._id,
      ownerUsername: sellerA.username
    });
  });

  describe('1. Mandatory Authentication (401 Unauthorized)', () => {
    test('POST /api/marketplace/orders rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .send({ listingId: listing1._id, quantity: 1 });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/marketplace/orders/mine rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders/mine');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('PATCH /api/marketplace/orders/:id/status rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .patch(`/api/marketplace/orders/${new mongoose.Types.ObjectId()}/status`)
        .send({ status: 'ACCEPTED' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/marketplace/orders/messages/unread rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders/messages/unread');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/marketplace/orders/:id/messages rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .get(`/api/marketplace/orders/${new mongoose.Types.ObjectId()}/messages`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/marketplace/orders/:id/messages rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post(`/api/marketplace/orders/${new mongoose.Types.ObjectId()}/messages`)
        .send({ body: 'Hello world' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Request Creation, Self-Request & Duplicate Protection', () => {
    test('rejects seller attempting to request their own listing (400)', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ listingId: listing1._id, quantity: 1 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Non puoi richiedere il tuo stesso annuncio');
    });

    test('rejects requests with quantity exceeding available stock (400)', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingLimited._id, quantity: 99 });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Quantità superiore alla disponibilità');
    });

    test('buyer successfully creates order for listing1 with status REQUESTED', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listing1._id, quantity: 1, note: 'Can we meet tomorrow?' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.status).toBe('REQUESTED');
      expect(res.body.order.snapshot.title).toBe(listing1.title);
      expect(res.body.order.snapshot.exchangeMode).toBe('gift');
      order1 = res.body.order;
    });

    test('prevents concurrent duplicate request for the same listing (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listing1._id, quantity: 1 });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Hai già una richiesta aperta');
    });
  });

  describe('3. Order Listing & Persistence Across Refreshes', () => {
    test('buyer sees order1 in /orders/mine with viewerRole: BUYER and status: REQUESTED', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders/mine')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const match = res.body.orders.find(o => String(o._id) === String(order1._id));
      expect(match).toBeDefined();
      expect(match.viewerRole).toBe('BUYER');
      expect(match.status).toBe('REQUESTED');
    });

    test('seller sees order1 in /orders/mine with viewerRole: SELLER and status: REQUESTED', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders/mine')
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const match = res.body.orders.find(o => String(o._id) === String(order1._id));
      expect(match).toBeDefined();
      expect(match.viewerRole).toBe('SELLER');
      expect(match.status).toBe('REQUESTED');
    });
  });

  describe('4. Order Lifecycle Transitions (REQUESTED -> ACCEPTED -> COMPLETED)', () => {
    test('buyer cannot force accept their own order (400 invalid transition)', async () => {
      const res = await request(app)
        .patch(`/api/marketplace/orders/${order1._id}/status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: 'ACCEPTED' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Transizione di stato non valida');
    });

    test('seller accepts order1: status updates to ACCEPTED and stock decrements', async () => {
      const stockBefore = (await MarketplaceListing.findById(listing1._id)).stock;
      const res = await request(app)
        .patch(`/api/marketplace/orders/${order1._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'ACCEPTED' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.status).toBe('ACCEPTED');
      expect(res.body.order.acceptedAt).toBeDefined();

      const stockAfter = (await MarketplaceListing.findById(listing1._id)).stock;
      expect(stockAfter).toBe(stockBefore - 1);
    });

    test('seller completes exchange: status updates to COMPLETED with completedAt timestamp', async () => {
      const res = await request(app)
        .patch(`/api/marketplace/orders/${order1._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'COMPLETED' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.order.status).toBe('COMPLETED');
      expect(res.body.order.completedAt).toBeDefined();
    });

    test('auto-closes listing when accepted order consumes all remaining stock', async () => {
      // Buyer creates order for limited listing (stock: 1)
      const createRes = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingLimited._id, quantity: 1 });
      expect(createRes.status).toBe(201);
      const limitedOrderId = createRes.body.order._id;

      // Seller accepts
      const acceptRes = await request(app)
        .patch(`/api/marketplace/orders/${limitedOrderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'ACCEPTED' });
      expect(acceptRes.status).toBe(200);

      const updatedListing = await MarketplaceListing.findById(listingLimited._id);
      expect(updatedListing.stock).toBe(0);
      expect(updatedListing.status).toBe('closed');
    });

    test('seller declines separate order (REJECTED) and records rejectedAt', async () => {
      const createRes = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listing1._id, quantity: 1 });
      const orderId = createRes.body.order._id;

      const rejectRes = await request(app)
        .patch(`/api/marketplace/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'REJECTED' });
      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.order.status).toBe('REJECTED');
      expect(rejectRes.body.order.rejectedAt).toBeDefined();
    });

    test('buyer cancels separate order (CANCELLED) and records cancelledAt', async () => {
      const createRes = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listing1._id, quantity: 1 });
      const orderId = createRes.body.order._id;

      const cancelRes = await request(app)
        .patch(`/api/marketplace/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: 'CANCELLED' });
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.order.status).toBe('CANCELLED');
      expect(cancelRes.body.order.cancelledAt).toBeDefined();
    });
  });

  describe('5. Bidirectional Chat & Unread Notifications Sync', () => {
    let activeChatOrder;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listing1._id, quantity: 1, note: 'Ready to exchange' });
      activeChatOrder = res.body.order;

      await request(app)
        .patch(`/api/marketplace/orders/${activeChatOrder._id}/status`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ status: 'ACCEPTED' });
    });

    test('seller sends message: buyer receives unread count 1, seller has 0 unread', async () => {
      const msgRes = await request(app)
        .post(`/api/marketplace/orders/${activeChatOrder._id}/messages`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ body: 'Hi Buyer! We can meet at the central station at 5pm.' });
      expect(msgRes.status).toBe(201);
      expect(msgRes.body.success).toBe(true);

      // Buyer checks unread count
      const buyerUnread = await request(app)
        .get('/api/marketplace/orders/messages/unread')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(buyerUnread.status).toBe(200);
      expect(buyerUnread.body.totalUnread).toBe(1);
      expect(buyerUnread.body.byOrder[String(activeChatOrder._id)]).toBe(1);

      // Seller checks unread count
      const sellerUnread = await request(app)
        .get('/api/marketplace/orders/messages/unread')
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(sellerUnread.status).toBe(200);
      expect(sellerUnread.body.totalUnread).toBe(0);
    });

    test('buyer opens conversation: messages marked read and unread counter resets to 0', async () => {
      const getRes = await request(app)
        .get(`/api/marketplace/orders/${activeChatOrder._id}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.messages.length).toBeGreaterThan(0);

      // Unread count is now 0
      const buyerUnread = await request(app)
        .get('/api/marketplace/orders/messages/unread')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(buyerUnread.status).toBe(200);
      expect(buyerUnread.body.totalUnread).toBe(0);
    });

    test('buyer replies: seller unread count becomes 1', async () => {
      const replyRes = await request(app)
        .post(`/api/marketplace/orders/${activeChatOrder._id}/messages`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ body: 'Perfect, see you at 5pm!' });
      expect(replyRes.status).toBe(201);

      const sellerUnread = await request(app)
        .get('/api/marketplace/orders/messages/unread')
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(sellerUnread.status).toBe(200);
      expect(sellerUnread.body.totalUnread).toBe(1);
      expect(sellerUnread.body.byOrder[String(activeChatOrder._id)]).toBe(1);
    });
  });

  describe('6. IDOR Security Guards & Bystander Isolation', () => {
    test('bystander C cannot view order1 in their /orders/mine list', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders/mine')
        .set('Authorization', `Bearer ${bystanderToken}`);
      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBe(0);
    });

    test('bystander C cannot view chat messages for order1 (403 IDOR rejection)', async () => {
      const res = await request(app)
        .get(`/api/marketplace/orders/${order1._id}/messages`)
        .set('Authorization', `Bearer ${bystanderToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Conversazione non autorizzata');
    });

    test('bystander C cannot post messages to order1 (403 IDOR rejection)', async () => {
      const res = await request(app)
        .post(`/api/marketplace/orders/${order1._id}/messages`)
        .set('Authorization', `Bearer ${bystanderToken}`)
        .send({ body: 'Malicious bystander injection' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Conversazione non autorizzata');
    });

    test('bystander C cannot modify status of order1 (403 IDOR rejection)', async () => {
      const res = await request(app)
        .patch(`/api/marketplace/orders/${order1._id}/status`)
        .set('Authorization', `Bearer ${bystanderToken}`)
        .send({ status: 'CANCELLED' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Operazione non autorizzata');
    });

    test('bystander C has 0 unread messages and cannot inspect private order counts', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders/messages/unread')
        .set('Authorization', `Bearer ${bystanderToken}`);
      expect(res.status).toBe(200);
      expect(res.body.totalUnread).toBe(0);
      expect(Object.keys(res.body.byOrder).length).toBe(0);
    });
  });

  describe('7. Closed Order Conversation Protection', () => {
    test('posting message on CANCELLED order is blocked with 409 Conflict', async () => {
      const listingCancelled = await MarketplaceListing.create({
        title: 'QA Cancelled Item',
        description: 'For testing closed conversation guards',
        category: 'Oggetti',
        price: 5,
        currency: 'EUR',
        stock: 2,
        exchangeMode: 'gift',
        status: 'active',
        ownerId: sellerA._id,
        ownerUsername: sellerA.username
      });

      const cancelRes = await request(app)
        .post('/api/marketplace/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: listingCancelled._id, quantity: 1 });
      expect(cancelRes.status).toBe(201);
      const cancelledId = cancelRes.body.order._id;

      const patchRes = await request(app)
        .patch(`/api/marketplace/orders/${cancelledId}/status`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ status: 'CANCELLED' });
      expect(patchRes.status).toBe(200);

      const msgRes = await request(app)
        .post(`/api/marketplace/orders/${cancelledId}/messages`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ body: 'Are you still interested?' });
      expect(msgRes.status).toBe(409);
      expect(msgRes.body.success).toBe(false);
      expect(msgRes.body.message).toContain('chiusa');
    });
  });

  describe('8. Reverse Proxy & Rate Limiting Header Resilience', () => {
    test('handles X-Forwarded-For headers gracefully without server crash', async () => {
      const res = await request(app)
        .get('/api/marketplace/orders/messages/unread')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('X-Forwarded-For', '203.0.113.195, 10.0.0.1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('9. Community Safety: Non-Monetary Direct Agreement Guarantee', () => {
    test('direct exchange snapshot preserves EUR currency and gift mode without payment gateway execution', async () => {
      const order = await MarketplaceOrder.findById(order1._id);
      expect(order.snapshot.currency).toBe('EUR');
      expect(order.snapshot.exchangeMode).toBe('gift');
      // Verify no automated payment transaction exists or was dispatched
      expect(order.payment?.transactionHash).toBeUndefined();
      expect(order.payment?.escrowAddress).toBeUndefined();
    });
  });
});
