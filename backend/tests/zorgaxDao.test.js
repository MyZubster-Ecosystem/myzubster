const request = require('supertest');
const express = require('express');

const mockProposal = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Test proposal',
  description: 'Improve the observation workflow.',
  category: 'feature',
  proposerId: 'human-1',
  status: 'active',
  quorum: 50,
  approvalThreshold: 50,
  votingStartsAt: new Date('2026-08-20T10:00:00Z'),
  votingEndsAt: new Date('2026-08-27T10:00:00Z'),
  votesFor: 0,
  votesAgainst: 0,
  votesAbstain: 0,
  totalVotingPower: 0,
  executionPayload: null,
  comments: [],
  save: jest.fn(async function save() { return this; }),
};

jest.mock('../src/models/Proposal', () => ({
  findById: jest.fn(async () => mockProposal),
}));

jest.mock('../src/models/ZorgaxDaoDecision', () => ({
  find: jest.fn(() => ({ sort: jest.fn(async () => []) })),
  findOneAndUpdate: jest.fn(async (_filter, update) => ({
    id: 'decision-1',
    entityId: 'ZORGAX-001',
    choice: update.$set.choice,
    confidence: update.$set.confidence,
    rationale: update.$set.rationale,
    risks: update.$set.risks,
    conditions: update.$set.conditions,
    binding: false,
    votingWeight: 0,
  })),
}));

const zorgaxDaoRoutes = require('../src/routes/zorgax-dao');

describe('Zorgax DAO advisory member', () => {
  let app;
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockProposal.comments = [];
    mockProposal.save.mockClear();
    app = express();
    app.use(express.json());
    app.use('/api/dao/zorgax', zorgaxDaoRoutes);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('declares Zorgax as non-binding with zero voting weight', async () => {
    const res = await request(app).get('/api/dao/zorgax/status');
    expect(res.status).toBe(200);
    expect(res.body.entityId).toBe('ZORGAX-001');
    expect(res.body.binding).toBe(false);
    expect(res.body.votingWeight).toBe(0);
  });

  it('records an audited advisory choice without casting a token vote', async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        message: {
          content: JSON.stringify({
            choice: 'for',
            confidence: 0.78,
            rationale: 'The proposal is reversible and improves evidence quality.',
            risks: ['Operational complexity'],
            conditions: ['Retain human review'],
          }),
        },
      }),
    }));

    const res = await request(app)
      .post('/api/dao/zorgax/proposals/507f1f77bcf86cd799439011/advise')
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.data.choice).toBe('for');
    expect(res.body.governance.binding).toBe(false);
    expect(res.body.governance.votingWeight).toBe(0);
    expect(res.body.governance.affectsTokenTally).toBe(false);
    expect(res.body.governance.humanRatificationRequired).toBe(true);
    expect(mockProposal.comments[0].authorId).toBe('ZORGAX-001');
    expect(mockProposal.comments[0].text).toMatch(/NON-BINDING/);
  });
});
