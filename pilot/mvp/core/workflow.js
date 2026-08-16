const STATES = Object.freeze(['open', 'assigned', 'in_progress', 'verification', 'closed']);

const TRANSITIONS = Object.freeze({
  open: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['verification'],
  verification: ['closed'],
  closed: []
});

function transition(intervention, nextState, actor, at, reason = null) {
  if (!TRANSITIONS[intervention.state]?.includes(nextState)) {
    throw new Error(`Invalid transition: ${intervention.state} -> ${nextState}`);
  }
  if (!actor || !at) throw new Error('actor and at are required');
  const event = {
    id: `EVT-${intervention.events.length + 1}`,
    interventionId: intervention.id,
    at,
    actor,
    action: `transition_to_${nextState}`,
    from: intervention.state,
    to: nextState,
    reason
  };
  intervention.state = nextState;
  intervention.events = [...intervention.events, Object.freeze(event)];
  return intervention;
}

function minutesBetween(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000);
}

function calculateKpis(interventions) {
  const completed = interventions.filter(i => i.closedAt);
  const open = interventions.filter(i => !i.closedAt);
  const takeTimes = interventions.filter(i => i.takenAt).map(i => minutesBetween(i.openedAt, i.takenAt));
  const closeTimes = completed.map(i => minutesBetween(i.openedAt, i.closedAt));
  const withinSla = completed.filter(i => minutesBetween(i.openedAt, i.closedAt) <= i.slaMinutes).length;
  const total = interventions.length;
  const avg = values => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  return {
    total,
    open: open.length,
    completed: completed.length,
    completionRate: total ? Number((completed.length / total).toFixed(2)) : 0,
    slaCompliance: completed.length ? Number((withinSla / completed.length).toFixed(2)) : 0,
    avgMinutesToTake: avg(takeTimes),
    avgMinutesToClose: avg(closeTimes)
  };
}

function createIntervention(input) {
  const required = ['id', 'category', 'priority', 'area', 'openedAt'];
  for (const key of required) if (!input[key]) throw new Error(`${key} is required`);
  return {
    ...input,
    state: 'open',
    events: Object.freeze([Object.freeze({
      id: 'EVT-1',
      interventionId: input.id,
      at: input.openedAt,
      actor: 'system',
      action: 'created',
      from: null,
      to: 'open',
      reason: null
    })])
  };
}

module.exports = { STATES, TRANSITIONS, transition, createIntervention, calculateKpis, minutesBetween };
