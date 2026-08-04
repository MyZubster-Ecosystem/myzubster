// Garden Activity Feed API (#92)
// REST snapshot + SSE stream consumer. EventSource is browser-only.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:10000';

export const getActivityFilters = async () => {
  const res = await fetch(`${API_URL}/api/garden/activity/filters`);
  if (!res.ok) throw new Error('Failed to load activity filters');
  return res.json();
};

export const getActivitySnapshot = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.garden) params.append('garden', filters.garden);
  if (filters.plantType) params.append('plantType', filters.plantType);
  if (filters.activityType) params.append('activityType', filters.activityType);
  const res = await fetch(`${API_URL}/api/garden/activity?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load activity');
  return res.json();
};

// Open an SSE connection. Returns the EventSource so callers can close it.
export const openActivityStream = (filters = {}, { onSnapshot, onActivity }) => {
  const params = new URLSearchParams();
  if (filters.garden) params.append('garden', filters.garden);
  if (filters.plantType) params.append('plantType', filters.plantType);
  if (filters.activityType) params.append('activityType', filters.activityType);
  const url = `${API_URL}/api/garden/activity/stream?${params.toString()}`;
  const es = new EventSource(url);

  es.addEventListener('snapshot', (e) => {
    try { onSnapshot(JSON.parse(e.data)); } catch (_) { /* ignore malformed */ }
  });
  es.addEventListener('activity', (e) => {
    try { onActivity(JSON.parse(e.data)); } catch (_) { /* ignore malformed */ }
  });
  es.onerror = () => {
    // EventSource auto-reconnects; nothing to do here.
  };
  return es;
};
