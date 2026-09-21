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

export function createMetaverseRoom(input) {
  return jsonRequest('/api/metaverse/rooms', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input)
  });
}

export function updateMetaverseRoom(idOrSlug, patch) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(idOrSlug)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch)
  });
}

export function getMetaverseRoomInviteStatus(idOrSlug) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(idOrSlug)}/invitations/status`, {
    headers: authHeaders()
  });
}

export function revokeMetaverseRoomInvite(idOrSlug) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(idOrSlug)}/invitations`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export function createMetaverseRoomInvite(idOrSlug) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(idOrSlug)}/invitations`, {
    method: 'POST',
    headers: authHeaders()
  });
}

export function redeemMetaverseRoomInvite(idOrSlug, code) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(idOrSlug)}/invitations/redeem`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code })
  });
}

export function createMetaverseRoomSession(roomId) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(roomId)}/sessions`, {
    method: 'POST',
    headers: authHeaders()
  });
}

export function getMetaverseRoomBlocklist(idOrSlug) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(idOrSlug)}/blocklist`, {
    headers: authHeaders()
  });
}

export function unblockMetaverseRoomParticipant(idOrSlug, participantRef) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(idOrSlug)}/blocklist/${encodeURIComponent(participantRef)}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export function getMetaverseRoomParticipants(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/participants`, {
    headers: authHeaders()
  });
}

export function moderateMetaverseRoomParticipant(sessionId, participantRef, block = false) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/participants/${encodeURIComponent(participantRef)}`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ block })
  });
}

export function getMetaverseStageStatus(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/stage`, { headers: authHeaders() });
}

export function requestMetaverseStageAccess(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/stage/requests`, { method: 'POST', headers: authHeaders() });
}

export function leaveMetaverseStage(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/stage`, { method: 'DELETE', headers: authHeaders() });
}

export function getMetaverseStageSpeakers(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/stage/speakers`, { headers: authHeaders() });
}

export function revokeMetaverseStageSpeaker(sessionId, participantRef) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/stage/speakers/${encodeURIComponent(participantRef)}`, { method: 'DELETE', headers: authHeaders() });
}

export function getMetaverseStageRequests(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/stage/requests`, { headers: authHeaders() });
}

export function resolveMetaverseStageRequest(sessionId, participantRef, approve) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/stage/requests/${encodeURIComponent(participantRef)}`, {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ approve })
  });
}

export function cancelMetaverseRoomSession(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/cancel`, {
    method: 'POST',
    headers: authHeaders()
  });
}

export function getMetaverseRoomMessages(sessionId, after = '') {
  const query = new URLSearchParams();
  if (after) query.set('after', after);
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/messages?${query.toString()}`, { headers: authHeaders() });
}

export function deleteMetaverseRoomMessage(sessionId, messageId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
}

export function reportMetaverseRoomMessage(sessionId, messageId, reason) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}/reports`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ reason })
  });
}

export function getMetaverseRoomMessageReports(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/message-reports`, { headers: authHeaders() });
}

export function resolveMetaverseRoomMessageReport(sessionId, reportId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/message-reports/${encodeURIComponent(reportId)}`, {
    method: 'PATCH', headers: authHeaders()
  });
}

export function moderateMetaverseReportedMessage(sessionId, reportId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/message-reports/${encodeURIComponent(reportId)}/message`, {
    method: 'DELETE', headers: authHeaders()
  });
}

export function sendMetaverseRoomMessage(sessionId, text) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ text })
  });
}

export function startMetaverseRoomSession(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/start`, {
    method: 'POST',
    headers: authHeaders()
  });
}

export function getMetaverseRoom(idOrSlug) {
  return jsonRequest(`/api/metaverse/rooms/${encodeURIComponent(idOrSlug)}`, {
    headers: authHeaders()
  });
}

export function getMetaverseRoomSessionEvents(sessionId, after = 0) {
  const query = new URLSearchParams({ after: String(after), limit: '50' });
  return jsonRequest(
    `/api/metaverse/sessions/${encodeURIComponent(sessionId)}/events?${query.toString()}`,
    { headers: authHeaders() }
  );
}

export function leaveMetaverseRoomSession(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/leave`, {
    method: 'POST',
    headers: authHeaders()
  });
}

export function endMetaverseRoomSession(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/end`, {
    method: 'POST',
    headers: authHeaders()
  });
}

export function joinMetaverseRoomSession(sessionId) {
  return jsonRequest(`/api/metaverse/sessions/${encodeURIComponent(sessionId)}/join`, {
    method: 'POST',
    headers: authHeaders()
  });
}

export function getMetaverseRooms() {
  return jsonRequest('/api/metaverse/rooms', {
    headers: authHeaders()
  });
}

export function getMetaverseProfile() {
  return jsonRequest('/api/metaverse/profile', {
    headers: authHeaders()
  });
}

export function recordMetaverseLandmark(landmarkId) {
  return jsonRequest('/api/metaverse/progress/landmarks', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ landmarkId })
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

export async function searchGitHubResearch(query, type = 'repositories') {
  const cleanQuery = String(query || '').trim();
  const allowedTypes = new Set(['repositories', 'issues', 'pull_requests']);
  if (cleanQuery.length < 2 || cleanQuery.length > 100) {
    throw new Error('La ricerca GitHub deve contenere da 2 a 100 caratteri');
  }
  if (!allowedTypes.has(type)) throw new Error('Tipo di ricerca GitHub non supportato');

  const endpoint = type === 'repositories' ? 'repositories' : 'issues';
  const qualifiers = type === 'pull_requests' ? ' is:pr' : type === 'issues' ? ' is:issue' : '';
  const params = new URLSearchParams({ q: cleanQuery + qualifiers, per_page: '8', sort: 'updated', order: 'desc' });
  const response = await fetch(`https://api.github.com/search/${endpoint}?${params.toString()}`, {
    headers: { Accept: 'application/vnd.github+json' }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || `GitHub search failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  return {
    totalCount: Number(payload.total_count || 0),
    items: (payload.items || []).slice(0, 8).map((item) => ({
      id: item.id,
      type,
      title: type === 'repositories' ? item.full_name : item.title,
      description: type === 'repositories' ? item.description : item.repository_url?.split('/').slice(-2).join('/'),
      url: item.html_url,
      state: item.state || null,
      language: item.language || null,
      stars: Number(item.stargazers_count || 0),
      updatedAt: item.updated_at
    }))
  };
}
