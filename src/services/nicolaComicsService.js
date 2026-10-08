'use strict';

const DEFAULT_BASE_URL = 'https://myzubster-mvp.onrender.com';
const ALLOWED_ACTIONS = new Set(['gallery', 'detail', 'candidate', 'next_steps']);

function baseUrl() {
  return String(process.env.NICOLA_COMICS_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
}

function clean(value, max = 2000) {
  return String(value || '').trim().slice(0, max);
}

async function askNicolaComics({ action = 'gallery', comicId = null, question = '' } = {}) {
  if (!ALLOWED_ACTIONS.has(action)) throw new Error('Unsupported Nicola Comics action');
  if (action === 'detail' && !clean(comicId, 120)) throw new Error('comicId is required for detail');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl()}/api/zorgax/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: clean(question) || 'Nicola Comics pilot',
        action,
        ...(comicId ? { comic_id: clean(comicId, 120) } : {})
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Nicola Comics HTTP ${response.status}`);
    return { ...data, upstream: 'nicola-comics', read_only: true };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { askNicolaComics, ALLOWED_ACTIONS };
