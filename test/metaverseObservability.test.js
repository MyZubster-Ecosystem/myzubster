const fs = require('fs');
const path = require('path');

describe('metaverse production observability wiring', () => {
  const routeSource = fs.readFileSync(path.join(__dirname, '../backend/src/routes/metaverse.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  const runbook = fs.readFileSync(path.join(__dirname, '../docs/METAVERSE_OBSERVABILITY.md'), 'utf8');

  test('exposes a non-cacheable aggregate health endpoint', () => {
    expect(routeSource).toContain("router.get('/health'");
    expect(routeSource).toContain("res.setHeader('Cache-Control', 'no-store')");
    expect(routeSource).toContain('MetaversePresence.countDocuments');
    expect(routeSource).toContain('MetaverseChatMessage.countDocuments');
    expect(routeSource).not.toContain('body: req.body');
    expect(routeSource).not.toContain('query: req.query');
  });

  test('keeps the health endpoint reachable during a database incident', () => {
    expect(serverSource).toContain("if (req.path === '/health') return next()");
    expect(serverSource).toContain("failure: 'storage_gate'");
  });

  test('documents alert thresholds, incident handling and privacy boundaries', () => {
    expect(runbook).toContain('5xx rate');
    expect(runbook).toContain('p95');
    expect(runbook).toContain('Privacy boundary');
    expect(runbook).toContain('Rollback');
  });
});
