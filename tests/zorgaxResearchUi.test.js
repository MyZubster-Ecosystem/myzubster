'use strict';

const request = require('supertest');
const app = require('../server');

describe('Zorgax research UI', () => {
  test('GET /zorgax exposes live web research and external citations as an explicit client option', async () => {
    const response = await request(app).get('/zorgax');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/Web live \+ fonti esterne/i);
    expect(response.text).toContain('useWeb:webSearch.checked');
    expect(response.text).toMatch(/ricerca è read-only/i);
    expect(response.text).toMatch(/Fonti esterne consultate/i);
  });
});
