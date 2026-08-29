'use strict';

const fs = require('fs');
const path = require('path');

describe('Vercel routing', () => {
  test('routes the Zorgax capital API locally before the public gateway proxy', () => {
    const configPath = path.join(__dirname, '..', 'vercel.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const routes = config.routes || [];

    const capitalRouteIndex = routes.findIndex(
      (route) => route.src === '/api/zorgax/capital/(.*)'
    );
    const publicProxyIndex = routes.findIndex(
      (route) => route.src === '/api/zorgax/(.*)'
    );

    expect(capitalRouteIndex).toBeGreaterThanOrEqual(0);
    expect(routes[capitalRouteIndex].dest).toBe('/api/index.js');
    expect(publicProxyIndex).toBeGreaterThan(capitalRouteIndex);
    expect(routes[publicProxyIndex].dest).toBe(
      'https://myzubster-gateway.vercel.app/api/zargox/$1'
    );
  });
});
