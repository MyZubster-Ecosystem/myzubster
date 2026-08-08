import React, { useState, useEffect, useRef } from 'react';
import { fetchActivities, getActivityStreamUrl } from '../api/activities';
import './ActivityFeed.css';

const TYPE_LABELS = {
  plant_added: '🌱 ha piantato',
  plant_updated: '✏️ ha aggiornato',
  harvest: '🧺 ha raccolto',
  comment: '💬 ha commentato',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'adesso';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min fa`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h fa`;
  const day = Math.floor(hr / 24);
  return `${day} g fa`;
}

const ActivityFeed = ({ gardenId }) => {
  const [activities, setActivities] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchActivities({ garden: gardenId, type: typeFilter, limit: 30 });
        if (!cancelled && res.success) {
          setActivities(res.data);
        }
      } catch (err) {
        console.error('Errore caricamento attivita:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [gardenId, typeFilter]);

  useEffect(() => {
    let es;
    try {
      es = new EventSource(getActivityStreamUrl());
      es.onopen = () => setLive(true);
      es.onerror = () => setLive(false);
      es.onmessage = (e) => {
        try {
          const item = JSON.parse(e.data);
          if (gardenId && item.gardenId !== gardenId) return;
          if (typeFilter && item.type !== typeFilter) return;
          setActivities((prev) => {
            if (prev.some((a) => a.id === item.id)) return prev;
            return [item, ...prev].slice(0, 50);
          });
        } catch (_) { /* ignore malformed frame */ }
      };
      esRef.current = es;
    } catch (_) {
      setLive(false);
    }
    return () => {
      if (esRef.current) esRef.current.close();
    };
  }, [gardenId, typeFilter]);

  if (loading) return <div className="feed-loading">Caricamento attività…</div>;

  return (
    <div className="activity-feed">
      <div className="feed-header">
        <h3>
          📡 Attività {live && <span className="live-dot" title="Live">●</span>}
        </h3>
        <select
          className="feed-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Tutte</option>
          <option value="plant_added">Piantature</option>
          <option value="plant_updated">Aggiornamenti</option>
          <option value="harvest">Raccolti</option>
          <option value="comment">Commenti</option>
        </select>
      </div>

      {activities.length === 0 ? (
        <div className="feed-empty">Nessuna attività ancora. Sii il primo! 🌿</div>
      ) : (
        <ul className="feed-list">
          {activities.map((a) => (
            <li key={a.id} className="feed-item">
              {a.actor?.avatar ? (
                <img className="feed-avatar" src={a.actor.avatar} alt={a.actor.name} />
              ) : (
                <div className="feed-avatar feed-avatar--fallback">
                  {(a.actor?.name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="feed-body">
                <div className="feed-line">
                  <strong>{a.actor?.name || 'Anonimo'}</strong>{' '}
                  <span className="feed-action">{TYPE_LABELS[a.type] || a.type}</span>
                  {a.plantType && <span className="feed-plant"> · {a.plantType}</span>}
                </div>
                {a.message && <div className="feed-message">{a.message}</div>}
                <div className="feed-time">{timeAgo(a.createdAt)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityFeed;
