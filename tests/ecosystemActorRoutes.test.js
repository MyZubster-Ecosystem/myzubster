const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const EcosystemActor = require('../src/models/EcosystemActor');
const ecosystemActorRoutes = require('../src/routes/ecosystemActorRoutes');

describe('ecosystem actor registry', () => {
  let mongo;
  const userId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    process.env.JWT_SECRET = 'ecosystem-actor-test-secret';
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 30000);

  afterEach(async () => {
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

  function token() {
    return jwt.sign({ userId: String(userId), role: 'user', username: 'tester' }, process.env.JWT_SECRET);
  }

  test('creates and reads a university actor', async () => {
    const created = await request(app())
      .post('/api/ecosystem/actors')
      .set('Authorization', `Bearer ${token()}`)
      .send({
        type: 'university',
        name: 'Example Research Lab',
        slug: 'example-research-lab',
        github: {
          org: 'example-university',
          repositories: ['example-university/research-pilot']
        },
        skills: ['research', 'data'],
        projects: ['pilot-001']
      });

    expect(created.status).toBe(201);
    expect(created.body.actor).toMatchObject({
      type: 'university',
      name: 'Example Research Lab',
      slug: 'example-research-lab'
    });
    expect(created.body.actor.actorId).toMatch(/^actor-/);

    const fetched = await request(app()).get(`/api/ecosystem/actors/${created.body.actor.actorId}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.actor.github.repositories).toEqual(['example-university/research-pilot']);
  });

  test('supports the four canonical actor types', async () => {
    for (const type of ['community', 'university', 'developer', 'individual']) {
      const result = await request(app())
        .post('/api/ecosystem/actors')
        .set('Authorization', `Bearer ${token()}`)
        .send({ type, name: `${type} actor`, slug: `${type}-actor` });
      expect(result.status).toBe(201);
    }

    const list = await request(app()).get('/api/ecosystem/actors');
    expect(list.status).toBe(200);
    expect(list.body.count).toBe(4);
  });

  test('rejects invalid actor types and duplicate slugs', async () => {
    const invalid = await request(app())
      .post('/api/ecosystem/actors')
      .set('Authorization', `Bearer ${token()}`)
      .send({ type: 'company', name: 'Invalid', slug: 'invalid' });
    expect(invalid.status).toBe(400);

    const payload = { type: 'developer', name: 'Developer', slug: 'same-slug' };
    expect((await request(app()).post('/api/ecosystem/actors').set('Authorization', `Bearer ${token()}`).send(payload)).status).toBe(201);
    expect((await request(app()).post('/api/ecosystem/actors').set('Authorization', `Bearer ${token()}`).send(payload)).status).toBe(409);
  });

  test('rejects updates from another authenticated user', async () => {
    const created = await request(app())
      .post('/api/ecosystem/actors')
      .set('Authorization', `Bearer ${token()}`)
      .send({ type: 'developer', name: 'Owned Developer', slug: 'owned-developer' });

    const otherToken = jwt.sign({
      userId: String(new mongoose.Types.ObjectId()),
      role: 'user',
      username: 'other'
    }, process.env.JWT_SECRET);

    const forbidden = await request(app())
      .patch(`/api/ecosystem/actors/${created.body.actor.actorId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Changed by other' });

    expect(forbidden.status).toBe(403);
  });

  test('updates an actor without exposing ownership metadata', async () => {
    const created = await request(app())
      .post('/api/ecosystem/actors')
      .set('Authorization', `Bearer ${token()}`)
      .send({ type: 'community', name: 'Community', slug: 'community' });

    const updated = await request(app())
      .patch(`/api/ecosystem/actors/${created.body.actor.actorId}`)
      .set('Authorization', `Bearer ${token()}`)
      .send({ skills: ['repair', 'reuse'], status: 'active' });

    expect(updated.status).toBe(200);
    expect(updated.body.actor.skills).toEqual(['repair', 'reuse']);
    expect(updated.body.actor.createdBy).toBeUndefined();
    expect(updated.body.actor.updatedBy).toBeUndefined();
  });
});
