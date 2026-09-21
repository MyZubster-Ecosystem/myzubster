const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../src/services/githubEcosystemVerificationService', () => ({
  verifyContributionSource: jest.fn()
}));

const { verifyContributionSource } = require('../src/services/githubEcosystemVerificationService');
const EcosystemActor = require('../src/models/EcosystemActor');
const EcosystemContribution = require('../src/models/EcosystemContribution');
const routes = require('../src/routes/ecosystemContributionRoutes');

describe('ecosystem contribution graph', () => {
  let mongo;
  const ownerId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    process.env.JWT_SECRET = 'contribution-graph-test-secret';
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 30000);

  afterEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      EcosystemActor.deleteMany({}),
      EcosystemContribution.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  function app() {
    const instance = express();
    instance.use(express.json());
    instance.use('/api/ecosystem', routes);
    return instance;
  }

  function token(id = ownerId, role = 'user') {
    return jwt.sign({ userId: String(id), role, username: 'tester' }, process.env.JWT_SECRET);
  }

  async function actor(overrides = {}) {
    return EcosystemActor.create({
      type: 'developer',
      name: 'Developer',
      slug: 'developer-' + new mongoose.Types.ObjectId().toString(),
      github: {
        login: 'example-dev',
        verification: {
          verifiedLogin: 'example-dev',
          githubUserId: 123,
          profileUrl: 'https://github.com/example-dev',
          verifiedAt: new Date()
        }
      },
      createdBy: ownerId,
      updatedBy: ownerId,
      ...overrides
    });
  }

  test('registers a merged PR without claiming payment state', async () => {
    const developer = await actor();
    verifyContributionSource.mockResolvedValueOnce({
      kind: 'pull_request',
      sourceKey: 'org/repo#pr-12',
      repository: 'org/repo',
      number: 12,
      sha: 'a'.repeat(40),
      releaseTag: '',
      githubId: 12,
      nodeId: 'PR_12',
      url: 'https://github.com/org/repo/pull/12',
      title: 'Implement pilot',
      author: 'example-dev',
      sourceState: 'closed',
      merged: true
    });

    const response = await request(app())
      .post('/api/ecosystem/contributions')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        actorIds: [developer.actorId],
        projectId: 'pilot-university-community',
        title: 'Implement pilot',
        github: { kind: 'pull_request', repository: 'org/repo', number: 12 },
        evidenceRefs: ['MZ-EVIDENCE-001']
      });

    expect(response.status).toBe(201);
    expect(response.body.contribution.status).toBe('merged');
    expect(response.body.contribution.paymentStatus).toBeUndefined();
    expect(response.body.contribution.bountyStatus).toBeUndefined();
  });

  test('rejects financial claims from contribution payload', async () => {
    const developer = await actor();
    const response = await request(app())
      .post('/api/ecosystem/contributions')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        actorIds: [developer.actorId],
        projectId: 'pilot-1',
        title: 'Task',
        paid: true,
        github: { kind: 'issue', repository: 'org/repo', number: 1 }
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Contribution Graph/);
    expect(verifyContributionSource).not.toHaveBeenCalled();
  });

  test('rejects attribution to an actor owned by another user', async () => {
    const otherActor = await actor({
      createdBy: new mongoose.Types.ObjectId(),
      updatedBy: new mongoose.Types.ObjectId()
    });

    const response = await request(app())
      .post('/api/ecosystem/contributions')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        actorIds: [otherActor.actorId],
        projectId: 'pilot-1',
        title: 'Task',
        github: { kind: 'issue', repository: 'org/repo', number: 1 }
      });

    expect(response.status).toBe(403);
    expect(verifyContributionSource).not.toHaveBeenCalled();
  });

  test('builds project participants and graph edges from recorded contributions', async () => {
    const developer = await actor();
    verifyContributionSource.mockResolvedValueOnce({
      kind: 'issue',
      sourceKey: 'org/repo#issue-5',
      repository: 'org/repo',
      number: 5,
      sha: '',
      releaseTag: '',
      githubId: 5,
      nodeId: 'I_5',
      url: 'https://github.com/org/repo/issues/5',
      title: 'Research task',
      author: 'example-dev',
      sourceState: 'open',
      merged: false
    });

    await request(app())
      .post('/api/ecosystem/contributions')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        actorIds: [developer.actorId],
        projectId: 'pilot-graph',
        title: 'Research task',
        github: { kind: 'issue', repository: 'org/repo', number: 5 }
      });

    const participants = await request(app()).get('/api/ecosystem/projects/pilot-graph/participants');
    expect(participants.status).toBe(200);
    expect(participants.body.participants.map(item => item.actorId)).toContain(developer.actorId);

    const graph = await request(app()).get('/api/ecosystem/graph?projectId=pilot-graph');
    expect(graph.status).toBe(200);
    expect(graph.body.schema).toBe('myzubster.contribution-graph.v1');
    expect(graph.body.edges.some(edge => edge.relation === 'SUPPORTED_BY_GITHUB')).toBe(true);
    expect(graph.body.boundaries.githubStateIsPaymentState).toBe(false);
  });

  test('only admin can mark a contribution verified', async () => {
    const developer = await actor();
    const contribution = await EcosystemContribution.create({
      actorIds: [developer.actorId],
      projectId: 'pilot-verify',
      title: 'Review',
      status: 'opened',
      github: {
        kind: 'issue',
        sourceKey: 'org/repo#issue-1',
        repository: 'org/repo',
        number: 1,
        url: 'https://github.com/org/repo/issues/1',
        title: 'Review',
        sourceState: 'open',
        verifiedAt: new Date()
      },
      dedupeKey: EcosystemContribution.buildDedupeKey({
        actorIds: [developer.actorId],
        projectId: 'pilot-verify',
        sourceKey: 'org/repo#issue-1'
      }),
      createdBy: ownerId,
      updatedBy: ownerId
    });

    const forbidden = await request(app())
      .post(`/api/ecosystem/contributions/${contribution.contributionId}/verify`)
      .set('Authorization', `Bearer ${token()}`);
    expect(forbidden.status).toBe(403);

    const verified = await request(app())
      .post(`/api/ecosystem/contributions/${contribution.contributionId}/verify`)
      .set('Authorization', `Bearer ${token(ownerId, 'admin')}`);
    expect(verified.status).toBe(200);
    expect(verified.body.contribution.status).toBe('verified');
  });
});
