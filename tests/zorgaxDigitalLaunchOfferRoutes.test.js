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

describe('Zorgax digital launch offer routes', () => {
  test('generates launch package for authenticated owner without publishing or messaging', async () => {
    const generateLaunchOffer = jest.fn().mockResolvedValue({
      project: { projectId: 'zdp_1', ownerId: 'owner-1' },
      launchOffer: { advisoryOnly: true, publicationPerformed: false, externalMessagesSent: false }
    });
    const app = appWith({ generateLaunchOffer });
    const response = await request(app).post('/api/zorgax/digital-business/projects/zdp_1/launch-offer').send({ ownerId: 'attacker' });
    expect(response.status).toBe(200);
    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.publicationPerformed).toBe(false);
    expect(response.body.externalMessagesSent).toBe(false);
    expect(response.body.predictsProfit).toBe(false);
    expect(generateLaunchOffer).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', projectId: 'zdp_1' }));
  });

  test('returns conflict if product blueprint is missing', async () => {
    const app = appWith({ generateLaunchOffer: jest.fn().mockRejectedValue(new Error('product blueprint is required before launch offer generation')) });
    const response = await request(app).post('/api/zorgax/digital-business/projects/zdp_1/launch-offer');
    expect(response.status).toBe(409);
  });
});
