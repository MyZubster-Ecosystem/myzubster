'use strict';

const express = require('express');
const request = require('supertest');
const routes = require('../src/routes/zorgaxDigitalBusinessRoutes');

function appWith(service) {
  const app = express(); app.use(express.json());
  const authenticateMiddleware = (req, _res, next) => { req.userId = 'owner-1'; next(); };
  app.use('/api/zorgax/digital-business', routes.createZorgaxDigitalBusinessRouter({ authenticateMiddleware, ProjectModel: {}, service }));
  return app;
}

describe('Zorgax digital pilot workspace route', () => {
  test('uses authenticated owner and returns advisory workspace', async () => {
    const service = { getPilotWorkspace: jest.fn().mockResolvedValue({ projectId: 'p1', currentStage: 'VALIDATION', advisoryOnly: true, requiresHumanApproval: true, executionPerformed: false, predictsProfit: false }) };
    const response = await request(appWith(service)).get('/api/zorgax/digital-business/projects/p1/workspace');
    expect(response.status).toBe(200);
    expect(service.getPilotWorkspace).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'owner-1', projectId: 'p1' }));
    expect(response.body.workspace.currentStage).toBe('VALIDATION');
    expect(response.body.workspace.executionPerformed).toBe(false);
  });

  test('does not expose an unowned project when service reports not found', async () => {
    const service = { getPilotWorkspace: jest.fn().mockRejectedValue(new Error('digital product project not found')) };
    const response = await request(appWith(service)).get('/api/zorgax/digital-business/projects/other/workspace');
    expect(response.status).toBe(404);
  });
});
