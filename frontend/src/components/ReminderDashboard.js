import React, { useState, useEffect } from 'react';
import './ReminderDashboard.css';

const TYPE_ICONS = { watering: '💧', fertilizing: '🧪', harvesting: '🌾', pruning: '✂️' };
const TYPE_LABELS = { watering: 'Irrigazione', fertilizing: 'Fertilizzazione', harvesting: 'Raccolto', pruning: 'Potatura' };

const ReminderDashboard = ({ ownerId }) => {
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [upRes, histRes] = await Promise.all([
        fetch('/api/reminders/upcoming?ownerId=' + ownerId),
        fetch('/api/reminders/history?ownerId=' + ownerId + '&limit=20'),
      ]);
      const upData = await upRes.json();
      const histData = await histRes.json();
      if (upData.success) setUpcoming(upData.data);
      if (histData.success) setHistory(histData.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleComplete = async (id) => {
    await fetch('/api/reminders/' + id + '/complete', { method: 'POST' });
    fetchAll();
  };

  const handleSkip = async (id) => {
    await fetch('/api/reminders/' + id + '/skip', { method: 'POST' });
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questo promemoria?')) return;
    await fetch('/api/reminders/' + id, { method: 'DELETE' });
    fetchAll();
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="rd-loading">Caricamento promemoria...</div>;

  return (
    <div className="reminder-dashboard">
      <div className="rd-tabs">
        <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>
          📅 Prossimi ({upcoming.length})
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          📋 Cronologia ({history.length})
        </button>
      </div>

      {tab === 'upcoming' && (
        <div className="rd-list">
          {upcoming.length === 0 && <div className="rd-empty">Nessun promemoria in programma 🎉</div>}
          {upcoming.map(r => (
            <div key={r.id} className={`rd-card rd-type-${r.type}`}>
              <div className="rd-card-header">
                <span className="rd-icon">{TYPE_ICONS[r.type]}</span>
                <div className="rd-card-info">
                  <span className="rd-type-label">{TYPE_LABELS[r.type]}</span>
                  <span className="rd-due">{formatDate(r.nextDue)}</span>
                </div>
                <span className="rd-channel">{r.channel}</span>
              </div>
              {r.notes && <p className="rd-notes">{r.notes}</p>}
              <div className="rd-card-actions">
                <button className="rd-btn-complete" onClick={() => handleComplete(r.id)}>✅ Fatto</button>
                <button className="rd-btn-skip" onClick={() => handleSkip(r.id)}>⏭ Salta</button>
                <button className="rd-btn-delete" onClick={() => handleDelete(r.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="rd-list">
          {history.length === 0 && <div className="rd-empty">Nessuna attività registrata</div>}
          {history.map(r => (
            <div key={r.id} className="rd-card rd-card-history">
              <span className="rd-icon">{TYPE_ICONS[r.type]}</span>
              <div className="rd-card-info">
                <span className="rd-type-label">{TYPE_LABELS[r.type]}</span>
                <span className="rd-history-status">{r.status === 'completed' ? '✅ Completato' : r.status === 'skipped' ? '⏭ Saltato' : '❌ Mancato'}</span>
              </div>
              <span className="rd-date">{formatDate(r.updatedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReminderDashboard;
