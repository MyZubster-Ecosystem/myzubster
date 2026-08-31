'use strict';

const fs = require('fs');
const path = require('path');

describe('Vercel routing', () => {
  const protectedZorgaxRoutes = [
    '/api/zorgax/monetization/(.*)',
    '/api/zorgax/capital/(.*)',
    '/api/zorgax/digital-business/(.*)',
  ];

  test.each(protectedZorgaxRoutes)(
    'routes %s locally before the public gateway proxy',
    (protectedRoute) => {
      const configPath = path.join(__dirname, '..', 'vercel.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const routes = config.routes || [];

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
});

