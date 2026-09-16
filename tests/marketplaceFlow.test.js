const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Wallet } = require('ethers');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'marketplace-test-secret';
process.env.ADMIN_ACTIVITY_NOTIFICATIONS = 'false';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');
const MarketplaceReview = require('../src/models/MarketplaceReview');
const WalletLink = require('../src/models/WalletLink');
const WalletChallenge = require('../src/models/WalletChallenge');

let mongo;
let buyer;
let seller;
let reporter;
let moderator;
let buyerWallet;

function tokenFor(user) {
  return jwt.sign({ userId: String(user._id), username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function makeUser(username, role = 'user') {
  return User.create({ username, email: `${username}@example.test`, password: 'test-password', role });
}

async function verifyWalletFor(user, wallet) {
  const token = tokenFor(user);

  const challenge = await request(app)
    .post('/api/wallet/challenge')
    .set('Authorization', `Bearer ${token}`)
    .send({ walletAddress: wallet.address })
    .expect(201);

  const signature = await wallet.signMessage(challenge.body.message);

  await request(app)
    .post('/api/wallet/verify')
    .set('Authorization', `Bearer ${token}`)
    .send({
      challengeId: challenge.body.challengeId,
      signature
    })
    .expect(200);
}

async function createSignedRequest(user, wallet, listing, quantity = 1, note) {
  const token = tokenFor(user);

  const challenge = await request(app)
    .post('/api/marketplace/orders/challenge')
    .set('Authorization', `Bearer ${token}`)
    .send({
      listingId: String(listing._id),
      quantity
    })
    .expect(201);

  const signature = await wallet.signMessage(challenge.body.message);

  return request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      listingId: String(listing._id),
      quantity,
      ...(note ? { note } : {}),
      challengeId: challenge.body.challengeId,
      signature
    })
    .expect(201);
}

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({
    replSet: { count: 1 }
  });
  await mongoose.connect(mongo.getUri());
  [buyer, seller, reporter, moderator] = await Promise.all([
    makeUser('buyer'),
    makeUser('seller'),
    makeUser('reporter'),
    makeUser('moderator', 'moderator')
  ]);

  buyerWallet = Wallet.createRandom();
  await verifyWalletFor(buyer, buyerWallet);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('listing → request → accept reserves stock → complete → review → report → moderation', async () => {
  const listing = await MarketplaceListing.create({
    ownerId: seller._id,
    ownerUsername: seller.username,
    title: 'Test tools exchange',
    category: 'tools',
    price: 0,
    currency: 'FREE',
    exchangeMode: 'gift',
    stock: 2,
    status: 'active'
  });

  const requested = await createSignedRequest(
    buyer,
    buyerWallet,
    listing,
    1,
    'test request'
  );

  const orderId = requested.body.order._id;

  await request(app)
    .patch(`/api/marketplace/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${tokenFor(seller)}`)
    .send({ status: 'ACCEPTED' })
    .expect(200);

  let refreshed = await MarketplaceListing.findById(listing._id);
  expect(refreshed.stock).toBe(1);

  await request(app)
    .patch(`/api/marketplace/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${tokenFor(seller)}`)
    .send({ status: 'COMPLETED' })
    .expect(200);

  const order = await MarketplaceOrder.findById(orderId);
  expect(order.status).toBe('COMPLETED');

  await request(app)
    .post('/api/marketplace/reviews')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({ orderId, score: 5, comment: 'verified flow' })
    .expect(201);

  expect(await MarketplaceReview.countDocuments({ orderId })).toBe(1);

  const reportResponse = await request(app)
    .post('/api/marketplace/reports')
    .set('Authorization', `Bearer ${tokenFor(reporter)}`)
    .send({ listingId: String(listing._id), reason: 'spam', details: 'test moderation path' })
    .expect(201);

  await request(app)
    .patch(`/api/marketplace/moderation/reports/${reportResponse.body.reportId}`)
    .set('Authorization', `Bearer ${tokenFor(moderator)}`)
    .send({ status: 'RESOLVED', listingAction: 'pause', reviewNote: 'test decision' })
    .expect(200);

  refreshed = await MarketplaceListing.findById(listing._id);
  expect(refreshed.status).toBe('paused');
});

test('cancelling an accepted request restores reserved stock', async () => {
  const listing = await MarketplaceListing.create({
    ownerId: seller._id,
    ownerUsername: seller.username,
    title: 'Stock restore test',
    category: 'tools',
    price: 0,
    currency: 'BARTER',
    exchangeMode: 'barter',
    stock: 1,
    status: 'active'
  });

  const requested = await createSignedRequest(
    buyer,
    buyerWallet,
    listing,
    1
  );

  const orderId = requested.body.order._id;

  await request(app)
    .patch(`/api/marketplace/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${tokenFor(seller)}`)
    .send({ status: 'ACCEPTED' })
    .expect(200);

  let refreshed = await MarketplaceListing.findById(listing._id);
  expect(refreshed.stock).toBe(0);
  expect(refreshed.status).toBe('closed');

  await request(app)
    .patch(`/api/marketplace/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({ status: 'CANCELLED' })
    .expect(200);

  refreshed = await MarketplaceListing.findById(listing._id);
  expect(refreshed.stock).toBe(1);
  expect(refreshed.status).toBe('active');
});
