const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const identityBountyRoutes = require('./identity-bounties');
const IdentityBountySubmission = require('../models/IdentityBountySubmission');

const app = express();
app.use(express.json());
app.use('/api/identity-bounties', identityBountyRoutes);

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  process.env.IDENTITY_BOUNTY_REVIEW_TOKEN = 'test-review-token';
  process.env.IDENTITY_BOUNTY_REWARD_MYZ = '100';
});

afterEach(async () => {
  await IdentityBountySubmission.deleteMany({});
});

afterAll(async () => {
  delete process.env.IDENTITY_BOUNTY_REVIEW_TOKEN;
  delete process.env.IDENTITY_BOUNTY_REWARD_MYZ;
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

function validPayload(participantKey = 'guest-test-001') {
  return {
    participantKey,
    displayName: 'Nova Verde',
    requestedMyzId: 'MYZ-NOVA',
    characterName: 'NOVA-7',
    archetype: 'explorer',
    bio: 'Explorer of public-safe environmental stories.',
    checklist: {
      confirmedOwnProfile: true,
      acceptedPublicProfileRules: true,
      acceptedNoSecrets: true,
      acceptedHumanReview: true
    }
  };
}

test('publishes the bounty definition without claiming legal identity verification', async () => {
  const response = await request(app)
    .get('/api/identity-bounties/definition')
    .expect(200);

  expect(response.body.success).toBe(true);
  expect(response.body.bounty.rewardAsset).toBe('MYZ');
  expect(response.body.bounty.identityMode).toBe('account-unverified');
  expect(response.body.verificationBoundary).toMatch(/does not verify/i);
});

test('rejects obvious secret material before storing a submission', async () => {
  const payload = validPayload();
  payload.privateKey = '-----BEGIN PRIVATE KEY-----\nnot-a-real-key';

  const response = await request(app)
    .post('/api/identity-bounties/claim')
    .send(payload)
    .expect(400);

  expect(response.body.error).toMatch(/Sensitive\/secret material/i);
  expect(await IdentityBountySubmission.countDocuments()).toBe(0);
});

test('creates a draft and requires explicit submit before review', async () => {
  const claim = await request(app)
    .post('/api/identity-bounties/claim')
    .send(validPayload())
    .expect(201);

  expect(claim.body.submission.status).toBe('draft');
  expect(claim.body.submission.reward.status).toBe('not_eligible');
  expect(claim.body.submission.identityMode).toBe('account-unverified');

  const submitted = await request(app)
    .post(`/api/identity-bounties/${claim.body.submission.id}/submit`)
    .send({ participantKey: 'guest-test-001' })
    .expect(200);

  expect(submitted.body.submission.status).toBe('review');
  expect(submitted.body.submission.reward.status).toBe('pending_review');
});

test('records MYZ only after an authorized human review decision', async () => {
  const claim = await request(app)
    .post('/api/identity-bounties/claim')
    .send(validPayload('guest-test-002'))
    .expect(201);

  const id = claim.body.submission.id;

  await request(app)
    .post(`/api/identity-bounties/${id}/submit`)
    .send({ participantKey: 'guest-test-002' })
    .expect(200);

  await request(app)
    .post(`/api/identity-bounties/${id}/review`)
    .set('x-myz-review-token', 'wrong-token')
    .send({ decision: 'approved' })
    .expect(403);

  const approved = await request(app)
    .post(`/api/identity-bounties/${id}/review`)
    .set('x-myz-review-token', 'test-review-token')
    .set('x-myz-reviewer', 'test-reviewer')
    .send({ decision: 'approved', notes: 'Public-safe profile and character accepted.' })
    .expect(200);

  expect(approved.body.submission.status).toBe('reward_recorded');
  expect(approved.body.submission.reward.status).toBe('recorded');
  expect(approved.body.submission.reward.asset).toBe('MYZ');
  expect(approved.body.submission.reward.amount).toBe(100);
  expect(approved.body.submission.reward.ledgerReference).toMatch(/^MYZ-IDB-/);
});

test('prevents a second submission for the same participant and bounty version', async () => {
  await request(app)
    .post('/api/identity-bounties/claim')
    .send(validPayload('guest-test-003'))
    .expect(201);

  const duplicate = await request(app)
    .post('/api/identity-bounties/claim')
    .send(validPayload('guest-test-003'))
    .expect(409);

  expect(duplicate.body.submission).toBeDefined();
});
