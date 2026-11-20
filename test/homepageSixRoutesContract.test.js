const request = require('supertest');
const app = require('../server');

describe('Six homepage routes and static fallback contracts', () => {
  const routes = [
    { path: '/marketplace', fileSnippet: 'Marketplace' },
    { path: '/social-login', fileSnippet: 'social-login' },
    { path: '/conoscenze', fileSnippet: 'Conoscenze' },
    { path: '/knowledge', fileSnippet: 'Conoscenze' },
    { path: '/metaverse', fileSnippet: 'space-station' },
    { path: '/fumetto', fileSnippet: 'fumetto' },
    { path: '/comic', fileSnippet: 'fumetto' },
    { path: '/zorgax', fileSnippet: 'zorgax' }
  ];

  for (const { path: routePath, fileSnippet } of routes) {
    test(`GET ${routePath} returns HTTP 200 and serves HTML content`, async () => {
      const res = await request(app).get(routePath);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain(fileSnippet);
    });
  }

  test('GET /social-login.html redirects with 308 to /social-login', async () => {
    const res = await request(app).get('/social-login.html');
    expect(res.status).toBe(308);
    expect(res.headers.location).toBe('/social-login');
  });
});
