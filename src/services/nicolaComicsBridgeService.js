const DEFAULT_BASE_URL = 'https://myzubster-mvp.onrender.com';
const ALLOWED_ACTIONS = new Set(['gallery', 'detail', 'candidate', 'next_steps']);

function baseUrl() {
  return String(process.env.NICOLA_COMICS_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function normalizeAction(value) {
  const action = String(value || 'gallery').trim().toLowerCase();
  if (!ALLOWED_ACTIONS.has(action)) throw new Error('Azione Nicola Comics non supportata');
  return action;
}

async function askNicolaComics({ question, action, comicId, fetchImpl = global.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('Fetch non disponibile');
  const safeAction = normalizeAction(action);
  if (safeAction === 'detail' && !comicId) throw new Error('comic_id obbligatorio per detail');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(`${baseUrl()}/api/zorgax/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: String(question || 'Mostrami i fumetti di Nicola').slice(0, 1000),
        action: safeAction,
        ...(comicId ? { comic_id: String(comicId).slice(0, 120) } : {})
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Pilot Nicola Comics HTTP ${response.status}`);
    const data = await response.json();
    return {
      ...data,
      bridge: 'nicola-comics-read-only',
      upstream: baseUrl(),
      read_only: true
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { askNicolaComics, normalizeAction, baseUrl };
