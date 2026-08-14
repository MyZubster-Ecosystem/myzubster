import React, { useState, useEffect } from 'react';
import './TreasuryView.css';

const TX_ICONS = { deposit: '📥', withdrawal: '📤', transfer: '🔄', reward: '🎁' };

const TreasuryView = ({ ownerId }) => {
  const [treasuries, setTreasuries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTreasuries(); }, []);

  const fetchTreasuries = async () => {
    try {
      const res = await fetch('/api/dao/treasury?ownerId=' + ownerId);
      const data = await res.json();
      if (data.success) { setTreasuries(data.data); if (data.data.length > 0) setSelected(data.data[0]); }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (selected) fetchTransactions(selected.id);
  }, [selected]);

  const fetchTransactions = async (id) => {
    const res = await fetch('/api/dao/treasury/' + id + '/transactions');
    const data = await res.json();
    if (data.success) setTxs(data.data);
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await fetch('/api/dao/treasury/' + selected.id + '/deposit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(fd.get('amount')), from: fd.get('from') || 'manual' }),
    });
    fetchTreasuries();
    e.target.reset();
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const amount = parseFloat(fd.get('amount'));
    if (amount > (selected?.balance || 0)) { alert('Fondi insufficienti'); return; }
    await fetch('/api/dao/treasury/' + selected.id + '/withdraw', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, to: fd.get('to') || 'manual' }),
    });
    fetchTreasuries();
    e.target.reset();
  };

  const handleCreateTreasury = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await fetch('/api/dao/treasury', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fd.get('name'), ownerId, currency: fd.get('currency') || 'XMR' }),
    });
    fetchTreasuries();
    e.target.reset();
  };

  if (loading) return <div className="tv-loading">Caricamento...</div>;

  return (
    <div className="treasury-view">
      <h2>🏦 Treasury</h2>

      {treasuries.length === 0 ? (
        <form className="tv-create" onSubmit={handleCreateTreasury}>
          <input name="name" placeholder="Nome treasury" required />
          <select name="currency"><option value="XMR">XMR</option><option value="USD">USD</option></select>
          <button type="submit">Crea Treasury</button>
        </form>
      ) : (
        <>
          <div className="tv-tabs">
            {treasuries.map(t => (
              <button key={t.id} className={selected?.id === t.id ? 'active' : ''} onClick={() => setSelected(t)}>
                {t.name} ({t.balance} {t.currency})
              </button>
            ))}
          </div>

          {selected && (
            <div className="tv-detail">
              <div className="tv-balance">
                <span className="tv-balance-amount">{selected.balance}</span>
                <span className="tv-balance-currency">{selected.currency}</span>
              </div>

              <div className="tv-forms">
                <form onSubmit={handleDeposit}>
                  <h4>📥 Deposito</h4>
                  <input name="amount" type="number" step="0.01" min="0.01" placeholder="Importo" required />
                  <input name="from" placeholder="Da (opzionale)" />
                  <button type="submit">Deposita</button>
                </form>
                <form onSubmit={handleWithdraw}>
                  <h4>📤 Prelievo</h4>
                  <input name="amount" type="number" step="0.01" min="0.01" placeholder="Importo" required />
                  <input name="to" placeholder="A (opzionale)" />
                  <button type="submit">Preleva</button>
                </form>
              </div>

              <h4>📋 Transazioni ({txs.length})</h4>
              <div className="tv-tx-list">
                {txs.slice().reverse().map((tx, i) => (
                  <div key={i} className="tv-tx">
                    <span className="tv-tx-icon">{TX_ICONS[tx.type]}</span>
                    <span className="tv-tx-type">{tx.type}</span>
                    <span className="tv-tx-amount">{tx.amount} {selected.currency}</span>
                    <span className="tv-tx-date">{new Date(tx.createdAt).toLocaleDateString('it-IT')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TreasuryView;
