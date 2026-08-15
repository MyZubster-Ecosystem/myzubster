const express = require('express');
const request = require('supertest');
const { authLimiter, adminLimiter } = require('../src/middleware/rateLimitMiddleware');

function appWith(path, limiter) {
  const app = express();
  app.get(path, limiter, (req, res) => res.json({ ok: true }));
  return app;
}

describe('rate limit middleware', () => {
  test('auth limiter allows five requests and rejects the sixth', async () => {
    const app = appWith('/auth', authLimiter);
    for (let requestNumber = 1; requestNumber <= 5; requestNumber += 1) {
      const result = await request(app).get('/auth');
      expect(result.status).toBe(200);
      expect(result.headers['ratelimit-limit']).toBe('5');
    }

    const blocked = await request(app).get('/auth');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many authentication attempts, please try again later.',
    });
  });

  test('admin limiter allows ten requests and rejects the eleventh', async () => {
    const app = appWith('/admin', adminLimiter);
    for (let requestNumber = 1; requestNumber <= 10; requestNumber += 1) {
      expect((await request(app).get('/admin')).status).toBe(200);
    }

    const blocked = await request(app).get('/admin');
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: 'Too many admin requests.' });
  });
});
