/**
 * Simple tests for MyZubster Backend Dashboard
 */

const http = require('http');

const BASE = 'http://localhost:3009';

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(BASE + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`);
      failed++;
    }
  };

  const assert = (cond, msg) => {
    if (!cond) throw new Error(msg || 'Assertion failed');
  };

  await test('GET /health returns 200', async () => {
    const res = await request('/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Health should return success: true');
  });

  await test('GET /api/dashboard returns 200', async () => {
    const res = await request('/api/dashboard');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body.success === true, 'Dashboard should return success: true');
  });

  await test('GET /api/dashboard has services', async () => {
    const res = await request('/api/dashboard');
    assert(res.body.services, 'Missing services');
    assert(res.body.services.find(s => s.name === "telegram"), 'Missing telegram');
    assert(res.body.services.find(s => s.name === "github"), 'Missing github service');
    assert(res.body.services.find(s => s.name === "ai"), 'Missing ai service');
  });

  await test('GET /api/dashboard has recentIssues', async () => {
    const res = await request('/api/dashboard');
    assert(Array.isArray(res.body.recentIssues), 'recentIssues should be an array');
  });

  await test('GET /api/dashboard has activeBounties', async () => {
    const res = await request('/api/dashboard');
    assert(Array.isArray(res.body.activeBounties), 'activeBounties should be an array');
    assert(res.body.activeBounties.length > 0, 'Should have at least one bounty');
  });

  await test('GET /dashboard returns HTML', async () => {
    const res = await request('/dashboard');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(typeof res.body === 'string', 'Should return HTML string');
    assert(res.body.includes('MyZubster Dashboard'), 'Should contain dashboard title');
    assert(res.body.includes('/api/dashboard'), 'Should reference API endpoint');
  });

  await test('GET /api/messages/:userId returns error structure (MongoDB may be offline)', async () => {
    const res = await request('/api/messages/test-user');
    // Endpoint exists and returns either 200 (with data) or 500 (with error structure)
    assert([200, 500].includes(res.status), `Expected 200 or 500, got ${res.status}`);
    if (res.status === 500) {
      assert(res.body.success === false, 'Error response should have success: false');
    }
  });

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
