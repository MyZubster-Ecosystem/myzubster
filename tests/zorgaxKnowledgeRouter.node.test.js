const test = require('node:test');
const assert = require('node:assert/strict');
const { DOMAIN_REGISTRY, routeKnowledge, knowledgeGuidance } = require('../src/services/zorgaxKnowledgeRouter');

test('registry exposes canonical MyZubster knowledge domains', () => {
  const domains = DOMAIN_REGISTRY.map(x => x.domain);
  for (const domain of ['FERMENTATION','PROGRAMMING','UNIVERSITY','ANIMALS','PERMACULTURE','MUSIC','ART','SPORT','MARTIAL_ARTS','SOUNDSYSTEM','MONERO']) assert.ok(domains.includes(domain));
});

test('routes calisthenics to SPORT and SPT knowledge', () => {
  const result = routeKnowledge('Vorrei imparare calisthenics e allenamento');
  assert.equal(result.primary.domain, 'SPORT');
  assert.equal(result.primary.prefix, 'SPT');
  assert.ok(result.primary.categories.includes('CALISTHENICS'));
});

test('routes kefir and whey questions to FERMENTATION', () => {
  const result = routeKnowledge('Come posso usare il siero del kefir?');
  assert.equal(result.primary.domain, 'FERMENTATION');
  assert.equal(result.primary.prefix, 'KF');
});

test('routes Docker debugging to PROGRAMMING', () => {
  const result = routeKnowledge('Ho un bug Docker, chi può aiutarmi con il debugging?');
  assert.equal(result.primary.domain, 'PROGRAMMING');
  assert.equal(result.primary.prefix, 'DEV');
});

test('does not invent a category for unrelated input', () => {
  const result = routeKnowledge('ciao come stai');
  assert.equal(result.primary, null);
  assert.match(knowledgeGuidance(result), /clarifying question|search broadly/i);
});
