import React, { useMemo, useState } from 'react';
import { INITIAL_INTERVENTIONS, STATUS_LABELS, advance, calculateMetrics } from '../data/pilotSyntheticData';

export default function PilotDashboardPage() {
  const [items, setItems] = useState(INITIAL_INTERVENTIONS);
  const metrics = useMemo(() => calculateMetrics(items), [items]);

  const advanceItem = (id) => setItems(current => current.map(item => item.id === id ? advance(item) : item));

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h2>🧩 Pilot Dashboard</h2>
        <p>Dati sintetici — workflow interattivo MyZubster MVP</p>
      </div>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        {[
          ['Interventi', metrics.total],
          ['Chiusi', metrics.closed],
          ['Completion rate', `${metrics.completionRate}%`],
          ['Tempo medio chiusura', `${metrics.avgCloseMinutes} min`],
        ].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{label}</div>
            <strong style={{ fontSize: 30 }}>{value}</strong>
          </div>
        ))}
      </section>
      <section style={{ marginTop: 28, border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th align="left">ID</th><th align="left">Problema</th><th align="left">Priorità</th><th align="left">Stato</th><th align="left">Azione</th></tr></thead>
          <tbody>{items.map(item => (
            <tr key={item.id}>
              <td style={{ padding: 12, borderTop: '1px solid #eee' }}>{item.id}</td>
              <td style={{ padding: 12, borderTop: '1px solid #eee' }}>{item.title}</td>
              <td style={{ padding: 12, borderTop: '1px solid #eee' }}>{item.priority}</td>
              <td style={{ padding: 12, borderTop: '1px solid #eee' }}>{STATUS_LABELS[item.status]}</td>
              <td style={{ padding: 12, borderTop: '1px solid #eee' }}>
                {item.status !== 'closed' && <button onClick={() => advanceItem(item.id)}>Avanza workflow</button>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </section>
      <p style={{ marginTop: 20, fontSize: 13, opacity: 0.7 }}>
        Solo dati sintetici. Nessun dato reale, integrazione esterna o dato personale utilizzato.
      </p>
    </main>
  );
}
