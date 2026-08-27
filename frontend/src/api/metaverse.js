const API_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

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
    throw new Error(payload.error || `Metaverse request failed (${response.status})`);
  }
  return payload;
}

export function joinMetaverse(profile) {
  return jsonRequest('/api/metaverse/join', {
    method: 'POST',
    body: JSON.stringify(profile)
  });
}

export function getMetaverseWorld() {
  return jsonRequest('/api/metaverse/world');
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

export function createMetaverseEventSource(sessionId) {
  return new EventSource(`${API_URL}/api/metaverse/events?sessionId=${encodeURIComponent(sessionId)}`);
}
