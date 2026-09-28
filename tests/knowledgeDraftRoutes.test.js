const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../src/models/KnowledgeDraft', () => ({
  find: jest.fn(), create: jest.fn(), countDocuments: jest.fn(), findOneAndUpdate: jest.fn()
}));
const KnowledgeDraft = require('../src/models/KnowledgeDraft');
const routes = require('../src/routes/knowledgeEvidenceRoutes');

const alice = new mongoose.Types.ObjectId().toString();
const bob = new mongoose.Types.ObjectId().toString();
const draftId = new mongoose.Types.ObjectId().toString();
const body = { title: 'Prove Docker', domain: 'Software', description: 'Test locali documentati', evidence: [{ label: 'Repository', url: 'https://github.com/example/repo' }] };
const app = express();
app.use(express.json());
app.use('/api/knowledge-evidence', routes);

function auth(userId) { return 'Bearer ' + jwt.sign({ userId, role: 'user' }, process.env.JWT_SECRET); }

describe('private knowledge drafts', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'knowledge-draft-test-secret';
    jest.clearAllMocks();
  });

  test('requires authentication and rejects invalid evidence URLs', async () => {
    await request(app).post('/api/knowledge-evidence/drafts').send(body).expect(401);
    await request(app).post('/api/knowledge-evidence/drafts').set('Authorization', auth(alice))
      .send({ ...body, evidence: [{ label: 'Link', url: 'javascript:alert(1)' }] }).expect(400);
    expect(KnowledgeDraft.create).not.toHaveBeenCalled();
  });

  test('creates a private draft owned by the authenticated account', async () => {
    KnowledgeDraft.countDocuments.mockResolvedValue(0);
    KnowledgeDraft.create.mockImplementation(async fields => ({ _id: draftId, ...fields }));
    const response = await request(app).post('/api/knowledge-evidence/drafts')
      .set('Authorization', auth(alice)).send({ ...body, visibility: 'public', status: 'verified', ownerId: bob }).expect(201);
    expect(response.body.draft.ownerId).toBe(alice);
    expect(KnowledgeDraft.create).toHaveBeenCalledWith(expect.objectContaining({ ownerId: alice }));
    expect(KnowledgeDraft.create.mock.calls[0][0]).not.toHaveProperty('visibility', 'public');
    expect(KnowledgeDraft.create.mock.calls[0][0]).not.toHaveProperty('status', 'verified');
  });

  test('scopes listing and editing to the authenticated account', async () => {
    KnowledgeDraft.find.mockReturnValue({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) });
    await request(app).get('/api/knowledge-evidence/drafts').set('Authorization', auth(alice)).expect(200);
    expect(KnowledgeDraft.find).toHaveBeenCalledWith({ ownerId: alice });
    KnowledgeDraft.findOneAndUpdate.mockResolvedValue(null);
    await request(app).put('/api/knowledge-evidence/drafts/' + draftId).set('Authorization', auth(bob)).send(body).expect(404);
    expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: draftId, ownerId: bob });
    expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][1]).toEqual({
      $set: expect.objectContaining({ status: 'draft', reviewRequestedAt: null })
    });
  });

  test('moves only an owner draft into private human review without publishing', async () => {
    KnowledgeDraft.findOneAndUpdate.mockResolvedValue({
      _id: draftId, ownerId: alice, ...body,
      status: 'review_requested', visibility: 'private', reviewRequestedAt: new Date()
    });
    const response = await request(app).post('/api/knowledge-evidence/drafts/' + draftId + '/review-request')
      .set('Authorization', auth(alice)).expect(200);
    expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][0]).toEqual({
      _id: draftId, ownerId: alice, status: 'draft'
    });
    expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][1].$set).toEqual({
      status: 'review_requested', reviewRequestedAt: expect.any(Date)
    });
    expect(response.body.draft.visibility).toBe('private');
    expect(response.body.publication).toBe('NOT_PERFORMED');
  });

  test('rejects invalid review requests and keeps the endpoint authenticated', async () => {
    await request(app).post('/api/knowledge-evidence/drafts/' + draftId + '/review-request').expect(401);
    await request(app).post('/api/knowledge-evidence/drafts/not-an-id/review-request')
      .set('Authorization', auth(alice)).expect(400);
  });
});
