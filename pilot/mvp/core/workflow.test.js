const test = require('node:test');
const assert = require('node:assert/strict');
const { createIntervention, transition, calculateKpis } = require('./workflow');

test('workflow accepts only the defined state sequence', () => {
  const item = createIntervention({
    id: 'TEST-001', category: 'streetlight', priority: 'high', area: 'synthetic',
    openedAt: '2026-08-15T08:00:00Z'
  });
  transition(item, 'assigned', 'OP-TEST', '2026-08-15T08:10:00Z');
  transition(item, 'in_progress', 'OP-TEST', '2026-08-15T08:20:00Z');
  transition(item, 'verification', 'OP-TEST', '2026-08-15T09:00:00Z');
  transition(item, 'closed', 'OP-TEST', '2026-08-15T09:15:00Z');
  assert.equal(item.state, 'closed');
  assert.equal(item.events.length, 5);
  assert.equal(item.events[4].from, 'verification');
});

test('workflow rejects invalid transitions', () => {
  const item = createIntervention({
    id: 'TEST-002', category: 'road-maintenance', priority: 'medium', area: 'synthetic',
    openedAt: '2026-08-15T08:00:00Z'
  });
  assert.throws(() => transition(item, 'closed', 'OP-TEST', '2026-08-15T08:01:00Z'), /Invalid transition/);
});

test('KPI calculation is deterministic on synthetic data', () => {
  const data = [
    { openedAt: '2026-08-15T08:00:00Z', takenAt: '2026-08-15T08:30:00Z', closedAt: '2026-08-15T10:00:00Z', slaMinutes: 180 },
    { openedAt: '2026-08-15T09:00:00Z', takenAt: '2026-08-15T10:00:00Z', closedAt: null, slaMinutes: 180 }
  ];
  const kpis = calculateKpis(data);
  assert.equal(kpis.total, 2);
  assert.equal(kpis.open, 1);
  assert.equal(kpis.completed, 1);
  assert.equal(kpis.completionRate, 0.5);
  assert.equal(kpis.slaCompliance, 1);
  assert.equal(kpis.avgMinutesToTake, 45);
  assert.equal(kpis.avgMinutesToClose, 120);
});
