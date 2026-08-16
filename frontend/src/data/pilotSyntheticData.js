export const INITIAL_INTERVENTIONS = [
  { id: 'INT-001', title: 'Illuminazione area pubblica', priority: 'Alta', status: 'open', openedAt: '2026-08-15T08:00:00Z', assignedAt: null, closedAt: null },
  { id: 'INT-002', title: 'Manutenzione arredo urbano', priority: 'Media', status: 'in_progress', openedAt: '2026-08-15T08:05:00Z', assignedAt: '2026-08-15T08:12:00Z', closedAt: null },
  { id: 'INT-003', title: 'Verifica area verde', priority: 'Bassa', status: 'verification', openedAt: '2026-08-15T08:10:00Z', assignedAt: '2026-08-15T08:18:00Z', closedAt: null },
  { id: 'INT-004', title: 'Ripristino segnaletica', priority: 'Alta', status: 'closed', openedAt: '2026-08-15T07:00:00Z', assignedAt: '2026-08-15T07:15:00Z', closedAt: '2026-08-15T09:05:00Z' },
];

export const STATUS_LABELS = { open: 'Aperto', assigned: 'Preso in carico', in_progress: 'In lavorazione', verification: 'Verifica', closed: 'Chiuso' };
export const NEXT_STATUS = { open: 'assigned', assigned: 'in_progress', in_progress: 'verification', verification: 'closed', closed: null };

export const INITIAL_AUDIT = Object.fromEntries(INITIAL_INTERVENTIONS.map(item => [item.id, [
  { at: item.openedAt, actor: 'system-demo', from: null, to: 'open', action: 'CREATED' },
  ...(item.assignedAt ? [{ at: item.assignedAt, actor: 'operator-demo', from: 'open', to: item.status === 'in_progress' ? 'assigned' : 'assigned', action: 'ASSIGNED' }] : []),
  ...(item.status === 'in_progress' ? [{ at: '2026-08-15T08:20:00Z', actor: 'operator-demo', from: 'assigned', to: 'in_progress', action: 'STARTED' }] : []),
  ...(item.status === 'verification' ? [{ at: '2026-08-15T08:20:00Z', actor: 'operator-demo', from: 'assigned', to: 'in_progress', action: 'STARTED' }, { at: '2026-08-15T08:35:00Z', actor: 'operator-demo', from: 'in_progress', to: 'verification', action: 'SUBMITTED_FOR_VERIFICATION' }] : []),
  ...(item.status === 'closed' ? [{ at: '2026-08-15T08:00:00Z', actor: 'operator-demo', from: 'assigned', to: 'in_progress', action: 'STARTED' }, { at: '2026-08-15T08:45:00Z', actor: 'operator-demo', from: 'in_progress', to: 'verification', action: 'SUBMITTED_FOR_VERIFICATION' }, { at: item.closedAt, actor: 'reviewer-demo', from: 'verification', to: 'closed', action: 'CLOSED' }] : []),
]]));

export function advance(intervention) {
  const next = NEXT_STATUS[intervention.status];
  if (!next) return intervention;
  return {
    ...intervention,
    status: next,
    assignedAt: next === 'assigned' && !intervention.assignedAt ? '2026-08-15T09:10:00Z' : intervention.assignedAt,
    closedAt: next === 'closed' ? '2026-08-15T09:30:00Z' : intervention.closedAt,
  };
}

export function calculateMetrics(items) {
  const closed = items.filter(i => i.status === 'closed');
  const completionRate = items.length ? Math.round((closed.length / items.length) * 100) : 0;
  const avgCloseMinutes = closed.length ? Math.round(closed.reduce((sum, i) => sum + (new Date(i.closedAt) - new Date(i.openedAt)) / 60000, 0) / closed.length) : 0;
  return { total: items.length, closed: closed.length, completionRate, avgCloseMinutes };
}
