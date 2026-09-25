const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Wallet } = require('ethers');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'signed-marketplace-test-secret';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');
const MarketplaceWalletChallenge = require('../src/models/MarketplaceWalletChallenge');

let mongo;
let buyer;
let seller;
let wallet;

function tokenFor(user) {
  return jwt.sign({ userId:String(user._id), username:user.username, role:user.role }, process.env.JWT_SECRET, { expiresIn:'1h' });
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  wallet = Wallet.createRandom();
  buyer = await User.create({
    username:'signed-buyer',
    email:'signed-buyer@example.test',
    password:'test-password',
    evmWallet:{
      walletType:'EVM',
      provider:'metamask',
      address:wallet.address,
      chainId:1,
      status:'WALLET_VERIFIED',
      verifiedAt:new Date(),
      lastVerifiedAt:new Date()
    }
  });
  seller = await User.create({
    username:'signed-seller',
    email:'signed-seller@example.test',
    password:'test-password'
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('verified MetaMask wallet signs a canonical Marketplace request without payment', async () => {
  const listing = await MarketplaceListing.create({
    ownerId:seller._id,
    ownerUsername:seller.username,
    title:'Signed request test',
    category:'services',
    price:25,
    currency:'EUR',
    exchangeMode:'payment',
    stock:2,
    status:'active'
  });

  const challengeResponse = await request(app)
    .post('/api/marketplace/orders/challenge')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({ listingId:String(listing._id), quantity:1 })
    .expect(201);

  expect(challengeResponse.body.data.payment).toBe(false);
  expect(challengeResponse.body.data.gasRequired).toBe(false);
  expect(challengeResponse.body.data.payload.intent).toBe('MARKETPLACE_REQUEST');
  expect(challengeResponse.body.data.message).toContain('It is not a payment');

  const signature = await wallet.signMessage(challengeResponse.body.data.message);

  const created = await request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId:String(listing._id),
      quantity:1,
      walletSignature:{
        challengeId:challengeResponse.body.data.challengeId,
        signature
      }
    })
    .expect(201);

  expect(created.body.requestSigned).toBe(true);
  expect(created.body.order.walletEvidence.status).toBe('VERIFIED');
  expect(created.body.order.walletEvidence.walletAddress).toBe(wallet.address);
  expect(created.body.order.payment.status).toBe('AWAITING_PAYMENT');

  const stored = await MarketplaceOrder.findById(created.body.order._id).select('+walletEvidence.signature');
  expect(stored.walletEvidence.signature).toBe(signature);
  expect(stored.walletEvidence.payloadHash).toMatch(/^[a-f0-9]{64}$/);

  const challenge = await MarketplaceWalletChallenge.findById(challengeResponse.body.data.challengeId);
  expect(challenge.consumedAt).toBeTruthy();

  const replay = await request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({
      listingId:String(listing._id),
      quantity:1,
      walletSignature:{
        challengeId:challengeResponse.body.data.challengeId,
        signature
      }
    })
    .expect(409);

  expect(replay.body.code).toBe('MARKETPLACE_CHALLENGE_CONSUMED');
});

test('unsigned Marketplace requests remain supported and are not labelled as payments', async () => {
  const listing = await MarketplaceListing.create({
    ownerId:seller._id,
    ownerUsername:seller.username,
    title:'Unsigned request compatibility',
    category:'tools',
    price:0,
    currency:'FREE',
    exchangeMode:'gift',
    stock:1,
    status:'active'
  });

  const created = await request(app)
    .post('/api/marketplace/orders')
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({ listingId:String(listing._id), quantity:1 })
    .expect(201);

  expect(created.body.requestSigned).toBe(false);
  expect(created.body.order.walletEvidence.status).toBe('NOT_REQUIRED');
  expect(created.body.order.payment.status).toBe('AWAITING_PAYMENT');
});
