import React, { useEffect, useMemo, useState } from 'react';
import { getPhotoBounties, submitPhotoBounty } from '../api/photoBounties';

const tabs = [
  ['clowbot', '🤖 Clowbot / MYZ Inventions'],
  ['super', '🏆 Super Bounties'],
  ['all', '🌍 All Photo Bounties'],
];

const styles = {
  page: { padding: 24, maxWidth: 1180, margin: '0 auto', fontFamily: 'system-ui, sans-serif' },
  hero: { marginBottom: 20 },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 },
  card: { border: '1px solid #ddd', borderRadius: 14, padding: 18, background: '#fff', boxShadow: '0 3px 12px rgba(0,0,0,.06)' },
  badges: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: { fontSize: 12, padding: '4px 8px', borderRadius: 999, background: '#f1f3f5' },
  reward: { fontWeight: 800, fontSize: 22, margin: '10px 0' },
  input: { width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #bbb', marginTop: 8 },
  button: { padding: '9px 12px', borderRadius: 8, border: '1px solid #aaa', cursor: 'pointer', background: '#fff' },
  primary: { padding: '10px 14px', borderRadius: 8, border: 0, cursor: 'pointer', background: '#111', color: '#fff', marginTop: 8, width: '100%' },
};

function isClowbot(bounty) {
  return String(bounty.bountyId || '').startsWith('PB-CLOWBOT-') ||
    String(bounty.category || '').startsWith('clowbot-');
}

function isSuper(bounty) {
  return Number(bounty.requiredApprovals || 1) > 1 || Number(bounty.rewardMYZ || 0) >= 1200;
}

export default function ClowbotBountiesPage() {
  const [bounties, setBounties] = useState([]);
  const [filter, setFilter] = useState('clowbot');
  const [query, setQuery] = useState('');
  const [photoIds, setPhotoIds] = useState({});
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getPhotoBounties()
      .then(data => {
        const rows = Array.isArray(data) ? data : (data.bounties || []);
        setBounties(rows);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bounties.filter(b => {
      if (b.status && b.status !== 'active') return false;
      if (filter === 'clowbot' && !isClowbot(b)) return false;
      if (filter === 'super' && !isSuper(b)) return false;
      if (!q) return true;
      return [b.bountyId, b.title, b.description, b.category]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [bounties, filter, query]);

  async function submit(bounty) {
    const photoId = String(photoIds[bounty.bountyId] || '').trim();
    if (!photoId) {
      setStatus(s => ({ ...s, [bounty.bountyId]: 'Inserisci il photoId della prova.' }));
      return;
    }

    setStatus(s => ({ ...s, [bounty.bountyId]: 'Invio in revisione…' }));
    try {
      const result = await submitPhotoBounty(bounty.bountyId, photoId);
      const reward = result.reward || result;
      setStatus(s => ({
        ...s,
        [bounty.bountyId]: `✅ Submission ricevuta${reward.status ? ` — ${reward.status}` : ''}.`,
      }));
    } catch (err) {
      setStatus(s => ({ ...s, [bounty.bountyId]: `❌ ${err.message}` }));
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <h2 style={{ marginBottom: 6 }}>🤖 Clowbot / MYZ Invention Bounties</h2>
        <p style={{ marginTop: 0 }}>
          Documenta prototipi, robotica, riciclo, accessibilità, energia e invenzioni aperte.
          Le submission vengono verificate prima dell'accredito MYZ.
        </p>
      </section>

      <div style={styles.tabs}>
        {tabs.map(([value, label]) => (
          <button
            key={value}
            style={{ ...styles.button, fontWeight: filter === value ? 800 : 400 }}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        style={{ ...styles.input, marginBottom: 18 }}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Cerca bounty, categoria o invenzione…"
      />

      {loading && <p>Caricamento bounty…</p>}
      {error && <p>❌ {error}</p>}
      {!loading && !error && visible.length === 0 && <p>Nessun bounty disponibile.</p>}

      <section style={styles.grid}>
        {visible.map(b => {
          const rules = b.evidenceRules || {};
          const superBounty = isSuper(b);
          return (
            <article key={b.bountyId} style={styles.card}>
              <div style={styles.badges}>
                {isClowbot(b) && <span style={styles.badge}>🤖 CLOWBOT</span>}
                {superBounty && <span style={styles.badge}>🏆 SUPER BOUNTY</span>}
                {b.requiresManualReview && <span style={styles.badge}>👀 MANUAL REVIEW</span>}
                {b.sensitivity && <span style={styles.badge}>{String(b.sensitivity).toUpperCase()}</span>}
              </div>

              <small>{b.bountyId}</small>
              <h3>{b.title}</h3>
              <p>{b.description}</p>
              <div style={styles.reward}>{Number(b.rewardMYZ || 0).toLocaleString()} MYZ</div>

              <p>
                <strong>Categoria:</strong> {b.category || '—'}<br />
                <strong>Prove minime:</strong> {rules.minPhotos || 1} foto<br />
                <strong>Reviewer richiesti:</strong> {b.requiredApprovals || 1}<br />
                <strong>Posti:</strong> {b.winners || 0}/{b.maxWinners || '∞'}
              </p>

              {rules.instructions && (
                <details>
                  <summary>Regole di evidenza</summary>
                  <p>{rules.instructions}</p>
                </details>
              )}

              <label>
                <strong>Invia la tua prova</strong>
                <input
                  style={styles.input}
                  value={photoIds[b.bountyId] || ''}
                  onChange={e => setPhotoIds(ids => ({ ...ids, [b.bountyId]: e.target.value }))}
                  placeholder="photoId"
                />
              </label>

              <button style={styles.primary} onClick={() => submit(b)}>
                📸 Submit bounty
              </button>

              {status[b.bountyId] && <p>{status[b.bountyId]}</p>}
            </article>
          );
        })}
      </section>
    </main>
  );
}
