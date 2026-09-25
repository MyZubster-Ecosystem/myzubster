'use strict';

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'seller-wallet-evidence-test-secret';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');

let mongo;
let buyer;
let seller;

function tokenFor(user) {
  return jwt.sign(
    { userId:String(user._id), username:user.username, role:user.role },
    process.env.JWT_SECRET,
    { expiresIn:'1h' }
  );
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  buyer = await User.create({
    username:'wallet-evidence-buyer',
    email:'wallet-evidence-buyer@example.test',
    password:'test-password'
  });
  seller = await User.create({
    username:'wallet-evidence-seller',
    email:'wallet-evidence-seller@example.test',
    password:'test-password'
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('seller receives safe verified wallet evidence without the raw signature', async () => {
  const listing = await MarketplaceListing.create({
    ownerId:seller._id,
    ownerUsername:seller.username,
    title:'Wallet evidence visibility',
    category:'services',
    price:10,
    currency:'EUR',
    exchangeMode:'payment',
    stock:1,
    status:'active'
  });

  const order = await MarketplaceOrder.create({
    listingId:listing._id,
    buyerId:buyer._id,
    sellerId:seller._id,
    quantity:1,
    snapshot:{
      title:listing.title,
      price:listing.price,
      currency:listing.currency,
      exchangeMode:listing.exchangeMode
    },
    walletEvidence:{
      status:'VERIFIED',
      walletAddress:'0x1111111111111111111111111111111111111111',
      networkFamily:'EVM',
      chainId:1,
      signature:'0xraw-signature-must-not-leave-api',
      payloadHash:'a'.repeat(64),
      requestSchema:'myzubster.marketplace-request.v1',
      signedAt:new Date(),
      verifiedAt:new Date()
    }
  });

  const response = await request(app)
    .get('/api/marketplace/orders/mine')
    .set('Authorization', `Bearer ${tokenFor(seller)}`)
    .expect(200);

  const returned = response.body.orders.find(item => String(item._id) === String(order._id));
  expect(returned.viewerRole).toBe('SELLER');
  expect(returned.walletEvidence.status).toBe('VERIFIED');
  expect(returned.walletEvidence.walletAddress).toBe('0x1111111111111111111111111111111111111111');
  expect(returned.walletEvidence.chainId).toBe(1);
  expect(returned.walletEvidence.payloadHash).toBe('a'.repeat(64));
  expect(returned.walletEvidence.signature).toBeUndefined();
  expect(returned.walletEvidence.challengeId).toBeUndefined();
});

test('seller UI distinguishes verified request intent from payment', () => {
  const page = fs.readFileSync(
    path.join(__dirname, '../frontend/src/pages/MarketplaceOpsPage.js'),
    'utf8'
  );

  expect(page).toContain('Richiesta firmata · wallet verificato');
  expect(page).toContain("order.viewerRole === 'SELLER'");
  expect(page).toContain('Wallet buyer:');
  expect(page).toContain('Payload hash:');
  expect(page).toContain("Non è un pagamento");
  expect(page).toContain("non trasferisce ETH");
  expect(page).toContain("non significa che l'ordine sia già accettato o saldato");
});
