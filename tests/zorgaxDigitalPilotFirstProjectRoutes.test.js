'use strict';

const express = require('express');
const request = require('supertest');
const routes = require('../src/routes/zorgaxDigitalBusinessRoutes');

function appWith(onboardingService, service = {}) {
  const app = express();
  app.use(express.json());
  const authenticateMiddleware = (req, _res, next) => { req.userId = 'owner-1'; next(); };
  app.use('/api/zorgax/digital-business', routes.createZorgaxDigitalBusinessRouter({ authenticateMiddleware, ProjectModel:{}, EnrollmentModel:{}, service, onboardingService }));
  return app;
}

describe('Zorgax LIFE pilot first-project route', () => {
  test('creates first project with authenticated owner and no external execution', async () => {
    const onboardingService = {
      startFirstProject: jest.fn().mockResolvedValue({
        replay:false,
        enrollment:{ enrollmentId:'zpe_1', ownerId:'owner-1', firstProjectId:'zdp_1' },
        project:{ projectId:'zdp_1', ownerId:'owner-1', title:'First product' }
      })
    };
    const service = { createProject: jest.fn(), getProject: jest.fn(), publicProject: jest.fn() };
    const response = await request(appWith(onboardingService, service))
      .post('/api/zorgax/digital-business/pilot/first-project')
      .send({ ownerId:'attacker', title:'First product', description:'Pilot product', productType:'GUIDE' });
    expect(response.status).toBe(201);
    expect(onboardingService.startFirstProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId:'owner-1', title:'First product', businessService:service }));
    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.publicationPerformed).toBe(false);
    expect(response.body.spendingPerformed).toBe(false);
  });

  test('returns conflict when onboarding is incomplete', async () => {
    const onboardingService = { startFirstProject: jest.fn().mockRejectedValue(new Error('pilot onboarding must be completed before first project')) };
    const response = await request(appWith(onboardingService)).post('/api/zorgax/digital-business/pilot/first-project').send({ title:'First product', description:'Pilot product', productType:'GUIDE' });
    expect(response.status).toBe(409);
  });
});
