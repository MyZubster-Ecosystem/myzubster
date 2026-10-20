'use strict';

jest.mock('../src/middleware/auth', () => ({
  authenticate: (_req, _res, next) => next(),
  optionalAuthenticate: (_req, _res, next) => next()
}));

jest.mock('../src/middleware/zorgaxAccess', () => ({
  publicAccess: () => ({ plan: 'free', active: true }),
  createZorgaxAccessMiddleware: () => ({
    loadZorgaxAccess: (req, _res, next) => {
      req.zorgaxAccess = { plan: 'free', active: true };
      req.zorgaxPolicy = {
        webResearch: false,
        maxWebResults: 0
      };
      next();
    },
    requireZorgaxPlan: () => (_req, _res, next) => next()
  })
}));

jest.mock('../src/services/zorgaxGatewayClient', () => ({
  requestZorgaxGateway: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const { requestZorgaxGateway } =
  require('../src/services/zorgaxGatewayClient');

const router = require('../src/routes/zorgaxAssistantRoutes');

const app = express();
app.use(express.json());
app.use('/api/zorgax/assistant', router);

describe('Zorgax chat HTTP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requestZorgaxGateway.mockResolvedValue({
      ok: true,
      response: 'Zorgax operativo',
      privacy: {
        processing_mode: 'LOCAL_ONLY',
        external_egress_allowed: false
      },
      sources: []
    });
  });

  test('POST chat restituisce la risposta del gateway', async () => {
    const res = await request(app)
      .post('/api/zorgax/assistant/chat')
      .send({
        message: 'Ciao Zorgax',
        useWeb: false,
        history: []
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.response).toBe('Zorgax operativo');
    expect(res.body.privacy.processing_mode).toBe('LOCAL_ONLY');

    expect(requestZorgaxGateway).toHaveBeenCalledWith({
      message: 'Ciao Zorgax',
      history: []
    });
  });

  test('errore gateway restituisce HTTP 502', async () => {
    requestZorgaxGateway.mockRejectedValue(
      new Error('Gateway non disponibile')
    );

    const res = await request(app)
      .post('/api/zorgax/assistant/chat')
      .send({
        message: 'Ciao',
        useWeb: false
      });

    expect(res.status).toBe(502);
    expect(res.body.ok).toBe(false);
  });
});
