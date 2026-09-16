'use strict';

const DEFAULT_BASE_URL = 'https://myzubster-mvp.onrender.com';
const ALLOWED_ACTIONS = new Set(['gallery', 'detail', 'candidate', 'next_steps']);
const MAX_SOURCES = 10;
const REQUEST_TIMEOUT_MS = 10000;

class NicolaComicsBridgeError extends Error {
  constructor(message, statusCode = 502, code = 'NICOLA_COMICS_UPSTREAM_ERROR') {
    super(message);
    this.name = 'NicolaComicsBridgeError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function configuredBaseUrl() {
  const raw = clean(process.env.NICOLA_COMICS_BASE_URL || DEFAULT_BASE_URL, 500).replace(/\/+$/, '');
  let url;
  try {
    url = new URL(raw);
  } catch (_error) {
    throw new NicolaComicsBridgeError('Configurazione Nicola Comics non valida', 500, 'NICOLA_COMICS_CONFIG_INVALID');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new NicolaComicsBridgeError('Configurazione Nicola Comics non sicura', 500, 'NICOLA_COMICS_CONFIG_INVALID');
  }
  return url.origin;
}

function normalizeAction(value) {
  const action = clean(value || 'gallery', 40);
  if (!ALLOWED_ACTIONS.has(action)) {
    throw new NicolaComicsBridgeError('Azione Nicola Comics non supportata', 400, 'NICOLA_COMICS_ACTION_INVALID');
  }
  return action;
}

function nullableString(value, max = 500) {
  if (value === null || value === undefined || value === '') return null;
  return clean(value, max);
}

function safeHttpsUrl(value) {
  const raw = nullableString(value, 1000);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch (_error) {
    return null;
  }
}

function sanitizeSource(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
  return {
    comic_id: nullableString(source.comic_id || source.id, 120),
    title: nullableString(source.title, 300),
    description: nullableString(source.description, 1200),
    image_url: safeHttpsUrl(source.image_url),
    detail_url: safeHttpsUrl(source.detail_url),
    nft_status: nullableString(source.nft_status, 80),
    selection_status: nullableString(source.selection_status || source.review_status || source.status, 80),
    rights_status: nullableString(source.rights_status, 80),
    contract_address: nullableString(source.contract_address, 200),
    token_id: nullableString(source.token_id, 200),
    transaction_hash: nullableString(source.transaction_hash, 200),
    network: nullableString(source.network, 100),
    metadata_uri: safeHttpsUrl(source.metadata_uri)
  };
}

function sanitizePayload(payload, action) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new NicolaComicsBridgeError('Risposta Nicola Comics non valida');
  }
  const returnedAction = clean(payload.action || action, 40);
  if (returnedAction !== action) {
    throw new NicolaComicsBridgeError('Risposta Nicola Comics incoerente');
  }
  const sources = (Array.isArray(payload.sources) ? payload.sources : [])
    .slice(0, MAX_SOURCES)
    .map(sanitizeSource)
    .filter(Boolean);
  return {
    action,
    answer: clean(payload.answer, 4000),
    sources,
    source_count: sources.length,
    upstream: 'nicola-comics',
    read_only: true
  };
}

async function askNicolaComics({ action = 'gallery', comicId = null, question = '', fetchImpl = global.fetch } = {}) {
  const safeAction = normalizeAction(action);
  const safeComicId = nullableString(comicId, 120);
  if (safeAction === 'detail' && !safeComicId) {
    throw new NicolaComicsBridgeError('comicId è obbligatorio per detail', 400, 'NICOLA_COMICS_COMIC_ID_REQUIRED');
  }
  if (typeof fetchImpl !== 'function') {
    throw new NicolaComicsBridgeError('Client HTTP Nicola Comics non disponibile', 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(new URL('/api/zorgax/ask', configuredBaseUrl()).href, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: clean(question, 500) || 'Nicola Comics pilot',
        action: safeAction,
        ...(safeComicId ? { comic_id: safeComicId } : {})
      }),
      signal: controller.signal
    });
    if (!response?.ok) {
      throw new NicolaComicsBridgeError(`Servizio Nicola Comics non disponibile (HTTP ${response?.status || 'unknown'})`);
    }
    const payload = await response.json().catch(() => {
      throw new NicolaComicsBridgeError('Risposta Nicola Comics non JSON');
    });
    return sanitizePayload(payload, safeAction);
  } catch (error) {
    if (error instanceof NicolaComicsBridgeError) throw error;
    if (error?.name === 'AbortError') {
      throw new NicolaComicsBridgeError('Timeout del servizio Nicola Comics');
    }
    throw new NicolaComicsBridgeError('Servizio Nicola Comics temporaneamente non disponibile');
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  askNicolaComics,
  ALLOWED_ACTIONS,
  NicolaComicsBridgeError,
  sanitizePayload
};
