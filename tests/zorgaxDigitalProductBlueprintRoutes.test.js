'use strict';

const express = require('express');
const request = require('supertest');
const routerModule = require('../src/routes/zorgaxDigitalBusinessRoutes');

function appWith(service) {
  const app = express();
  app.use(express.json());
  app.use('/api/zorgax/digital-business', routerModule.createZorgaxDigitalBusinessRouter({
    authenticateMiddleware: (req, _res, next) => { req.userId = 'owner-1'; next(); },
    ProjectModel: {},
    service
  }));
  return app;
}

describe('Zorgax digital product blueprint routes', () => {
  test('generates blueprint using authenticated owner and performs no publication', async () => {
    const generateProductBlueprint = jest.fn().mockResolvedValue({
      project: { projectId: 'zdp_1', ownerId: 'owner-1', status: 'PLANNED' },
      blueprint: { projectId: 'zdp_1', advisoryOnly: true, launchReadiness: { publicationAutomated: false } }
    });
    const app = appWith({ generateProductBlueprint });
    const response = await request(app).post('/api/zorgax/digital-business/projects/zdp_1/blueprint').send({ ownerId: 'attacker' });
    expect(response.status).toBe(200);
    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.publicationPerformed).toBe(false);
    expect(response.body.predictsProfit).toBe(false);
    expect(generateProductBlueprint).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', projectId: 'zdp_1' }));
  });

  test('returns conflict when project needs more evidence', async () => {
    const app = appWith({ generateProductBlueprint: jest.fn().mockRejectedValue(new Error('project needs more evidence before product planning')) });
    const response = await request(app).post('/api/zorgax/digital-business/projects/zdp_1/blueprint');
    expect(response.status).toBe(409);
  });
});
