const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Wallet } = require('ethers');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'wallet-marketplace-e2e-secret';
process.env.ADMIN_ACTIVITY_NOTIFICATIONS = 'false';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');
const WalletLink = require('../src/models/WalletLink');
const WalletChallenge = require('../src/models/WalletChallenge');

let replSet;
let buyer;
let seller;

function tokenFor(user) {
  return jwt.sign(
    {
      userId: String(user._id),
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function makeUser(username) {
  return User.create({
    username,
    email: `${username}@wallet-e2e.test`,
    password: 'test-password',
    role: 'user'
  });
}

async function verifyTemporaryWallet(user, wallet) {
  const token = tokenFor(user);

  const challengeResponse = await request(app)
    .post('/api/wallet/challenge')
    .set('Authorization', `Bearer ${token}`)
    .send({ walletAddress: wallet.address })
    .expect(201);

  const signature = await wallet.signMessage(
    challengeResponse.body.message
  );

  const verifyResponse = await request(app)
    .post('/api/wallet/verify')
    .set('Authorization', `Bearer ${token}`)
    .send({
      challengeId: challengeResponse.body.challengeId,
      signature
    })
    .expect(200);

  expect(verifyResponse.body.state).toBe('WALLET_VERIFIED');

  return verifyResponse;
}

async function createListing(overrides = {}) {
  return MarketplaceListing.create({
    ownerId: seller._id,
    ownerUsername: seller.username,
    title: 'Wallet E2E listing',
    category: 'tools',
    price: 10,
    currency: 'EUR',
    exchangeMode: 'payment',
    stock: 5,
    status: 'active',
    ...overrides
  });
}

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 }
  });

  await mongoose.connect(replSet.getUri());

  [buyer, seller] = await Promise.all([
    makeUser('walletbuyer'),
    makeUser('walletseller')
  ]);
});

afterEach(async () => {
  await Promise.all([
    MarketplaceOrder.deleteMany({}),
    WalletChallenge.deleteMany({}),
    WalletLink.deleteMany({}),
    MarketplaceListing.deleteMany({})
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

test('verified EVM wallet signs V2 Marketplace request and creates REQUESTED order', async () => {
  const wallet = Wallet.createRandom();
  const listing = await createListing();

  await verifyTemporaryWallet(buyer, wallet);

  const challengeResponse = await request(app)
    .post('/api/marketplace/orders/challenge')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 2
    })
    .expect(201);

  expect(challengeResponse.body.payload).toMatchObject({
    schema: 'MYZUBSTER_MARKETPLACE_REQUEST_V2',
    intent: 'MARKETPLACE_REQUEST',
    listingId: String(listing._id),
    quantity: 2,
    buyerId: String(buyer._id),
    walletAddress: wallet.address.toLowerCase(),
    listingSnapshot: {
      price: 10,
      currency: 'EUR',
      exchangeMode: 'payment'
    }
  });

  const signature = await wallet.signMessage(
    challengeResponse.body.message
  );

  const orderResponse = await request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 2,
      note: 'E2E unsigned metadata',
      challengeId: challengeResponse.body.challengeId,
      signature
    })
    .expect(201);

  expect(orderResponse.body.order.status).toBe('REQUESTED');

  const order = await MarketplaceOrder.findById(
    orderResponse.body.order._id
  ).select('+walletEvidence.signature');

  expect(order).toBeTruthy();
  expect(order.status).toBe('REQUESTED');
  expect(order.walletEvidence.status).toBe('VERIFIED');
  expect(order.walletEvidence.walletAddress)
    .toBe(wallet.address.toLowerCase());

  expect(order.snapshot).toMatchObject({
    price: 10,
    currency: 'EUR',
    exchangeMode: 'payment'
  });

  const consumedChallenge = await WalletChallenge.findById(
    challengeResponse.body.challengeId
  );

  expect(consumedChallenge.usedAt).toBeTruthy();

  // REQUESTED must not reserve/decrement stock.
  const refreshedListing = await MarketplaceListing.findById(listing._id);
  expect(refreshedListing.stock).toBe(5);
});

test('same Marketplace challenge cannot be replayed', async () => {
  const wallet = Wallet.createRandom();
  const listing = await createListing();

  await verifyTemporaryWallet(buyer, wallet);

  const challengeResponse = await request(app)
    .post('/api/marketplace/orders/challenge')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 1
    })
    .expect(201);

  const signature = await wallet.signMessage(
    challengeResponse.body.message
  );

  await request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 1,
      challengeId: challengeResponse.body.challengeId,
      signature
    })
    .expect(201);

  const replay = await request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 1,
      challengeId: challengeResponse.body.challengeId,
      signature
    });

  expect([409]).toContain(replay.status);
  expect(await MarketplaceOrder.countDocuments({
    listingId: listing._id,
    buyerId: buyer._id
  })).toBe(1);
});

test('signature from another wallet is rejected', async () => {
  const wallet = Wallet.createRandom();
  const attackerWallet = Wallet.createRandom();
  const listing = await createListing();

  await verifyTemporaryWallet(buyer, wallet);

  const challengeResponse = await request(app)
    .post('/api/marketplace/orders/challenge')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 1
    })
    .expect(201);

  const badSignature = await attackerWallet.signMessage(
    challengeResponse.body.message
  );

  const response = await request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 1,
      challengeId: challengeResponse.body.challengeId,
      signature: badSignature
    })
    .expect(401);

  expect(response.body.code).toBe('MARKETPLACE_SIGNATURE_MISMATCH');
  expect(await MarketplaceOrder.countDocuments({})).toBe(0);

  const challenge = await WalletChallenge.findById(
    challengeResponse.body.challengeId
  );
  expect(challenge.usedAt).toBeFalsy();
});

test('changed listing economics require a new signed challenge', async () => {
  const wallet = Wallet.createRandom();
  const listing = await createListing();

  await verifyTemporaryWallet(buyer, wallet);

  const challengeResponse = await request(app)
    .post('/api/marketplace/orders/challenge')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 1
    })
    .expect(201);

  const signature = await wallet.signMessage(
    challengeResponse.body.message
  );

  await MarketplaceListing.updateOne(
    { _id: listing._id },
    { $set: { price: 12 } }
  );

  const response = await request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId: String(listing._id),
      quantity: 1,
      challengeId: challengeResponse.body.challengeId,
      signature
    })
    .expect(409);

  expect(response.body.code).toBe('MARKETPLACE_LISTING_CHANGED');
  expect(await MarketplaceOrder.countDocuments({})).toBe(0);

  const challenge = await WalletChallenge.findById(
    challengeResponse.body.challengeId
  );
  expect(challenge.usedAt).toBeFalsy();
});
