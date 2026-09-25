'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'eth-payment-intent-test-secret';

const app = require('../server');
const User = require('../src/models/User');
const SellerMembership = require('../src/models/SellerMembership');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');

let mongo;
let buyer;
let seller;
let listing;
let order;

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
    username:'eth-payment-buyer',
    email:'eth-payment-buyer@example.test',
    password:'test-password',
    evmWallet:{
      walletType:'EVM',
      provider:'metamask',
      address:'0x1111111111111111111111111111111111111111',
      chainId:11155111,
      status:'WALLET_VERIFIED',
      verifiedAt:new Date()
    }
  });

  seller = await User.create({
    username:'eth-payment-seller',
    email:'eth-payment-seller@example.test',
    password:'test-password',
    evmWallet:{
      walletType:'EVM',
      provider:'metamask',
      address:'0x2222222222222222222222222222222222222222',
      chainId:11155111,
      status:'WALLET_VERIFIED',
      verifiedAt:new Date()
    }
  });

  await SellerMembership.create({
    userId:seller._id,
    status:'ACTIVE',
    acceptedCryptoCurrencies:['ETH'],
    preferredSettlementCurrency:'ETH'
  });

  listing = await MarketplaceListing.create({
    ownerId:seller._id,
    ownerUsername:seller.username,
    title:'Sepolia ETH payment test',
    category:'services',
    price:0.01,
    currency:'ETH',
    exchangeMode:'payment',
    stock:1,
    status:'active'
  });

  order = await MarketplaceOrder.create({
    listingId:listing._id,
    buyerId:buyer._id,
    sellerId:seller._id,
    quantity:2,
    status:'ACCEPTED',
    snapshot:{
      title:listing.title,
      price:listing.price,
      currency:listing.currency,
      exchangeMode:listing.exchangeMode
    }
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('buyer creates a server-owned ETH Sepolia payment intent', async () => {
  const response = await request(app)
    .post(`/api/marketplace/orders/${order._id}/payment/eth-intent`)
    .set('Authorization', `Bearer ${tokenFor(buyer)}`)
    .send({})
    .expect(200);

  expect(response.body.data.asset).toBe('ETH');
  expect(response.body.data.network).toBe('sepolia');
  expect(response.body.data.chainId).toBe(11155111);
  expect(response.body.data.expectedSender).toBe('0x1111111111111111111111111111111111111111');
  expect(response.body.data.expectedRecipient).toBe('0x2222222222222222222222222222222222222222');
  expect(response.body.data.expectedAmountWei).toBe('20000000000000000');
  expect(response.body.data.expectedAmountEth).toBe('0.02');
  expect(response.body.data.testnet).toBe(true);

  const stored = await MarketplaceOrder.findById(order._id);
  expect(stored.payment.asset).toBe('ETH');
  expect(stored.payment.network).toBe('sepolia');
  expect(stored.payment.expectedSender).toBe(response.body.data.expectedSender);
  expect(stored.payment.expectedRecipient).toBe(response.body.data.expectedRecipient);
  expect(stored.payment.expectedAtomicAmount).toBe(response.body.data.expectedAmountWei);
  expect(stored.payment.status).toBe('AWAITING_PAYMENT');
});

test('seller cannot create a buyer payment intent but can inspect it', async () => {
  await request(app)
    .post(`/api/marketplace/orders/${order._id}/payment/eth-intent`)
    .set('Authorization', `Bearer ${tokenFor(seller)}`)
    .send({})
    .expect(403);

  const response = await request(app)
    .get(`/api/marketplace/orders/${order._id}/payment/eth-intent`)
    .set('Authorization', `Bearer ${tokenFor(seller)}`)
    .expect(200);

  expect(response.body.data.expectedRecipient).toBe('0x2222222222222222222222222222222222222222');
});

test('unpaid ETH order cannot be marked completed', async () => {
  const response = await request(app)
    .patch(`/api/marketplace/orders/${order._id}/status`)
    .set('Authorization', `Bearer ${tokenFor(seller)}`)
    .send({ status:'COMPLETED' })
    .expect(409);

  expect(response.body.code).toBe('VERIFIED_PAYMENT_REQUIRED');
});

test('checkout advertises ETH only as verified Sepolia testnet settlement', async () => {
  const options = await request(app)
    .get(`/api/marketplace/crypto/listings/${listing._id}/checkout-options`)
    .expect(200);

  const eth = options.body.methods.find(item => item.asset === 'ETH');
  expect(eth.available).toBe(true);
  expect(eth.network).toBe('sepolia');
  expect(eth.mode).toBe('DIRECT_VERIFIED_TESTNET_SETTLEMENT');

  const selected = await request(app)
    .post(`/api/marketplace/crypto/listings/${listing._id}/select-payment-method`)
    .send({ asset:'ETH' })
    .expect(200);

  expect(selected.body.chainId).toBe(11155111);
  expect(selected.body.testnet).toBe(true);
  expect(selected.body.nextStep).toBe('REQUEST_ORDER_THEN_CREATE_ETH_PAYMENT_INTENT');
});
