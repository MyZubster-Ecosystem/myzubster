import React, { useState, useEffect } from 'react';
import './ProposalBoard.css';

const CAT_ICONS = { funding: '💰', feature: '🚀', policy: '📜', treasury: '🏦', parameter_change: '⚙️', other: '📋' };
const STATUS_COLORS = { draft: '#9e9e9e', active: '#2196f3', passed: '#4caf50', rejected: '#f44336', executed: '#9c27b0', cancelled: '#607d8b' };

const ProposalBoard = ({ userId }) => {
  const [proposals, setProposals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProposals(); }, [filter]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/dao/proposals' : '/api/dao/proposals?status=' + filter;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setProposals(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());
    body.proposerId = userId;
    if (body.votingEndsAt) body.votingEndsAt = new Date(body.votingEndsAt).toISOString();
    await fetch('/api/dao/proposals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    fetchProposals();
  };

  const publish = async (id) => {
    await fetch('/api/dao/proposals/' + id + '/publish', { method: 'POST' });
    fetchProposals();
  };

  const finalize = async (id) => {
    await fetch('/api/dao/proposals/' + id + '/finalize', { method: 'POST' });
    fetchProposals();
  };

  const execute = async (id) => {
    if (!window.confirm('Eseguire questa proposta approvata?')) return;
    await fetch('/api/dao/proposals/' + id + '/execute', { method: 'POST' });
    fetchProposals();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  if (loading) return <div className="dao-loading">Caricamento proposte...</div>;

  return (
    <div className="proposal-board">
      <div className="pb-header">
        <h2>🏛️ DAO Governance</h2>
        <button className="pb-new-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Annulla' : '➕ Nuova Proposta'}
        </button>
      </div>

      {showForm && (
        <form className="pb-form" onSubmit={handleCreate}>
          <input name="title" placeholder="Titolo proposta" required maxLength="200" />
          <textarea name="description" placeholder="Descrizione dettagliata..." required rows="4" maxLength="5000" />
          <div className="pb-form-row">
            <select name="category">
              <option value="funding">💰 Funding</option>
              <option value="feature">🚀 Feature</option>
              <option value="policy">📜 Policy</option>
              <option value="treasury">🏦 Treasury</option>
              <option value="parameter_change">⚙️ Parameter</option>
              <option value="other">📋 Other</option>
            </select>
            <input name="votingEndsAt" type="date" />
          </div>
          <button type="submit" className="pb-submit">Crea Proposta</button>
        </form>
      )}

      <div className="pb-filters">
        {['all', 'draft', 'active', 'passed', 'rejected'].map(s => (
          <button key={s} className={filter === s ? 'active' : ''} onClick={() => setFilter(s)}>
            {s === 'all' ? 'Tutte' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="pb-list">
        {proposals.length === 0 && <div className="pb-empty">Nessuna proposta</div>}
        {proposals.map(p => (
          <div key={p.id} className="pb-card">
            <div className="pb-card-top">
              <span className="pb-cat">{CAT_ICONS[p.category]}</span>
              <span className="pb-status" style={{ background: STATUS_COLORS[p.status] }}>{p.status}</span>
            </div>
            <h3 className="pb-title">{p.title}</h3>
            <p className="pb-desc">{p.description.substring(0, 150)}...</p>
            <div className="pb-stats">
              <span>👍 {p.votesFor}</span><span>👎 {p.votesAgainst}</span><span>🤷 {p.votesAbstain}</span>
              <span>📅 {formatDate(p.votingEndsAt)}</span>
            </div>
            <div className="pb-actions">
              {p.status === 'draft' && <button onClick={() => publish(p.id)}>📢 Pubblica</button>}
              {p.status === 'active' && <button onClick={() => finalize(p.id)}>📊 Finalizza</button>}
              {p.status === 'passed' && <button onClick={() => execute(p.id)}>⚡ Esegui</button>}
            </div>
            {p.comments?.length > 0 && (
              <div className="pb-comments">{p.comments.length} commento{i => i > 1 ? 'i' : ''}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProposalBoard;
