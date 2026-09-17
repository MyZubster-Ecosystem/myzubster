const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const route = fs.readFileSync(path.join(__dirname, '..', 'src', 'routes', 'zorgaxRoutes.js'), 'utf8');

test('chat imports and executes the knowledge router', () => {
  assert.match(route, /require\('\.\.\/services\/zorgaxKnowledgeRouter'\)/);
  assert.match(route, /routeKnowledge\(userMessage\)/);
  assert.match(route, /knowledgeGuidance\(knowledge\)/);
});

test('chat response exposes category routing metadata', () => {
  assert.match(route, /knowledge_router_used/);
  assert.match(route, /knowledge_domain/);
  assert.match(route, /knowledge_prefix/);
  assert.match(route, /knowledge_matches/);
});

test('knowledge routing can be disabled per request', () => {
  assert.match(route, /useKnowledge=true/);
  assert.match(route, /useKnowledge\?routeKnowledge/);
});

test('read-only knowledge route endpoint is exposed', () => {
  assert.match(route, /router\.get\('\/knowledge-route'/);
});
