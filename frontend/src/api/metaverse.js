// MyZubster World is served by the same public Express/Vercel app.
// Keep this flow strictly same-origin so a stale or insecure build-time
// REACT_APP_API_URL cannot redirect HTTPS visitors to a legacy HTTP backend.
const API_URL = '';

function authHeaders() {
  const token = localStorage.getItem('myzubster-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || payload.message || `Metaverse request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function joinMetaverse(profile) {
  return jsonRequest('/api/metaverse/join', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(profile)
  });
}

export function getMetaverseWorld() {
  return jsonRequest('/api/metaverse/world');
}

export function syncMetaverse(sessionId, cursor = null) {
  return jsonRequest('/api/metaverse/sync', {
    method: 'POST',
    body: JSON.stringify({ sessionId, cursor })
  });
}

export function moveMetaversePlayer(sessionId, x, y) {
  return jsonRequest('/api/metaverse/move', {
    method: 'POST',
    body: JSON.stringify({ sessionId, x, y })
  });
}

export function sendMetaverseChat(sessionId, text) {
  return jsonRequest('/api/metaverse/chat', {
    method: 'POST',
    body: JSON.stringify({ sessionId, text })
  });
}

export function sendMetaverseEmote(sessionId, emote) {
  return jsonRequest('/api/metaverse/emote', {
    method: 'POST',
    body: JSON.stringify({ sessionId, emote })
  });
}

export function leaveMetaverse(sessionId) {
  return jsonRequest('/api/metaverse/leave', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });
}
