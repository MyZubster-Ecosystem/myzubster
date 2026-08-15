const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const items = new Map([
  ['INT-001', { id: 'INT-001', title: 'Illuminazione area pubblica', priority: 'Alta', status: 'open' }],
  ['INT-002', { id: 'INT-002', title: 'Manutenzione arredo urbano', priority: 'Media', status: 'in_progress' }],
  ['INT-003', { id: 'INT-003', title: 'Verifica area verde', priority: 'Bassa', status: 'verification' }],
  ['INT-004', { id: 'INT-004', title: 'Ripristino segnaletica', priority: 'Alta', status: 'closed' }],
]);

const events = [];
let lastHash = 'GENESIS';
const transitions = { open: 'assigned', assigned: 'in_progress', in_progress: 'verification', verification: 'closed' };
const roles = { operator: ['assigned', 'in_progress', 'verification'], reviewer: ['closed'], admin: ['assigned', 'in_progress', 'verification', 'closed'] };

function appendEvent({ id, actor, role, from, to, action }) {
  const payload = JSON.stringify({ id, actor, role, from, to, action, prevHash: lastHash });
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  const event = { seq: events.length + 1, at: new Date().toISOString(), id, actor, role, from, to, action, prevHash: lastHash, hash };
  events.push(Object.freeze(event));
  lastHash = hash;
  return event;
}

app.get('/health', (_req, res) => res.json({ ok: true, synthetic: true }));
app.get('/interventions', (_req, res) => res.json([...items.values()]));
app.get('/interventions/:id/audit', (req, res) => res.json(events.filter(e => e.id === req.params.id)));

app.post('/interventions/:id/advance', (req, res) => {
  const item = items.get(req.params.id);
  const { actor = 'demo-operator', role = 'operator' } = req.body || {};
  if (!item) return res.status(404).json({ error: 'INTERVENTION_NOT_FOUND' });
  const next = transitions[item.status];
  if (!next) return res.status(409).json({ error: 'NO_VALID_TRANSITION' });
  if (!(roles[role] || []).includes(next)) return res.status(403).json({ error: 'ROLE_NOT_ALLOWED' });
  const from = item.status;
  item.status = next;
  appendEvent({ id: item.id, actor, role, from, to: next, action: next === 'closed' ? 'CLOSED' : 'STATUS_CHANGED' });
  return res.json(item);
});

app.get('/audit/verify', (_req, res) => {
  let previous = 'GENESIS';
  for (const event of events) {
    const payload = JSON.stringify({ id: event.id, actor: event.actor, role: event.role, from: event.from, to: event.to, action: event.action, prevHash: event.prevHash });
    const expected = crypto.createHash('sha256').update(payload).digest('hex');
    if (event.prevHash !== previous || event.hash !== expected) return res.json({ valid: false, seq: event.seq });
    previous = event.hash;
  }
  res.json({ valid: true, events: events.length, head: previous });
});

const port = process.env.PORT || 3001;
if (require.main === module) app.listen(port, () => console.log(`Synthetic pilot API listening on ${port}`));
module.exports = app;
