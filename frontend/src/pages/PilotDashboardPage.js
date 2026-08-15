import React, { useMemo } from 'react';

const events = [
  ['INT-001', 'Aperto', '2026-08-15T08:00:00Z'],
  ['INT-002', 'In lavorazione', '2026-08-15T08:12:00Z'],
  ['INT-003', 'Verifica', '2026-08-15T08:35:00Z'],
  ['INT-004', 'Chiuso', '2026-08-15T09:05:00Z'],
];

export default function PilotDashboardPage() {
  const metrics = useMemo(() => ({
    total: events.length,
    closed: events.filter(([, status]) => status === 'Chiuso').length,
    verification: events.filter(([, status]) => status === 'Verifica').length,
    inProgress: events.filter(([, status]) => status === 'In lavorazione').length,
  }), []);

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h2>🧩 Pilot Dashboard</h2>
        <p>Dati sintetici — demo MyZubster MVP</p>
      </div>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
        {[
          ['Interventi', metrics.total],
          ['Chiusi', metrics.closed],
          ['In verifica', metrics.verification],
          ['In lavorazione', metrics.inProgress],
        ].map(([label, value]) => (
          <div key={label} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{label}</div>
            <strong style={{ fontSize: 30 }}>{value}</strong>
          </div>
        ))}
      </section>
      <section style={{ marginTop: 28, border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th align="left">ID</th><th align="left">Stato</th><th align="left">Ultimo evento</th></tr></thead>
          <tbody>{events.map(([id, status, timestamp]) => (
            <tr key={id}>
              <td style={{ padding: 12, borderTop: '1px solid #eee' }}>{id}</td>
              <td style={{ padding: 12, borderTop: '1px solid #eee' }}>{status}</td>
              <td style={{ padding: 12, borderTop: '1px solid #eee' }}>{timestamp}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>
      <p style={{ marginTop: 20, fontSize: 13, opacity: 0.7 }}>
        Nessun dato reale, integrazione esterna o dato personale utilizzato.
      </p>
    </main>
  );
}
