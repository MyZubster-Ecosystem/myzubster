'use strict';

const express = require('express');
const request = require('supertest');
const routes = require('../src/routes/zorgaxDigitalBusinessRoutes');

function appWith(onboardingService) {
  const app = express();
  app.use(express.json());
  const authenticateMiddleware = (req, _res, next) => { req.userId = 'owner-1'; next(); };
  app.use('/api/zorgax/digital-business', routes.createZorgaxDigitalBusinessRouter({ authenticateMiddleware, ProjectModel: {}, EnrollmentModel: {}, service: {}, onboardingService }));
  return app;
}

describe('Zorgax LIFE pilot idea ranking route', () => {
  test('uses authenticated owner and returns advisory ranking', async () => {
    const onboardingService = { rankCandidateIdeas: jest.fn().mockResolvedValue({ candidates:[{candidateId:'a',rank:1}], selectionRequired:true, requiresHumanApproval:true, predictsSales:false, predictsProfit:false }) };
    const response = await request(appWith(onboardingService)).post('/api/zorgax/digital-business/pilot/ideas/rank').send({ ownerId:'attacker', ideas:[{title:'A'},{title:'B'}] });
    expect(response.status).toBe(200);
    expect(onboardingService.rankCandidateIdeas).toHaveBeenCalledWith(expect.objectContaining({ ownerId:'owner-1' }));
    expect(response.body.executionPerformed).toBe(false);
    expect(response.body.predictsProfit).toBe(false);
    expect(response.body.ranking.selectionRequired).toBe(true);
  });

  test('maps incomplete onboarding to conflict', async () => {
    const onboardingService = { rankCandidateIdeas: jest.fn().mockRejectedValue(new Error('pilot onboarding must be completed before idea ranking')) };
    const response = await request(appWith(onboardingService)).post('/api/zorgax/digital-business/pilot/ideas/rank').send({ ideas:[{title:'A'},{title:'B'}] });
    expect(response.status).toBe(409);
  });
});
