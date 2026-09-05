const request = require('supertest');
const app = require('../backend/src/index');

describe('legacy garden API privacy gate', () => {
  test.each([
    ['get', '/api/gardens'],
    ['get', '/api/gardens/search?q=Rimini'],
    ['get', '/api/gardens/nearby?lat=44&lng=12'],
    ['post', '/api/gardens']
  ])('%s %s is disabled', async (method, path) => {
    const response = await request(app)[method](path).send({
      name: 'Private garden',
      latitude: 44.0637,
      longitude: 12.5678
    });
    expect(response.status).toBe(410);
    expect(response.body.code).toBe('LEGACY_GARDEN_API_DISABLED');
    expect(JSON.stringify(response.body)).not.toContain('44.0637');
  });

  test('routes module still loads', () => {
    const routes = require('../backend/src/routes/gardens');
    expect(typeof routes).toBe('function');
  });
});
