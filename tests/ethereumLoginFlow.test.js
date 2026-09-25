'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Wallet } = require('ethers');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'ethereum-login-test-secret';
process.env.MYZUBSTER_WALLET_DOMAIN = 'www.myzubster.com';
process.env.MYZUBSTER_PUBLIC_URL = 'https://www.myzubster.com';

const app = require('../server');
const User = require('../src/models/User');
const EthereumLoginChallenge = require('../src/models/EthereumLoginChallenge');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    EthereumLoginChallenge.deleteMany({})
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('verified linked wallet can sign in to the existing MyZubster account', async () => {
  const wallet = Wallet.createRandom();
  const user = await User.create({
    username:'eth-login-user',
    email:'eth-login@example.test',
    password:'test-password',
    evmWallet:{
      walletType:'EVM',
      provider:'metamask',
      address:wallet.address,
      chainId:1,
      status:'WALLET_VERIFIED',
      verifiedAt:new Date()
    }
  });

  const challenge = await request(app)
    .post('/api/auth/ethereum/challenge')
    .send({ address:wallet.address, chainId:1 })
    .expect(201);

  expect(challenge.body.data.message).toContain('www.myzubster.com wants you to sign in with your Ethereum account:');
  expect(challenge.body.data.message).toContain('Version: 1');
  expect(challenge.body.data.message).toContain('Chain ID: 1');
  expect(challenge.body.data.message).toContain('does not authorize a payment or transfer ETH');
  expect(challenge.body.data.payment).toBe(false);
  expect(challenge.body.data.gasRequired).toBe(false);

  const signature = await wallet.signMessage(challenge.body.data.message);

  const verified = await request(app)
    .post('/api/auth/ethereum/verify')
    .send({
      challengeId:challenge.body.data.challengeId,
      message:challenge.body.data.message,
      signature
    })
    .expect(200);

  expect(verified.body.data.provider).toBe('ethereum');
  expect(verified.body.data.user.wallet.address).toBe(wallet.address);
  expect(verified.body.data.token).toBeTruthy();

  const decoded = jwt.verify(verified.body.data.token, process.env.JWT_SECRET);
  expect(String(decoded.userId)).toBe(String(user._id));

  const stored = await EthereumLoginChallenge.findById(challenge.body.data.challengeId);
  expect(stored.consumedAt).toBeTruthy();

  const replay = await request(app)
    .post('/api/auth/ethereum/verify')
    .send({
      challengeId:challenge.body.data.challengeId,
      message:challenge.body.data.message,
      signature
    })
    .expect(409);

  expect(replay.body.code).toBe('ETHEREUM_LOGIN_CHALLENGE_CONSUMED');
});

test('a valid wallet signature does not silently create a new MyZubster account', async () => {
  const wallet = Wallet.createRandom();
  const challenge = await request(app)
    .post('/api/auth/ethereum/challenge')
    .send({ address:wallet.address, chainId:1 })
    .expect(201);

  const signature = await wallet.signMessage(challenge.body.data.message);
  const before = await User.countDocuments();

  const response = await request(app)
    .post('/api/auth/ethereum/verify')
    .send({
      challengeId:challenge.body.data.challengeId,
      message:challenge.body.data.message,
      signature
    })
    .expect(409);

  expect(response.body.code).toBe('ETHEREUM_WALLET_NOT_LINKED');
  expect(await User.countDocuments()).toBe(before);
});

test('a different wallet cannot use another wallet login challenge', async () => {
  const wallet = Wallet.createRandom();
  const attacker = Wallet.createRandom();

  await User.create({
    username:'eth-owner',
    email:'eth-owner@example.test',
    password:'test-password',
    evmWallet:{
      walletType:'EVM',
      provider:'metamask',
      address:wallet.address,
      chainId:1,
      status:'WALLET_VERIFIED',
      verifiedAt:new Date()
    }
  });

  const challenge = await request(app)
    .post('/api/auth/ethereum/challenge')
    .send({ address:wallet.address, chainId:1 })
    .expect(201);

  const signature = await attacker.signMessage(challenge.body.data.message);

  const response = await request(app)
    .post('/api/auth/ethereum/verify')
    .send({
      challengeId:challenge.body.data.challengeId,
      message:challenge.body.data.message,
      signature
    })
    .expect(400);

  expect(response.body.code).toBe('ETHEREUM_LOGIN_SIGNER_MISMATCH');
});
