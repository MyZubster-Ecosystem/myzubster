'use strict';

const request = require('supertest');
const express = require('express');

describe('Zorgax VPS Gateway & Proxy Resilience (#1624)', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  describe('askGeneralAI gateway client contract', () => {
    test('transmits x-zorgax-gateway-secret and uses correct /api/zorgax/chat route', async () => {
      process.env.ZORGAX_VPS_GATEWAY_URL = 'https://gateway.myzubster.com';
      process.env.ZORGAX_GATEWAY_SECRET = 'test-secret-key-12345';

      let capturedUrl = null;
      let capturedHeaders = null;
      let capturedBody = null;

      global.fetch = jest.fn().mockImplementation(async (url, options) => {
        capturedUrl = url;
        capturedHeaders = options.headers;
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            response: 'Ciao, sono Zorgax via VPS gateway!'
          })
        };
      });

      const { answer } = require('../src/services/zorgaxAssistantService');
      const result = await answer({ message: 'cosa posso fare su myzubster', useWeb: false });

      expect(capturedUrl).toBe('https://gateway.myzubster.com/api/zorgax/chat');
      expect(capturedHeaders['x-zorgax-gateway-secret']).toBe('test-secret-key-12345');
      expect(capturedHeaders['Content-Type']).toBe('application/json');
      expect(capturedBody.useWeb).toBe(false);
      expect(result.response).toBe('Ciao, sono Zorgax via VPS gateway!');
    });

    test('throws descriptive error when upstream gateway network connection fails', async () => {
      process.env.ZORGAX_VPS_GATEWAY_URL = 'https://gateway.myzubster.com';

      global.fetch = jest.fn().mockImplementation(async () => {
        throw new TypeError('fetch failed');
      });

      const { answer } = require('../src/services/zorgaxAssistantService');
      await expect(
        answer({ message: 'cosa posso fare su myzubster', useWeb: false })
      ).rejects.toThrow(/AI upstream connection failed: fetch failed/i);
    });
  });

  describe('VPS Server-to-server gateway route protection (zorgaxRoutes)', () => {
    function createZorgaxTestApp() {
      const app = express();
      app.use(express.json());
      // Simulate remote client IP (non-loopback) safely
      app.use((req, _res, next) => {
        Object.defineProperty(req, 'ip', { value: '203.0.113.195', configurable: true });
        next();
      });
      const zorgaxRoutes = require('../src/routes/zorgaxRoutes');
      app.use('/api/zorgax', zorgaxRoutes);
      return app;
    }

    test('rejects external requests with 401 when gateway secret is missing', async () => {
      process.env.ZORGAX_GATEWAY_SECRET = 'super-secret-gateway-token';
      const app = createZorgaxTestApp();

      const response = await request(app)
        .post('/api/zorgax/chat')
        .send({ message: 'Test message' });

      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toMatch(/chiave gateway richiesta/i);
    });

    test('rejects external requests with 403 when wrong gateway secret is provided', async () => {
      process.env.ZORGAX_GATEWAY_SECRET = 'super-secret-gateway-token';
      const app = createZorgaxTestApp();

      const response = await request(app)
        .post('/api/zorgax/chat')
        .set('x-zorgax-gateway-secret', 'wrong-secret')
        .send({ message: 'Test message' });

      expect(response.status).toBe(403);
      expect(response.body.ok).toBe(false);
      expect(response.body.error).toMatch(/chiave gateway non valida/i);
    });

    test('accepts external requests and executes inference when valid gateway secret is provided', async () => {
      process.env.ZORGAX_GATEWAY_SECRET = 'super-secret-gateway-token';
      const app = createZorgaxTestApp();

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: { content: 'Benvenuto su MyZubster!' } })
      });

      const response = await request(app)
        .post('/api/zorgax/chat')
        .set('x-zorgax-gateway-secret', 'super-secret-gateway-token')
        .send({ message: 'Test message' });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.response).toBe('Benvenuto su MyZubster!');
    });

    test('returns 503 with OLLAMA_UNAVAILABLE when Ollama local instance is down', async () => {
      process.env.ZORGAX_GATEWAY_SECRET = 'super-secret-gateway-token';
      const app = createZorgaxTestApp();

      global.fetch = jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:11434'));

      const response = await request(app)
        .post('/api/zorgax/chat')
        .set('x-zorgax-gateway-secret', 'super-secret-gateway-token')
        .send({ message: 'Test message' });

      expect(response.status).toBe(503);
      expect(response.body.ok).toBe(false);
      expect(response.body.code).toBe('OLLAMA_UNAVAILABLE');
      expect(response.body.error).toMatch(/Inference engine non raggiungibile/i);
    });
  });

  describe('Vercel assistant route error mapping (zorgaxAssistantRoutes)', () => {
    test('returns 503 AI_UPSTREAM_UNAVAILABLE with friendly Italian message instead of raw fetch failed', async () => {
      const app = require('../server');
      process.env.ZORGAX_VPS_GATEWAY_URL = 'https://gateway.myzubster.com';
      global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed'));

      const response = await request(app)
        .post('/api/zorgax/assistant/chat')
        .send({ message: 'cosa posso fare su myzubster', useWeb: false });

      expect(response.status).toBe(503);
      expect(response.body.ok).toBe(false);
      expect(response.body.code).toBe('AI_UPSTREAM_UNAVAILABLE');
      expect(response.body.error).toMatch(/motore di intelligenza artificiale locale è temporaneamente non raggiungibile/i);
      expect(response.body.error).not.toBe('fetch failed');
    });
  });
});
