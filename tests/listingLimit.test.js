const fs = require('fs');
const path = require('path');

describe('listing query limit verification (PR #1627)', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../src/routes/listingRoutes.js'), 'utf8');

  test('validates and applies server-side query limit with max 100 and default 50', () => {
    expect(routes).toContain('limit:rawLimit');
    expect(routes).toContain('const parsedLimit=parseInt(rawLimit,10)');
    expect(routes).toContain('Number.isFinite(parsedLimit)&&parsedLimit>0?Math.min(parsedLimit,100):50');
    expect(routes).toContain('.limit(limit)');
    expect(routes).toContain('limit,listings:listings.map');
  });

  test('featured services on homepage requests limit=6', () => {
    const appSource = fs.readFileSync(path.join(__dirname, '../frontend/src/App.js'), 'utf8');
    expect(appSource).toContain("fetch('/api/listings?limit=6')");
  });
});
