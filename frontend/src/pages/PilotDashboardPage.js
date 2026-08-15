import React, { useEffect, useMemo, useState } from 'react';
import { STATUS_LABELS, calculateMetrics } from '../data/pilotSyntheticData';

const API_URL = process.env.REACT_APP_PILOT_API_URL || 'http://localhost:3001';

export default function PilotDashboardPage() {
  const [items, setItems] = useState([]);
  const [audit, setAudit] = useState([]);
  const [selectedId, setSelectedId] = useState('INT-001');
  const [apiState, setApiState] = useState('connecting');
  const metrics = useMemo(() => calculateMetrics(items), [items]);

  const loadItems = async () => {
    try {
      const response = await fetch(`${API_URL}/interventions`);
      if (!response.ok) throw new Error('API error');
      setItems(await response.json());
      setApiState('connected');
    } catch (_error) {
      setApiState('offline');
    }
  };

  const loadAudit = async (id) => {
    try {
      const response = await fetch(`${API_URL}/interventions/${id}/audit`);
      if (!response.ok) throw new Error('API error');
      setAudit(await response.json());
    } catch (_error) {
      setAudit([]);
    }
  };

  useEffect(() => { loadItems(); }, []);
  useEffect(() => { loadAudit(selectedId); }, [selectedId]);

  const advanceItem = async (id) => {
    const role = id === selectedId ? 'operator' : 'operator';
    const response = await fetch(`${API_URL}/interventions/${id}/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor: 'demo-operator', role }),
    });
    if (!response.ok) return;
    await loadItems();
    if (selectedId === id) await loadAudit(id);
  };

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h2>🧩 Pilot Dashboard</h2>
        <p>Dati sintetici — workflow + API + audit trail MyZubster MVP</p>
        <small>API: {apiState}</small>
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
