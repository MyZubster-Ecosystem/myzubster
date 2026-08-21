'use strict';

const request = require('supertest');
const app = require('../server');

describe('Zorgax research UI', () => {
  test('GET /zorgax exposes local research as an explicit client option', async () => {
    const response = await request(app).get('/zorgax');

    expect(response.status).toBe(200);
    expect(response.text).toMatch(/Ricerca locale/i);
    expect(response.text).toContain('useResearch:research.checked');
    expect(response.text).toMatch(/non avvia crawl autonomi/i);
    expect(response.text).toMatch(/Fonti research usate/i);
  });
});
