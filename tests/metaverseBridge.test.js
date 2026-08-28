const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'metaverse-bridge-test-secret';

delete process.env.EVM_VERIFICATION_RPC_URL;
delete process.env.ETHEREUM_RPC_URL;

const app = require('../server');
const User = require('../src/models/User');
const MetaverseWalletLink = require('../src/models/MetaverseWalletLink');

let mongo;
let user;
let token;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  user = await User.create({ username: 'bridge-user', email: 'bridge@example.test', password: 'test-password' });
  token = jwt.sign({ userId: String(user._id), username: user.username, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('wallet link → challenge is created but portfolio remains locked until signature verification', async () => {
  const address = '0x1111111111111111111111111111111111111111';
  await request(app)
    .post('/api/metaverse/bridge/links')
    .set('Authorization', `Bearer ${token}`)
    .send({ worldId: 'decentraland', address })
    .expect(201);

  const challenge = await request(app)
    .post('/api/metaverse/bridge/links/decentraland/challenge')
    .set('Authorization', `Bearer ${token}`)
    .send({})
    .expect(200);

  expect(challenge.body.message).toContain('MyZubster wallet verification');
  expect(challenge.body.message).toContain(address);
  expect(challenge.body.signingMethod).toBe('personal_sign');

  const stored = await MetaverseWalletLink.findOne({ userId: user._id, worldId: 'decentraland' }).select('+challengeNonce +challengeExpiresAt');
  expect(stored.challengeNonce).toBeTruthy();
  expect(stored.verifiedAt).toBeNull();

  await request(app)
    .get('/api/metaverse/bridge/portfolio/decentraland')
    .set('Authorization', `Bearer ${token}`)
    .expect(403);
});

test('verification refuses to claim success when no EVM verification RPC is configured', async () => {
  await request(app)
    .post('/api/metaverse/bridge/links/decentraland/verify')
    .set('Authorization', `Bearer ${token}`)
    .send({ signature: `0x${'00'.repeat(64)}1b` })
    .expect(503);

  const stored = await MetaverseWalletLink.findOne({ userId: user._id, worldId: 'decentraland' });
  expect(stored.verifiedAt).toBeNull();
});
