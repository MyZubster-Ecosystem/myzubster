const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../src/models/KnowledgeDraft', () => ({
  find: jest.fn(), findOne: jest.fn(), create: jest.fn(), countDocuments: jest.fn(), findOneAndUpdate: jest.fn()
}));
jest.mock('../src/models/User', () => ({ findById: jest.fn() }));
const KnowledgeDraft = require('../src/models/KnowledgeDraft');
const User = require('../src/models/User');
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
    expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: draftId, ownerId: bob, status: 'draft', visibility: 'private' });
  });

  test('publishes only on explicit confirmation and for the authenticated owner', async () => {
    await request(app).post('/api/knowledge-evidence/drafts/' + draftId + '/publish').send({ confirm: true }).expect(401);
    await request(app).post('/api/knowledge-evidence/drafts/' + draftId + '/publish').set('Authorization', auth(alice)).send({}).expect(400);
    expect(KnowledgeDraft.findOneAndUpdate).not.toHaveBeenCalled();
    User.findById.mockReturnValue({ select: () => ({ lean: async () => ({ username: 'N4K48' }) }) });
    KnowledgeDraft.findOneAndUpdate.mockResolvedValue({ _id: draftId, status: 'published' });
    const result = await request(app).post('/api/knowledge-evidence/drafts/' + draftId + '/publish')
      .set('Authorization', auth(alice)).send({ confirm: true }).expect(200);
    expect(result.body.url).toBe('/knowledge-card?id=' + draftId);
    expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: draftId, ownerId: alice, status: 'draft', visibility: 'private' });
    expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][1].$set).toEqual(expect.objectContaining({ status: 'published', visibility: 'public', publisherName: 'N4K48' }));
    KnowledgeDraft.findOneAndUpdate.mockResolvedValueOnce(null);
    await request(app).post('/api/knowledge-evidence/drafts/' + draftId + '/publish')
      .set('Authorization', auth(bob)).send({ confirm: true }).expect(409);
  });

  test('public read excludes private cards and internal owner data; withdrawal removes public access', async () => {
    const fields = 'title domain description evidence verificationNote publishedAt publisherName';
    KnowledgeDraft.findOne.mockReturnValue({ select: selection => {
      expect(selection).toBe(fields);
      return { lean: async () => null };
    } });
    await request(app).get('/api/knowledge-evidence/public/' + draftId).expect(404);
    expect(KnowledgeDraft.findOne).toHaveBeenCalledWith({ _id: draftId, status: 'published', visibility: 'public' });
    KnowledgeDraft.findOne.mockReturnValue({ select: () => ({ lean: async () => ({ title: 'Prove Docker', publisherName: 'N4K48' }) }) });
    const result = await request(app).get('/api/knowledge-evidence/public/' + draftId).expect(200);
    expect(result.body.card).toEqual({ title: 'Prove Docker', publisherName: 'N4K48' });
    expect(result.headers['cache-control']).toBe('no-store');
    KnowledgeDraft.findOneAndUpdate.mockResolvedValue({ _id: draftId, status: 'draft' });
    await request(app).post('/api/knowledge-evidence/drafts/' + draftId + '/unpublish')
      .set('Authorization', auth(alice)).expect(200);
    expect(KnowledgeDraft.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: draftId, ownerId: alice, status: 'published', visibility: 'public' });
  });

  test('catalog includes only explicitly public cards with selected public fields', async () => {
    KnowledgeDraft.find.mockImplementation(query => {
      expect(query).toEqual({ status: 'published', visibility: 'public' });
      return { select: fields => {
        expect(fields).toBe('title domain description evidence verificationNote publishedAt publisherName');
        return { sort: () => ({ limit: max => {
          expect(max).toBe(100);
          return { lean: async () => [{ _id: draftId, title: 'Prove Docker', publisherName: 'N4K48' }] };
        } }) };
      } };
    });
    const result = await request(app).get('/api/knowledge-evidence/public').expect(200);
    expect(result.body.cards).toEqual([{ _id: draftId, title: 'Prove Docker', publisherName: 'N4K48' }]);
    expect(result.headers['cache-control']).toBe('no-store');
  });
});
