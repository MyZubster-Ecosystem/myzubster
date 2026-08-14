import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard`);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Caricamento dashboard...</div>;
  if (error) return <div style={{ padding: 20, color: '#fca5a5', textAlign: 'center' }}>Errore: {error}</div>;
  if (!data) return null;

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: 24, background: 'linear-gradient(135deg, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🌱 MyZubster Dashboard
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>
            Updated: {new Date(data.timestamp).toLocaleString('it-IT')}
          </span>
          <button onClick={fetchDashboard} style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
        <ServiceCard title="🤖 AI Automation" status={data.services.ai} />
        <ServiceCard title="📱 Telegram" status={data.services.telegram} />
        <ServiceCard title="🐙 GitHub" status={data.services.github} />
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 16, color: '#f1f5f9' }}>📋 Recent Issues Analizzati</h2>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155', marginBottom: 32, overflowX: 'auto' }}>
        {data.recentIssues.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>Nessun issue analizzato recentemente</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stato</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data.recentIssues.map(issue => (
                <tr key={issue.id} style={{ hover: '#334155' }}>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155', fontFamily: 'monospace' }}>{issue.id}</td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155' }}>{issue.type}</td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: badgeColor(issue.status).bg, color: badgeColor(issue.status).color }}>
                      {issue.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b' }}>
                    {new Date(issue.timestamp).toLocaleString('it-IT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 16, color: '#f1f5f9' }}>💰 Active Bounties</h2>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155', overflowX: 'auto' }}>
        {data.activeBounties.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: 24 }}>Nessun bounty attivo</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Titolo</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reward</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stato</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assegnato a</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scadenza</th>
              </tr>
            </thead>
            <tbody>
              {data.activeBounties.map(b => (
                <tr key={b.id}>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155', fontFamily: 'monospace' }}>{b.id}</td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155' }}>{b.title}</td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155', color: '#10b981', fontFamily: 'monospace' }}>{b.reward}</td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: badgeColor(b.status).bg, color: badgeColor(b.status).color }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155' }}>{b.assignee || '-'}</td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #334155', color: '#64748b' }}>
                    {new Date(b.expiresAt).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ title, status }) {
  const statusClass = status.status === 'online' ? 'status-online' : status.status === 'degraded' ? 'status-degraded' : 'status-offline';
  const dotClass = status.status === 'online' ? 'dot-online' : status.status === 'degraded' ? 'dot-degraded' : 'dot-offline';

  return (
    <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
      <h2 style={{ fontSize: 16, color: '#94a3b8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>{title}</h2>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 9999, fontSize: 14, fontWeight: 500, background: statusClass === 'status-online' ? '#065f46' : statusClass === 'status-degraded' ? '#78350f' : '#7f1d1d', color: statusClass === 'status-online' ? '#6ee7b7' : statusClass === 'status-degraded' ? '#fcd34d' : '#fca5a5' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusClass === 'status-online' ? '#10b981' : statusClass === 'status-degraded' ? '#f59e0b' : '#ef4444', boxShadow: statusClass === 'status-online' ? '0 0 8px #10b981' : 'none' }}></span>
        {status.status.toUpperCase()}
      </span>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #334155' }}>
        {Object.entries(status.details || {}).map(([key, value]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
            <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{String(value)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14 }}>
          <span style={{ color: '#64748b' }}>Latenza</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{status.latency}</span>
        </div>
      </div>
    </div>
  );
}

function badgeColor(status) {
  switch (status) {
    case 'open': return { bg: '#1e3a5f', color: '#60a5fa' };
    case 'in-progress': return { bg: '#1e3a5f', color: '#a78bfa' };
    case 'completed': return { bg: '#065f46', color: '#6ee7b7' };
    case 'claimed': return { bg: '#78350f', color: '#fcd34d' };
    case 'failed': return { bg: '#7f1d1d', color: '#fca5a5' };
    case 'pending': return { bg: '#451a03', color: '#fdba74' };
    default: return { bg: '#334155', color: '#e2e8f0' };
  }
}

export default Dashboard;
