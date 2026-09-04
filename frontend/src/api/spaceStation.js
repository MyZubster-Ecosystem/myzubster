const SPACE_STATION_API_URL = 'https://myzubster-space-station-git-main-myzubster.vercel.app';

async function request(path, options = {}) {
  const response = await fetch(`${SPACE_STATION_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Space Station request failed (${response.status})`);
  }
  return payload;
}

export function getSpaceStationHealth() {
  return request('/api/health');
}

export function getMetaverseSpaces() {
  return request('/api/metaverse/spaces');
}

export function getMetaverseInventory(identityId) {
  return request(`/api/metaverse/inventory/${encodeURIComponent(identityId)}`);
}

export function getMetaverseBalance(identityId) {
  return request(`/api/metaverse/economy/${encodeURIComponent(identityId)}`);
}

export function getMetaverseMissions() {
  return request('/api/metaverse/missions');
}

// Mutating Space Station operations are intentionally not exposed from the
// public browser client yet. The MVP service currently has no production
// authorization boundary for inventory/economy/space writes.
