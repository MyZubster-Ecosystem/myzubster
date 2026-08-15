const fs = require('node:fs');
const path = require('node:path');
const { createIntervention, transition, calculateKpis } = require('./core/workflow');

const source = JSON.parse(fs.readFileSync(path.join(__dirname, 'synthetic/interventions.json'), 'utf8'));
const items = source.interventions.map(row => {
  const item = createIntervention(row);
  const sequence = [
    ['assigned', row.takenAt],
    ['in_progress', row.startedAt],
    ['verification', row.verifiedAt],
    ['closed', row.closedAt]
  ];
  for (const [state, at] of sequence) {
    if (at) transition(item, state, row.assignee || 'OP-SYN', at);
  }
  return item;
});

console.log(JSON.stringify({
  synthetic: true,
  interventions: items.map(({ events, ...item }) => ({ ...item, eventCount: events.length })),
  kpis: calculateKpis(items)
}, null, 2));
