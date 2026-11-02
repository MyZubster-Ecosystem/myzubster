'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  askGeneralAI,
  answer,
  buildDegradedFallback
} = require('../src/services/zorgaxAssistantService');
const app = require('../server');

let mongo;
const originalFetch = global.fetch;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

describe('Zorgax AI Gateway Reliability, Controlled Timeouts & Safe Fallbacks (Issue #1676)', () => {
  let loggedInfo = [];
  let loggedWarn = [];

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(() => {
    loggedInfo = [];
    loggedWarn = [];
    console.info = jest.fn((...args) => loggedInfo.push(args.join(' ')));
    console.warn = jest.fn((...args) => loggedWarn.push(args.join(' ')));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    delete process.env.ZORGAX_GATEWAY_TIMEOUT_MS;
    delete process.env.OPENAI_API_KEY;
  });

  describe('1. Gateway Success Path', () => {
    test('returns AI live response with ai_generation_succeeded=true and status=ai_success', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          response: 'Zorgax: Il Marketplace MyZubster supporta lo scambio diretto e annunci gratuiti.'
        })
      }));

      const result = await askGeneralAI('Come funziona il Marketplace?');

      expect(result.ai_generation_succeeded).toBe(true);
      expect(result.status).toBe('ai_success');
      expect(result.execution_type).toBe('ai_live');
      expect(result.fallbackReason).toBeNull();
      expect(result.text).toContain('Il Marketplace MyZubster supporta lo scambio diretto');
      expect(typeof result.latency_ms).toBe('number');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('answer() orchestrates model routing and reports sanitized metrics', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          response: 'Zorgax: Benvenuto nella community di MyZubster!'
        })
      }));

      const res = await answer({ message: 'Ciao Zorgax', useWeb: false });

      expect(res.ai_generation_succeeded).toBe(true);
      expect(res.status).toBe('ai_success');
      expect(res.execution_type).toBe('ai_live');
      expect(res.response).toContain('Benvenuto nella community');
      expect(res.answer).toBe(res.response);
      expect(res.message).toBe(res.response);
      expect(typeof res.latency_ms).toBe('number');

      // Verify sanitized metrics log was output
      const metricLog = loggedInfo.find(msg => msg.includes('[zorgax-ai-metrics]'));
      expect(metricLog).toBeDefined();
      const parsed = JSON.parse(metricLog.replace(/^.*\[zorgax-ai-metrics\]\s*/, ''));
      expect(parsed.event).toBe('zorgax_chat_execution');
      expect(parsed.status).toBe('ai_success');
      expect(parsed.generationSucceeded).toBe(true);
      expect(parsed.executionType).toBe('ai_live');
      // Crucial: private prompt text must not be in metrics
      expect(metricLog).not.toContain('Ciao Zorgax');
    });
  });

  describe('2. Gateway Timeout Handling & Exponential Retry', () => {
    test('retries on timeout and returns transparent degraded fallback without pretending to be LLM', async () => {
      process.env.ZORGAX_GATEWAY_TIMEOUT_MS = '50'; // fast timeout for test

      global.fetch = jest.fn(async (_url, options) => {
        // simulate slow gateway exceeding timeout
        return new Promise((_, reject) => {
          const timeoutErr = new Error('The operation was aborted');
          timeoutErr.name = 'TimeoutError';
          if (options?.signal) {
            options.signal.addEventListener('abort', () => reject(timeoutErr));
          }
        });
      });

      const result = await askGeneralAI('Quali sono gli annunci del marketplace?');

      expect(result.ai_generation_succeeded).toBe(false);
      expect(result.status).toBe('timeout');
      expect(result.execution_type).toBe('degraded_fallback');
      expect(result.fallbackReason).toBe('gateway_timeout');
      expect(result.text).toContain('Nota Zorgax:');
      expect(result.text).toContain('timeout del gateway');
      expect(result.text).toContain('/marketplace');
      // Must have attempted with retry
      expect(global.fetch.mock.calls.length).toBeGreaterThanOrEqual(1);

      // Verify sanitized warning log
      const attemptLog = loggedWarn.find(msg => msg.includes('[zorgax-gateway-attempt]'));
      expect(attemptLog).toBeDefined();
      expect(attemptLog).not.toContain('Quali sono gli annunci');
    });
  });

  describe('3. Gateway HTTP Errors (500 / 502 / 503)', () => {
    test('handles 502 Bad Gateway gracefully and provides route navigation', async () => {
      global.fetch = jest.fn(async () => ({
        ok: false,
        status: 502,
        json: async () => ({ error: 'Bad Gateway' })
      }));

      const result = await askGeneralAI('Vorrei diventare un venditore');

      expect(result.ai_generation_succeeded).toBe(false);
      expect(result.status).toBe('gateway_unavailable');
      expect(result.execution_type).toBe('degraded_fallback');
      expect(result.fallbackReason).toBe('gateway_http_502');
      expect(result.text).toContain('non è raggiungibile al momento');
      expect(result.text).toContain('Diventa Seller');
      expect(result.text).toContain('/marketplace');
    });

    test('handles network offline / connection refused gracefully', async () => {
      global.fetch = jest.fn(async () => {
        const netErr = new Error('connect ECONNREFUSED 127.0.0.1:11434');
        netErr.code = 'ECONNREFUSED';
        throw netErr;
      });

      const result = await askGeneralAI('Come accedo con Google?');

      expect(result.ai_generation_succeeded).toBe(false);
      expect(result.status).toBe('gateway_unavailable');
      expect(result.fallbackReason).toBe('gateway_unavailable');
      expect(result.text).toContain('/social-login');
    });
  });

  describe('4. Topic-Aware Navigation Fallbacks', () => {
    test('routes metaverse questions to /metaverse', () => {
      const fallback = buildDegradedFallback('Vorrei esplorare la stanza 3d e gli avatar del metaverso');
      expect(fallback).toContain('/metaverse');
      expect(fallback).toContain('spazi 3D');
    });

    test('routes life/garden questions to /life-pilot', () => {
      const fallback = buildDegradedFallback('Parlami dei progetti pilot di Nicola e dell orto');
      expect(fallback).toContain('/life-pilot');
    });

    test('routes login questions to /social-login', () => {
      const fallback = buildDegradedFallback('Come posso fare il login con github o google?');
      expect(fallback).toContain('/social-login');
    });

    test('routes kefir questions to circular food guidance', () => {
      const fallback = buildDegradedFallback('Dove posso trovare grani di kefir di latte?');
      expect(fallback).toContain('kefir');
      expect(fallback).toContain('/marketplace');
    });

    test('provides general live routes for generic queries', () => {
      const fallback = buildDegradedFallback('Che tempo fa oggi a Rimini?');
      expect(fallback).toContain('/marketplace');
      expect(fallback).toContain('/metaverse');
      expect(fallback).toContain('/life-pilot');
      expect(fallback).toContain('/social-login');
    });
  });

  describe('5. Data-Entry Intent Independence', () => {
    test('processes data intents deterministically without calling AI gateway', async () => {
      global.fetch = jest.fn();

      const result = await answer({ message: 'salva temperatura terra 22C', useWeb: false });

      expect(result.action_required).toBe('human_confirmation');
      expect(result.status).toBe('data_confirmation_required');
      expect(result.ai_generation_succeeded).toBe(false);
      expect(result.execution_type).toBe('data_intent');
      expect(result.data_preview).toBeDefined();
      expect(result.data_preview.confirmation).toMatch(/^CONFERMA [a-f0-9]{8}$/);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('6. End-to-End HTTP Route /api/zorgax/assistant/chat', () => {
    test('returns 200 with structured status and answer metadata when gateway succeeds', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        json: async () => ({
          response: 'Zorgax: Tutto operativo sulla piattaforma MyZubster.'
        })
      }));

      const res = await request(app)
        .post('/api/zorgax/assistant/chat')
        .send({ message: 'Qual è lo stato del sistema?', useWeb: false });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.status).toBe('ai_success');
      expect(res.body.ai_generation_succeeded).toBe(true);
      expect(res.body.execution_type).toBe('ai_live');
      expect(res.body.response).toContain('Tutto operativo');
      expect(res.body.answer).toBe(res.body.response);
      expect(res.body.message).toBe(res.body.response);
      expect(typeof res.body.latency_ms).toBe('number');
    });

    test('returns 200 with honest degraded fallback and false generation flag when gateway is offline', async () => {
      global.fetch = jest.fn(async () => {
        throw new Error('Connection refused');
      });

      const res = await request(app)
        .post('/api/zorgax/assistant/chat')
        .send({ message: 'Come trovo gli annunci del marketplace?', useWeb: false });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.status).toBe('gateway_unavailable');
      expect(res.body.ai_generation_succeeded).toBe(false);
      expect(res.body.execution_type).toBe('degraded_fallback');
      expect(res.body.ai_fallback_reason).toBe('gateway_unavailable');
      expect(res.body.response).toContain('Nota Zorgax:');
      expect(res.body.response).toContain('/marketplace');
      expect(res.body.answer).toBe(res.body.response);
    });
  });
});
