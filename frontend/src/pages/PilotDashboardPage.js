import React, { useMemo, useState } from 'react';
import { INITIAL_INTERVENTIONS, INITIAL_AUDIT, STATUS_LABELS, advance, calculateMetrics } from '../data/pilotSyntheticData';

export default function PilotDashboardPage() {
  const [items, setItems] = useState(INITIAL_INTERVENTIONS);
  const [audit, setAudit] = useState(INITIAL_AUDIT);
  const [selectedId, setSelectedId] = useState('INT-001');
  const metrics = useMemo(() => calculateMetrics(items), [items]);

  const advanceItem = (id) => {
    setItems(current => current.map(item => {
      if (item.id !== id) return item;
      const next = advance(item);
      if (next.status === item.status) return item;
      const event = {
        at: next.closedAt || next.assignedAt || '2026-08-15T09:45:00Z',
        actor: next.status === 'closed' ? 'reviewer-demo' : 'operator-demo',
        from: item.status,
        to: next.status,
        action: next.status === 'closed' ? 'CLOSED' : 'STATUS_CHANGED',
      };
      setAudit(currentAudit => ({ ...currentAudit, [id]: [...(currentAudit[id] || []), event] }));
      return next;
    }));
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 24 }}><h2>🧩 Pilot Dashboard</h2><p>Dati sintetici — workflow + audit trail MyZubster MVP</p></div>
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
        <ol>{(audit[selectedId] || []).map((event, index) => <li key={`${event.at}-${index}`} style={{ marginBottom: 10 }}><strong>{event.action}</strong> — {STATUS_LABELS[event.from] || '—'} → {STATUS_LABELS[event.to]} — {event.actor} — {event.at}</li>)}</ol>
      </section>
      <p style={{ marginTop: 20, fontSize: 13, opacity: .7 }}>Solo dati sintetici. Nessun dato reale, integrazione esterna o dato personale utilizzato.</p>
    </main>
  );
}
