import React, { useEffect, useMemo, useState } from 'react';
import {
  INITIAL_AUDIT,
  INITIAL_INTERVENTIONS,
  NEXT_STATUS,
  STATUS_LABELS,
  advance,
  calculateMetrics,
} from '../data/pilotSyntheticData';

const API_URL = (process.env.REACT_APP_PILOT_API_URL || '').replace(/\/+$/, '');
const ACTION_BY_STATUS = {
  assigned: 'ASSIGNED',
  in_progress: 'STARTED',
  verification: 'SUBMITTED_FOR_VERIFICATION',
  closed: 'CLOSED',
};

export default function PilotDashboardPage() {
  const [items, setItems] = useState(INITIAL_INTERVENTIONS);
  const [auditById, setAuditById] = useState(INITIAL_AUDIT);
  const [selectedId, setSelectedId] = useState('INT-001');
  const [apiState, setApiState] = useState(API_URL ? 'connecting' : 'demo locale');
  const audit = auditById[selectedId] || [];
  const metrics = useMemo(() => calculateMetrics(items), [items]);

  const loadItems = async () => {
    if (!API_URL) return;
    try {
      const response = await fetch(`${API_URL}/interventions`);
      if (!response.ok) throw new Error('API error');
      setItems(await response.json());
      setApiState('connected');
    } catch (_error) {
      setApiState('demo locale (fallback)');
    }
  };

  const loadAudit = async (id) => {
    if (!API_URL) return;
    try {
      const response = await fetch(`${API_URL}/interventions/${id}/audit`);
      if (!response.ok) throw new Error('API error');
      const remoteAudit = await response.json();
      setAuditById(current => ({ ...current, [id]: remoteAudit }));
    } catch (_error) {
      setApiState('demo locale (fallback)');
    }
  };

  useEffect(() => { loadItems(); }, []);
  useEffect(() => { loadAudit(selectedId); }, [selectedId]);

  const advanceLocalItem = (id) => {
    const currentItem = items.find(item => item.id === id);
    if (!currentItem) return;
    const updated = advance(currentItem);
    if (updated.status === currentItem.status) return;
    const event = {
      at: new Date().toISOString(),
      actor: 'demo-operator',
      from: currentItem.status,
      to: updated.status,
      action: ACTION_BY_STATUS[updated.status] || 'ADVANCED',
    };
    setItems(currentItems => currentItems.map(item => item.id === id ? updated : item));
    setAuditById(current => ({ ...current, [id]: [...(current[id] || []), event] }));
  };

  const advanceItem = async (id) => {
    if (!API_URL || apiState.startsWith('demo locale')) {
      advanceLocalItem(id);
      return;
    }

    try {
      const item = items.find(candidate => candidate.id === id);
      const nextStatus = item ? NEXT_STATUS[item.status] : null;
      const role = nextStatus === 'closed' ? 'reviewer' : 'operator';
      const response = await fetch(`${API_URL}/interventions/${id}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'demo-operator', role }),
      });
      if (!response.ok) throw new Error('API error');
      await loadItems();
      if (selectedId === id) await loadAudit(id);
    } catch (_error) {
      setApiState('demo locale (fallback)');
      advanceLocalItem(id);
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h2>🧩 Pilot Dashboard</h2>
        <p>Dati sintetici — workflow + API + audit trail MyZubster MVP</p>
        <small>Modalità dati: {apiState}</small>
      </div>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        {[[ 'Interventi', metrics.total ], [ 'Chiusi', metrics.closed ], [ 'Completion rate', `${metrics.completionRate}%` ], [ 'Tempo medio chiusura', `${metrics.avgCloseMinutes} min` ]].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 18 }}><div style={{ fontSize: 13, opacity: .7 }}>{label}</div><strong style={{ fontSize: 30 }}>{value}</strong></div>
        ))}
      </section>
      <section style={{ marginTop: 28, border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th align="left">ID</th><th align="left">Problema</th><th align="left">Priorità</th><th align="left">Stato</th><th align="left">Azione</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id} onClick={() => setSelectedId(item.id)} style={{ cursor: 'pointer' }}><td style={{ padding: 12, borderTop: '1px solid #eee' }}>{item.id}</td><td style={{ padding: 12, borderTop: '1px solid #eee' }}>{item.title}</td><td style={{ padding: 12, borderTop: '1px solid #eee' }}>{item.priority}</td><td style={{ padding: 12, borderTop: '1px solid #eee' }}>{STATUS_LABELS[item.status]}</td><td style={{ padding: 12, borderTop: '1px solid #eee' }}>{item.status !== 'closed' && <button onClick={(e) => { e.stopPropagation(); advanceItem(item.id); }}>Avanza workflow</button>}</td></tr>)}</tbody>
        </table>
      </section>
      <section style={{ marginTop: 28, border: '1px solid #ddd', borderRadius: 10, padding: 18 }}>
        <h3>Audit trail — {selectedId}</h3>
        {audit.length === 0 ? <p>Nessun evento registrato.</p> : <ol>{audit.map((event, index) => <li key={`${event.seq}-${index}`} style={{ marginBottom: 10 }}><strong>{event.action}</strong> — {STATUS_LABELS[event.from] || '—'} → {STATUS_LABELS[event.to]} — {event.actor} — {event.at}</li>)}</ol>}
      </section>
      <p style={{ marginTop: 20, fontSize: 13, opacity: .7 }}>Solo dati sintetici. Nessun dato reale, integrazione esterna o dato personale utilizzato.</p>
    </main>
  );
}
