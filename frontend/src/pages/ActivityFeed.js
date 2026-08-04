import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getActivityFilters, openActivityStream } from '../api/gardenActivity';
import './ActivityFeed.css';

const TYPE_ICON = {
  plant_added: '🌱',
  plant_updated: '✏️',
  harvest: '🧺',
  comment: '💬'
};

const TYPE_LABEL = {
  plant_added: 'Plant added',
  plant_updated: 'Plant updated',
  harvest: 'Harvest',
  comment: 'Comment'
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ActivityItem({ item }) {
  return (
    <div className="af-item">
      <div className="af-avatar" style={{ background: item.actor.avatarColor }}>
        {item.actor.initials || item.actor.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="af-body">
        <div className="af-line">
          <span className="af-actor">{item.actor.name}</span>{' '}
          <span className="af-msg">{item.message}</span>
        </div>
        <div className="af-meta">
          <span className={`af-chip af-type-${item.type}`}>
            {TYPE_ICON[item.type]} {TYPE_LABEL[item.type]}
          </span>
          <span>📍 {item.garden}</span>
          <span>🌿 {item.plantType}</span>
          <span>🕒 {timeAgo(item.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [filters, setFilters] = useState({ garden: '', plantType: '', activityType: '' });
  const [options, setOptions] = useState({ gardens: [], plantTypes: [], activityTypes: [] });
  const [notifOn, setNotifOn] = useState(false);
  const [unread, setUnread] = useState(0);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  // Load filter options once.
  useEffect(() => {
    getActivityFilters()
      .then((data) => {
        setOptions({
          gardens: data.gardens || [],
          plantTypes: data.plantTypes || [],
          activityTypes: data.activityTypes || []
        });
      })
      .catch(() => {});
  }, []);

  const handleActivity = useCallback((item) => {
    setActivities((prev) => [item, ...prev].slice(0, 200));
    setUnread((u) => u + 1);
    if (
      notifOn &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(`${item.actor.name} ${TYPE_LABEL[item.type]}`, {
          body: item.message
        });
      } catch (e) {
        /* notifications may be blocked in some contexts */
      }
    }
  }, [notifOn]);

  // Open / reopen the SSE stream whenever filters change.
  useEffect(() => {
    const es = openActivityStream(filters, {
      onSnapshot: (data) => {
        setActivities(Array.isArray(data) ? data : data.data || []);
        setConnected(true);
      },
      onActivity: handleActivity
    });
    esRef.current = es;
    es.onerror = () => setConnected(false);
    return () => {
      es.close();
      esRef.current = null;
    };
  }, [filters, handleActivity]);

  const toggleNotifications = () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      setNotifOn((v) => !v);
      setUnread(0);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          setNotifOn(true);
          setUnread(0);
        }
      });
    }
  };

  const onFilter = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  };

  return (
    <div className="af-root">
      <div className="af-container">
        <div className="af-header">
          <div>
            <h1 className="af-title">🌿 Garden Activity Feed</h1>
            <p className="af-sub">Real-time updates across all gardens</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="af-live">
              <span className="dot" />
              {connected ? 'Live' : 'Connecting…'}
            </span>
            <button
              className={`af-notify-btn ${notifOn ? 'on' : ''}`}
              onClick={toggleNotifications}
              title="Toggle browser notifications"
            >
              {notifOn ? '🔔 Notifications on' : '🔕 Notify me'}
              {unread > 0 && <span className="af-badge">{unread > 99 ? '99+' : unread}</span>}
            </button>
          </div>
        </div>

        <div className="af-filters">
          <div className="af-field">
            <label>Garden</label>
            <select value={filters.garden} onChange={onFilter('garden')}>
              <option value="">All gardens</option>
              {options.gardens.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="af-field">
            <label>Plant type</label>
            <select value={filters.plantType} onChange={onFilter('plantType')}>
              <option value="">All types</option>
              {options.plantTypes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="af-field">
            <label>Activity</label>
            <select value={filters.activityType} onChange={onFilter('activityType')}>
              <option value="">All activity</option>
              {options.activityTypes.map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="af-feed">
          {activities.length === 0 ? (
            <div className="af-empty">No activity yet — waiting for the first event…</div>
          ) : (
            activities.map((item) => <ActivityItem key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityFeed;
