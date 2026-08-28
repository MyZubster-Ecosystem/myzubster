'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { ServiceRegistry } = require('./serviceRegistry');
const { route } = require('./gateway');

test('registry registers and resolves services', () => {
  const registry = new ServiceRegistry();
  registry.register('auth', 'http://127.0.0.1:3001');
  assert.equal(registry.has('auth'), true);
  assert.equal(registry.resolve('auth'), 'http://127.0.0.1:3001');
  assert.equal(registry.resolve('missing'), null);
});

test('route() matches the health endpoint', () => {
  const decision = route({ url: '/health', headers: { host: 'localhost' } });
  assert.equal(decision.type, 'health');
});

test('route() matches the services endpoint', () => {
  const decision = route({ url: '/services', headers: { host: 'localhost' } });
  assert.equal(decision.type, 'services');
});

test('route() proxies known service prefixes and strips them', () => {
  const decision = route({ url: '/bounties/list?page=1', headers: { host: 'localhost' } });
  assert.equal(decision.type, 'proxy');
  assert.equal(decision.service, 'bounties');
  assert.equal(decision.path, '/list?page=1');
});

test('route() returns unmatched for unknown prefixes', () => {
  const decision = route({ url: '/nope', headers: { host: 'localhost' } });
  assert.equal(decision.type, 'unmatched');
});
