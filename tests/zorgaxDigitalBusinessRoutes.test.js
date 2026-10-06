'use strict';

const express = require('express');
const request = require('supertest');
const routes = require('../src/routes/zorgaxDigitalBusinessRoutes');

function buildApp() {
  const authenticateMiddleware = (req, _res, next) => {
    req.userId = 'user-1';
    next();
  };
  const service = {
    createProject: jest.fn().mockResolvedValue({ projectId: 'zdp-1', ownerId: 'user-1', status: 'IDEA' }),
    listProjects: jest.fn().mockResolvedValue([{ projectId: 'zdp-1', ownerId: 'user-1', status: 'IDEA' }]),
    getProject: jest.fn().mockResolvedValue({ projectId: 'zdp-1', ownerId: 'user-1', status: 'IDEA' }),
    publicProject: jest.fn((item) => item),
    updateStrategy: jest.fn().mockResolvedValue({ projectId: 'zdp-1', ownerId: 'user-1', status: 'IDEA' }),
    getAdvisoryPlan: jest.fn().mockResolvedValue({ projectId: 'zdp-1', advisoryOnly: true, requiresHumanApproval: true }),
    advanceProject: jest.fn().mockResolvedValue({ projectId: 'zdp-1', ownerId: 'user-1', status: 'VALIDATING' })
  };

  const app = express();
  app.use(express.json());
  app.use('/api/zorgax/digital-business', routes.createZorgaxDigitalBusinessRouter({
    authenticateMiddleware,
    ProjectModel: {},
    service
  }));
  return { app, service };
}

describe('Zorgax Digital Business API', () => {
  test('creates projects from authenticated owner identity, ignoring client ownerId', async () => {
    const { app, service } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/digital-business/projects')
      .send({ ownerId: 'attacker', title: 'Product', description: 'Description', productType: 'GUIDE' })
      .expect(201);

    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.requiresHumanApproval).toBe(true);
    expect(service.createProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'user-1' }));
  });

  test('lists only projects for the authenticated owner', async () => {
    const { app, service } = buildApp();
    await request(app).get('/api/zorgax/digital-business/projects').expect(200);
    expect(service.listProjects).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'user-1' }));
  });

  test('returns an advisory plan without execution', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .get('/api/zorgax/digital-business/projects/zdp-1/advisory-plan')
      .expect(200);
    expect(response.body.plan.advisoryOnly).toBe(true);
    expect(response.body.plan.requiresHumanApproval).toBe(true);
  });

  test('updates strategy while preserving owner scoping', async () => {
    const { app, service } = buildApp();
    await request(app)
      .put('/api/zorgax/digital-business/projects/zdp-1/strategy')
      .send({ targetCustomer: 'Freelancers', pricing: { currency: 'EUR', amountMinor: 2900 } })
      .expect(200);
    expect(service.updateStrategy).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'user-1',
      projectId: 'zdp-1',
      targetCustomer: 'Freelancers'
    }));
  });

  test('advances workflow without publishing or spending automatically', async () => {
    const { app, service } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/digital-business/projects/zdp-1/advance')
      .send({ nextStatus: 'VALIDATING' })
      .expect(200);
    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.project.status).toBe('VALIDATING');
    expect(service.advanceProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'user-1' }));
  });
});
