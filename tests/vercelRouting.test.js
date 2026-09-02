'use strict';

const fs = require('fs');
const path = require('path');

describe('Vercel routing', () => {
  const configPath = path.join(__dirname, '..', 'vercel.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const routes = config.routes || [];

  const protectedZorgaxRoutes = [
    '/api/zorgax/monetization/(.*)',
    '/api/zorgax/capital/(.*)',
    '/api/zorgax/digital-business/(.*)',
  ];

  test.each(protectedZorgaxRoutes)(
    'routes %s locally before the public gateway proxy',
    (protectedRoute) => {
      const protectedRouteIndex = routes.findIndex(
        (route) => route.src === protectedRoute
      );
      const publicProxyIndex = routes.findIndex(
        (route) => route.src === '/api/zorgax/(.*)'
      );

      expect(protectedRouteIndex).toBeGreaterThanOrEqual(0);
      expect(routes[protectedRouteIndex].dest).toBe('/api/index.js');
      expect(publicProxyIndex).toBeGreaterThan(protectedRouteIndex);
      expect(routes[publicProxyIndex].dest).toBe(
        'https://myzubster-gateway.vercel.app/api/zargox/$1'
      );
    }
  );

  test.each([
    'myzubster.com',
    'my-zubster-app.vercel.app',
    'my-zubster-app-myzubster.vercel.app',
  ])('redirects non-canonical host %s to www.myzubster.com', (host) => {
    const redirect = routes.find(
      (route) =>
        route.src === '/(.*)' &&
        Array.isArray(route.has) &&
        route.has.some(
          (condition) => condition.type === 'host' && condition.value === host
        )
    );

    expect(redirect).toBeDefined();
    expect(redirect.status).toBe(308);
    expect(redirect.headers?.Location).toBe('https://www.myzubster.com/$1');
  });

  test.each([
    ['/social-login\\.html/?', '/social-login'],
    ['/zorgax-email-profile\\.html/?', '/zorgax-email-profile'],
    ['/press\\.html/?', '/press'],
  ])('redirects legacy route %s to clean URL %s', (src, location) => {
    const redirect = routes.find((route) => route.src === src);

    expect(redirect).toBeDefined();
    expect(redirect.status).toBe(308);
    expect(redirect.headers?.Location).toBe(location);
  });
});
