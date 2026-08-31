'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax assistant paid access contract', () => {
  const routeSource = fs.readFileSync(
    path.join(__dirname, '../src/routes/zorgaxAssistantRoutes.js'),
    'utf8'
  );
  const uiSource = fs.readFileSync(
    path.join(__dirname, '../public/zorgax.html'),
    'utf8'
  );

  test('keeps guest chat while enforcing server-side web limits', () => {
    expect(routeSource).toContain("router.post('/chat', optionalAuthenticate, loadZorgaxAccess");
    expect(routeSource).toContain('const useWeb = requestedWeb && policy.webResearch');
    expect(routeSource).toContain('Math.min(safeRequestedLimit, policy.maxWebResults)');
  });

  test('requires Developer for the direct research API', () => {
    expect(routeSource).toContain("router.get('/research', authenticate, requireZorgaxPlan('developer')");
  });

  test('requires Pro for persistent workspace reads and writes', () => {
    expect(routeSource).toContain("router.post('/data/commit', authenticate, requireZorgaxPlan('pro')");
    expect(routeSource).toContain("router.get('/data', authenticate, requireZorgaxPlan('pro')");
  });

  test('sends the signed-in token with assistant chat requests', () => {
    expect(uiSource).toContain("fetch('/api/zorgax/assistant/chat',{method:'POST',headers:authHeaders()");
  });
});

