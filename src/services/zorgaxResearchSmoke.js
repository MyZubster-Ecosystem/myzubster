'use strict';

const DEFAULT_BASE_URL = 'http://127.0.0.1:5003';
const DEFAULT_TIMEOUT_MS = 15000;

function normalizeScope(value) {
  return ['all', 'web', 'onion'].includes(value) ? value : 'all';
}

function clampLimit(value, fallback = 3) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(8, Math.floor(parsed)));
}

function assertLoopbackBaseUrl(value) {
  const url = new URL(String(value || DEFAULT_BASE_URL));
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('smoke base URL must use http or https');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
    throw new Error('smoke base URL must be loopback-only');
  }
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

async function fetchJson(fetchImpl, url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function createZorgaxResearchSmoke({
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = global.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch implementation is required');
  const base = assertLoopbackBaseUrl(baseUrl);

  async function preflight({ query, scope = 'all', limit = 3 } = {}) {
    const q = String(query || '').trim();
    if (!q) throw new Error('smoke query is required');
    const normalizedScope = normalizeScope(scope);
    const normalizedLimit = clampLimit(limit);

    const zorgaxStatus = await fetchJson(fetchImpl, `${base}/api/zorgax/status`, {}, timeoutMs);
    const researchStatus = await fetchJson(fetchImpl, `${base}/api/research/status`, {}, timeoutMs);
    const retrievalUrl = new URL(`${base}/api/zorgax/research`);
    retrievalUrl.searchParams.set('q', q);
    retrievalUrl.searchParams.set('scope', normalizedScope);
    retrievalUrl.searchParams.set('limit', String(normalizedLimit));
    const retrieval = await fetchJson(fetchImpl, retrievalUrl.toString(), {}, timeoutMs);

    const sources = Array.isArray(retrieval.body?.sources) ? retrieval.body.sources : [];
    return {
      baseUrl: base,
      query: q,
      scope: normalizedScope,
      limit: normalizedLimit,
      zorgaxStatus,
      researchStatus,
      retrieval,
      sources,
      readyForGroundedChat: Boolean(
        zorgaxStatus.ok &&
        researchStatus.ok &&
        retrieval.ok &&
        sources.length > 0
      ),
      crawlPerformed: false,
    };
  }

  async function run({ query, scope = 'all', limit = 3 } = {}) {
    const check = await preflight({ query, scope, limit });
    if (!check.readyForGroundedChat) {
      return {
        ...check,
        chat: null,
        reason: check.sources.length === 0
          ? 'no indexed source matched the smoke query; no crawl was performed'
          : 'one or more local preflight checks failed',
      };
    }

    const chat = await fetchJson(fetchImpl, `${base}/api/zorgax/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: check.query,
        useMemory: false,
        useObservations: false,
        useResearch: true,
        researchScope: check.scope,
        researchLimit: check.limit,
      }),
    }, timeoutMs);

    const researchUsed = Array.isArray(chat.body?.research_used) ? chat.body.research_used : [];
    const researchSources = Array.isArray(chat.body?.research_sources) ? chat.body.research_sources : [];
    return {
      ...check,
      chat,
      grounded: Boolean(
        chat.ok &&
        chat.body?.ok === true &&
        researchUsed.length > 0 &&
        researchSources.length > 0 &&
        chat.body?.research_crawl_performed === false
      ),
      researchUsed,
      researchSources,
      crawlPerformed: false,
    };
  }

  return { preflight, run };
}

module.exports = {
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  assertLoopbackBaseUrl,
  clampLimit,
  createZorgaxResearchSmoke,
  fetchJson,
  normalizeScope,
};
