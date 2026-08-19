import React, { useEffect, useState } from 'react';
import { getBotAvatarManifest } from '../api/botAvatars';

const styles = {
  page: { padding: 24, maxWidth: 1180, margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  hero: { marginBottom: 22 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 },
  card: { border: '1px solid #dbe3ea', borderRadius: 16, padding: 18, background: '#fff', boxShadow: '0 6px 18px rgba(15, 23, 42, .07)' },
  avatar: { width: 108, height: 108, borderRadius: '50%', objectFit: 'cover', display: 'block', marginBottom: 14, border: '3px solid #d1fae5', background: '#0f172a' },
  meta: { fontSize: 12, opacity: .68, marginTop: 6 },
  badge: { display: 'inline-flex', padding: '4px 8px', borderRadius: 999, background: '#ecfdf5', color: '#047857', fontSize: 12, fontWeight: 700 },
  note: { marginTop: 22, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13 },
};

export default function AgentsPage() {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getBotAvatarManifest()
      .then(setManifest)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <h2 style={{ marginBottom: 6 }}>🤖 MyZubster AI & Bot Network</h2>
        <p style={{ marginTop: 0 }}>
          Identità visuali caricate dal manifest canonico del backend. Ogni agente usa il proprio avatar e ruolo registrato nei metadata.
        </p>
      </section>

      {loading && <p>Caricamento agenti…</p>}
      {error && <p>❌ Impossibile caricare gli avatar: {error}</p>}

      {!loading && !error && manifest && (
        <>
          <section style={styles.grid}>
            {manifest.agents.map(agent => (
              <article key={agent.id} style={styles.card}>
                <img
                  src={agent.avatarUrl}
                  alt={`Avatar di ${agent.displayName}`}
                  style={styles.avatar}
                  loading="lazy"
                />
                <span style={styles.badge}>{String(agent.type || 'agent').toUpperCase()}</span>
                <h3 style={{ marginBottom: 6 }}>{agent.displayName}</h3>
                <p style={{ marginTop: 0 }}>{agent.role}</p>
                <div style={styles.meta}><strong>ID:</strong> {agent.id}</div>
                <div style={styles.meta}><strong>MYZ:</strong> {agent.myzEnabled ? 'internal ledger enabled' : 'not enabled'}</div>
              </article>
            ))}
          </section>

          <div style={styles.note}>
            <strong>MYZ policy:</strong> {manifest.myz?.note || 'Internal platform ledger metadata only.'}
            {' '}Automatic credit: {manifest.myz?.automaticCredit ? 'yes' : 'no'}; automatic settlement: {manifest.myz?.automaticSettlement ? 'yes' : 'no'}.
          </div>
        </>
      )}
    </main>
  );
}
