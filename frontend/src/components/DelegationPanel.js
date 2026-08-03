import React, { useState, useEffect } from 'react';
import './DelegationPanel.css';

const DelegationPanel = ({ userId }) => {
  const [delegations, setDelegations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDelegations(); }, []);

  const fetchDelegations = async () => {
    try {
      const res = await fetch('/api/dao/delegate?delegatorId=' + userId);
      const data = await res.json();
      if (data.success) setDelegations(data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = {
      delegatorId: userId,
      delegateId: fd.get('delegateId'),
      tokenWeight: parseInt(fd.get('tokenWeight')) || 100,
      scope: fd.get('scope') || 'all',
    };
    const res = await fetch('/api/dao/delegate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) { alert(data.message); return; }
    setShowForm(false);
    fetchDelegations();
  };

  const revoke = async (id) => {
    if (!window.confirm('Revocare questa delega?')) return;
    await fetch('/api/dao/delegate/' + id, { method: 'DELETE' });
    fetchDelegations();
  };

  if (loading) return <div className="dp-loading">Caricamento...</div>;

  return (
    <div className="delegation-panel">
      <div className="dp-header">
        <h2>🤝 Deleghe</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕' : '➕ Nuova Delega'}
        </button>
      </div>

      {showForm && (
        <form className="dp-form" onSubmit={handleCreate}>
          <input name="delegateId" placeholder="ID del delegato" required />
          <input name="tokenWeight" type="number" min="1" placeholder="Peso token" />
          <select name="scope">
            <option value="all">Tutte le categorie</option>
            <option value="funding">Funding</option>
            <option value="feature">Feature</option>
            <option value="treasury">Treasury</option>
          </select>
          <button type="submit">Crea Delega</button>
        </form>
      )}

      <div className="dp-list">
        {delegations.length === 0 && <div className="dp-empty">Nessuna delega attiva</div>}
        {delegations.map(d => (
          <div key={d.id} className="dp-card">
            <div className="dp-card-info">
              <span className="dp-arrow">→</span>
              <div>
                <span className="dp-delegate">{d.delegateId.substring(0, 12)}...</span>
                <span className="dp-meta">{d.tokenWeight} token • {d.scope}</span>
              </div>
            </div>
            <button className="dp-revoke" onClick={() => revoke(d.id)}>Revoca</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DelegationPanel;
