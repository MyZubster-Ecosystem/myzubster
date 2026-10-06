const ALLOWED_EVENTS = new Set([
  'metaverse_onboarding_view',
  'metaverse_space_station_open',
  'metaverse_missions_open',
  'metaverse_marketplace_open',
  'metaverse_contribution_docs_open',
  'metaverse_return_visit'
]);

const SAFE_KEYS = new Set(['source', 'destination', 'surface']);

function sanitizeProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key, value]) => SAFE_KEYS.has(key) && typeof value === 'string')
      .map(([key, value]) => [key, value.slice(0, 64)])
  );
}

export function trackMetaverseEvent(name, properties = {}) {
  if (!ALLOWED_EVENTS.has(name) || typeof window === 'undefined') return false;

  const safeProperties = sanitizeProperties(properties);
  if (typeof window.va === 'function') {
    window.va('event', { name, data: safeProperties });
    return true;
  }

  return false;
}

export const METAVERSE_EVENTS = Object.freeze({
  ONBOARDING_VIEW: 'metaverse_onboarding_view',
  SPACE_STATION_OPEN: 'metaverse_space_station_open',
  MISSIONS_OPEN: 'metaverse_missions_open',
  MARKETPLACE_OPEN: 'metaverse_marketplace_open',
  CONTRIBUTION_DOCS_OPEN: 'metaverse_contribution_docs_open',
  RETURN_VISIT: 'metaverse_return_visit'
});
