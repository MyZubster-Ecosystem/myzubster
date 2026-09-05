'use strict';

const express = require('express');
const request = require('supertest');
const routes = require('../src/routes/zorgaxDigitalBusinessRoutes');

function buildApp() {
  const authenticateMiddleware = (req, _res, next) => {
    req.userId = 'nicola-user';
    next();
  };

  const service = {
    createProject: jest.fn(),
    listProjects: jest.fn(),
    getProject: jest.fn(),
    publicProject: jest.fn((item) => item),
    updateStrategy: jest.fn(),
    getAdvisoryPlan: jest.fn(),
    advanceProject: jest.fn(),
    validateProjectIdea: jest.fn().mockResolvedValue({
      project: { projectId: 'zdp-1', ownerId: 'nicola-user', status: 'VALIDATING' },
      report: {
        projectId: 'zdp-1',
        score: 80,
        verdict: 'READY_FOR_PLANNING',
        advisoryOnly: true,
        humanApprovalRequired: true,
        predictsProfit: false
      }
    })
  };

  const router = routes.createZorgaxDigitalBusinessRouter({
    authenticateMiddleware,
    ProjectModel: {},
    service
  });

  const app = express();
  app.use(express.json());
  app.use('/api/zorgax/digital-business', router);
  return { app, service };
}

describe('Zorgax Digital Idea Validation API', () => {
  test('validates only the authenticated owner project context', async () => {
    const { app, service } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/digital-business/projects/zdp-1/validate')
      .send({ ownerId: 'attacker-user' })
      .expect(200);

    expect(service.validateProjectIdea).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'nicola-user',
      projectId: 'zdp-1'
    }));
    expect(response.body.project.status).toBe('VALIDATING');
    expect(response.body.report.verdict).toBe('READY_FOR_PLANNING');
  });

  test('keeps validation advisory-only and explicitly non-predictive', async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post('/api/zorgax/digital-business/projects/zdp-1/validate')
      .send({})
      .expect(200);

    expect(response.body.advisoryOnly).toBe(true);
    expect(response.body.requiresHumanApproval).toBe(true);
    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.predictsProfit).toBe(false);
  });
});
