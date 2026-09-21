const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../src/services/githubEcosystemVerificationService', () => ({
  verifyGitHubLinks: jest.fn()
}));

const { verifyGitHubLinks } = require('../src/services/githubEcosystemVerificationService');
const EcosystemActor = require('../src/models/EcosystemActor');
const ecosystemActorRoutes = require('../src/routes/ecosystemActorRoutes');

describe('ecosystem actor GitHub linking', () => {
  let mongo;
  const userId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    process.env.JWT_SECRET = 'ecosystem-github-test-secret';
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 30000);

  afterEach(async () => {
    jest.clearAllMocks();
    await EcosystemActor.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  function app() {
    const instance = express();
    instance.use(express.json());
    instance.use('/api/ecosystem/actors', ecosystemActorRoutes);
    return instance;
  }

  function token(id = userId, role = 'user') {
    return jwt.sign({ userId: String(id), role, username: 'tester' }, process.env.JWT_SECRET);
  }

  async function createActor() {
    return EcosystemActor.create({
      type: 'developer',
      name: 'Developer',
      slug: 'developer',
      createdBy: userId,
      updatedBy: userId
    });
  }

  test('links a verified GitHub identity and repositories', async () => {
    const actor = await createActor();
    verifyGitHubLinks.mockResolvedValueOnce({
      identity: {
        login: 'example-dev',
        githubUserId: 123,
        profileUrl: 'https://github.com/example-dev'
      },
      verifiedRepositories: [{
        fullName: 'example-dev/project',
        githubRepositoryId: 456,
        htmlUrl: 'https://github.com/example-dev/project',
        owner: 'example-dev',
        visibility: 'public'
      }]
    });

    const linked = await request(app())
      .post(`/api/ecosystem/actors/${actor.actorId}/github`)
      .set('Authorization', `Bearer ${token()}`)
      .send({ login: 'example-dev', repositories: ['example-dev/project'] });

    expect(linked.status).toBe(200);
    expect(linked.body.actor.github.verification).toMatchObject({
      verifiedLogin: 'example-dev',
      githubUserId: 123,
      profileUrl: 'https://github.com/example-dev'
    });
    expect(linked.body.actor.github.verifiedRepositories[0]).toMatchObject({
      fullName: 'example-dev/project',
      githubRepositoryId: 456
    });

    const repos = await request(app()).get(`/api/ecosystem/actors/${actor.actorId}/repositories`);
    expect(repos.status).toBe(200);
    expect(repos.body.repositories).toHaveLength(1);
  });

  test('rejects GitHub relinking by a different non-admin user', async () => {
    const actor = await createActor();
    const otherId = new mongoose.Types.ObjectId();

    const result = await request(app())
      .post(`/api/ecosystem/actors/${actor.actorId}/github`)
      .set('Authorization', `Bearer ${token(otherId)}`)
      .send({ login: 'other', repositories: [] });

    expect(result.status).toBe(403);
    expect(verifyGitHubLinks).not.toHaveBeenCalled();
  });

  test('unlinks GitHub without deleting the actor', async () => {
    const actor = await createActor();
    actor.github.login = 'example-dev';
    actor.github.repositories = ['example-dev/project'];
    actor.github.verification = {
      verifiedLogin: 'example-dev',
      githubUserId: 123,
      profileUrl: 'https://github.com/example-dev',
      verifiedAt: new Date()
    };
    actor.github.verifiedRepositories = [{
      fullName: 'example-dev/project',
      githubRepositoryId: 456,
      htmlUrl: 'https://github.com/example-dev/project',
      owner: 'example-dev',
      visibility: 'public',
      verifiedAt: new Date()
    }];
    await actor.save();

    const result = await request(app())
      .delete(`/api/ecosystem/actors/${actor.actorId}/github`)
      .set('Authorization', `Bearer ${token()}`);

    expect(result.status).toBe(200);
    expect(result.body.actor.github.repositories).toEqual([]);
    expect(result.body.actor.github.verifiedRepositories).toEqual([]);
  });
});
