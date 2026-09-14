'use strict';

const fs = require('fs');
const path = require('path');

describe('Marketplace demo funnel tracking', () => {
  const frontend = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'src', 'index.js'), 'utf8');
  const route = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'zorgaxAssistantRoutes.js'), 'utf8');

  test('tracks demo opens and category selections', () => {
    expect(frontend).toContain("trackMarketplaceDemo('marketplace_demo_open')");
    expect(frontend).toContain("'marketplace_demo_category_selected'");
    expect(frontend).toContain("fetch('/api/zorgax/assistant/track'");
  });

  test('accepts marketplace demo funnel events server-side', () => {
    expect(route).toContain("'marketplace_demo_open'");
    expect(route).toContain("'marketplace_demo_category_selected'");
  });
});
