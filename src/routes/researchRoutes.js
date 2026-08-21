'use strict';

const crypto = require('crypto');
const express = require('express');
const { createResearchCrawler } = require('../services/researchCrawler');
const { createOnionFetcher, createWebFetcher } = require('../services/researchFetchers');
const { createMongoResearchStore } = require('../services/researchSearchService');
const { createResearchPolicy, parseCommaList } = require('../services/researchSearchPolicy');
const { createResearchToolRegistry } = require('../services/researchToolRegistry');

function enabled(value) {
  return String(value || '').toLowerCase() === 'true';
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function createResearchRouter({ env = process.env, store = null, fetchWeb = null, fetchOnion = null } = {}) {
  const router = express.Router();
  const featureEnabled = enabled(env.RESEARCH_SEARCH_ENABLED);
  const adminToken = String(env.RESEARCH_CRAWLER_ADMIN_TOKEN || '');
  const researchStore = store || createMongoResearchStore();
  const policy = createResearchPolicy({
    allowedHosts: parseCommaList(env.RESEARCH_CRAWLER_ALLOWED_HOSTS),
    allowedOnions: parseCommaList(env.RESEARCH_CRAWLER_ALLOWED_ONIONS),
  });
  const crawler = createResearchCrawler({
    policy,
    fetchWeb: fetchWeb || createWebFetcher(),
    fetchOnion: fetchOnion || createOnionFetcher({ socksProxy: env.TOR_SOCKS_PROXY || '127.0.0.1:9050' }),
    store: researchStore,
  });
  const tools = createResearchToolRegistry({ crawler, store: researchStore });

  function requireEnabled(req, res, next) {
    if (!featureEnabled) return res.status(503).json({ error: 'research search is disabled' });
    return next();
  }

  function requireAdmin(req, res, next) {
    if (!adminToken) return res.status(503).json({ error: 'research crawler admin token is not configured' });
    if (!secureEqual(req.get('x-research-admin-token'), adminToken)) return res.status(401).json({ error: 'unauthorized' });
    return next();
  }

  router.get('/search', requireEnabled, async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) return res.status(400).json({ error: 'missing query parameter: q' });
    const scope = ['all', 'web', 'onion'].includes(req.query.scope) ? req.query.scope : 'all';
    try {
      const results = await researchStore.search({ q, sourceType: scope, limit: req.query.limit });
      return res.json({ success: true, q, scope, results });
    } catch (error) {
      return res.status(500).json({ error: 'research search failed', detail: error.message });
    }
  });

  router.get('/status', requireEnabled, async (req, res) => {
    try {
      return res.json({ success: true, ...(await researchStore.stats()) });
    } catch (error) {
      return res.status(500).json({ error: 'research status failed', detail: error.message });
    }
  });

  router.get('/tools', requireEnabled, (req, res) => {
    return res.json({ success: true, tools: tools.list() });
  });

  router.post('/crawl', requireEnabled, requireAdmin, async (req, res) => {
    try {
      const result = await crawler.crawl({
        seed: req.body?.seed,
        maxDepth: req.body?.maxDepth,
        maxPages: req.body?.maxPages,
      });
      return res.json({ success: true, result });
    } catch (error) {
      return res.status(400).json({ error: 'research crawl rejected', detail: error.message });
    }
  });

  router.post('/tools/execute', requireEnabled, requireAdmin, async (req, res) => {
    try {
      const result = await tools.execute(req.body?.tool, req.body?.input || {});
      return res.json({ success: true, tool: req.body?.tool, result });
    } catch (error) {
      return res.status(400).json({ error: 'research tool execution rejected', detail: error.message });
    }
  });

  return router;
}

const router = createResearchRouter();
router.createResearchRouter = createResearchRouter;
router.secureEqual = secureEqual;
module.exports = router;
