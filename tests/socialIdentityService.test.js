const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'social-identity-test-secret';

const User = require('../src/models/User');
const MetaverseCharacter = require('../backend/src/models/MetaverseCharacter');
const { upsertVerifiedAccount } = require('../src/services/socialIdentityService');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), MetaverseCharacter.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test.each([
  ['google', { id: 'google-123', email: 'google@example.test', name: 'Google User' }],
  ['github', { id: 'github-123', email: 'github@example.test', name: 'GitHub User', login: 'github-user', profileUrl: 'https://github.com/github-user' }],
  ['facebook', { id: 'facebook-123', email: 'facebook@example.test', name: 'Facebook User' }]
])('verified %s identity creates account and persistent metaverse character', async (provider, profile) => {
  const result = await upsertVerifiedAccount(provider, profile);
  expect(result.token).toBeTruthy();
  expect(result.user.isVerified).toBe(true);
  expect(result.user.socialIdentities[provider].id).toBe(profile.id);
  expect(result.character.identityStatus).toBe('account-linked');
  expect(result.character.accountUserId.toString()).toBe(result.user._id.toString());
  expect(result.character.identityProviders.some(item => item.provider === provider && item.providerId === profile.id)).toBe(true);

  const second = await upsertVerifiedAccount(provider, profile);
  expect(second.user._id.toString()).toBe(result.user._id.toString());
  expect(second.character._id.toString()).toBe(result.character._id.toString());
  expect(await User.countDocuments()).toBe(1);
  expect(await MetaverseCharacter.countDocuments()).toBe(1);
});

test('new social account requires an email', async () => {
  await expect(upsertVerifiedAccount('facebook', { id: 'fb-no-email', name: 'No Email' }))
    .rejects.toThrow('email');
});

test('unsupported provider cannot create a verified identity', async () => {
  await expect(upsertVerifiedAccount('instagram', { id: 'ig-1', email: 'ig@example.test' }))
    .rejects.toThrow('Provider social non supportato');
});
