const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ZorgaxMemory = require('../models/ZorgaxMemory');
const { createMongoResearchStore } = require('../services/researchSearchService');
const { createZorgaxResearchRag, ensureResearchCitationContract } = require('../services/zorgaxResearchRag');

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const SYSTEM_PROMPT_PATH = path.join(__dirname, '..', '..', 'agents', 'zorgax', 'SYSTEM_PROMPT.md');
const PROFILE_PATH = path.join(__dirname, '..', '..', 'config', 'entities', 'zorgax.json');
const OBSERVATIONS_PATH = path.join(__dirname, '..', '..', 'data', 'observations.json');
const MEMORY_TTL_DAYS = Math.max(1, Math.min(Number(process.env.ZORGAX_MEMORY_TTL_DAYS) || 90, 365));
const MEMORY_CONTEXT_LIMIT = 8;
const OBSERVATION_CONTEXT_LIMIT = 5;
const RESEARCH_CONTEXT_LIMIT = Math.max(1, Math.min(Number(process.env.ZORGAX_RESEARCH_CONTEXT_LIMIT) || 5, 8));
const RESEARCH_SEARCH_ENABLED = String(process.env.RESEARCH_SEARCH_ENABLED || '').toLowerCase() === 'true';
const researchRag = createZorgaxResearchRag({
  store: createMongoResearchStore(),
  enabled: RESEARCH_SEARCH_ENABLED
});

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readProfile() {
  return JSON.parse(readText(PROFILE_PATH));
}

function readObservationRegistry() {
  return JSON.parse(readText(OBSERVATIONS_PATH));
}

function hashMemoryKey(memoryKey) {
  return crypto.createHash('sha256').update(memoryKey).digest('hex');
}

function validMemoryKey(memoryKey) {
  return typeof memoryKey === 'string' && memoryKey.length >= 32 && memoryKey.length <= 200;
}

function looksSensitive(text) {
  const value = String(text || '');
  const patterns = [
    /password\s*[:=]/i,
    /api[_ -]?key\s*[:=]/i,
    /secret\s*[:=]/i,
    /private[_ -]?key/i,
    /seed phrase/i,
    /recovery phrase/i,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\b(?:sk|pk)_[A-Za-z0-9_-]{20,}\b/
  ];
  return patterns.some(pattern => pattern.test(value));
}

function expiresAt() {
  return new Date(Date.now() + MEMORY_TTL_DAYS * 24 * 60 * 60 * 1000);
}

async function getMemories(memoryKey, limit = MEMORY_CONTEXT_LIMIT) {
  if (!validMemoryKey(memoryKey)) return [];
  return ZorgaxMemory.find({
    entityId: 'ZORGAX-001',
    ownerHash: hashMemoryKey(memoryKey)
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

function memoryContext(memories) {
  if (!memories.length) return '';
  const ordered = [...memories].reverse();
  const lines = ordered.map(item =>
    `- [${item.category}/${item.claimClass}] ${item.content} (source: ${item.source})`
  );
  return [
    'Persistent memory supplied by the user for continuity follows.',
    'Treat every item according to its claim class. Memory is not proof.',
    ...lines
  ].join('\n');
}

function normalizeTokens(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 2);
}

function publicObservation(item) {
  return {
    observation_id: item.observation_id,
    title: item.title,
    description: item.description || '',
    category: item.category || null,
    tags: Array.isArray(item.tags) ? item.tags : [],
    city: item.city || null,
    country: item.country || null,
    latitude: Number.isFinite(item.latitude) ? item.latitude : null,
    longitude: Number.isFinite(item.longitude) ? item.longitude : null,
    captured_at: item.captured_at || null,
    imported_at: item.imported_at || null,
    status: item.status || null,
    source: item.source || null,
    sha256: item.sha256 || null,
    repository_commit: item.repository_commit || null,
    media_path: item.media_path || null,
    claim_class: item.status === 'VERIFIED' ? 'verified' : 'uncertain'
  };
}

function searchObservations(query, limit = OBSERVATION_CONTEXT_LIMIT) {
  const registry = readObservationRegistry();
  const rows = Array.isArray(registry.observations) ? registry.observations : [];
  const tokens = normalizeTokens(query);
  if (!tokens.length) return [];

  return rows
    .map(item => {
      const title = normalizeTokens(item.title);
      const tags = normalizeTokens((item.tags || []).join(' '));
      const category = normalizeTokens(item.category);
      const city = normalizeTokens(item.city);
      const description = normalizeTokens(item.description);
      let score = 0;
      for (const token of tokens) {
        if (title.includes(token)) score += 5;
        if (tags.includes(token)) score += 4;
        if (category.includes(token)) score += 3;
        if (city.includes(token)) score += 2;
        if (description.includes(token)) score += 1;
      }
      return { item, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, Math.min(Number(limit) || OBSERVATION_CONTEXT_LIMIT, 20)))
    .map(entry => publicObservation(entry.item));
}

function observationContext(observations) {
  if (!observations.length) return '';
  const lines = observations.map(item => {
    const location = [item.city, item.country].filter(Boolean).join(', ') || 'location not recorded';
    const coordinates = item.latitude !== null && item.longitude !== null
      ? `; coordinates=${item.latitude},${item.longitude}`
      : '; coordinates=not recorded';
    return `- [registry/${item.claim_class}] ${item.observation_id}: ${item.title}; status=${item.status}; category=${item.category}; location=${location}${coordinates}; source=${item.source}; sha256=${item.sha256 || 'not recorded'}`;
  });

  return [
    'MyZubster public observation-registry records relevant to the user message follow.',
    'These are provenance-bearing registry records, not automatic proof of the interpretation of their contents.',
    'Only records whose registry status is VERIFIED may be treated as verified registry facts; PUBLISHED and other states remain uncertain.',
    'Never infer missing GPS, capture times, identities, causes, or extraterrestrial origin.',
    ...lines
  ].join('\n');
}

router.get('/profile', (req, res) => {
  try {
    const profile = readProfile();
    res.json({
      ok: true,
      entity: profile,
      disclosure: 'Zorgax is a virtual/fictional AI persona in the MyZubster narrative universe.'
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);

    const data = await response.json();
    const models = data.models || [];
    const modelLoaded = models.some(
      model => model.name === OLLAMA_MODEL || model.name.startsWith(`${OLLAMA_MODEL}:`)
    );

    res.json({
      ok: true,
      entity: 'ZORGAX-001',
      provider: 'ollama',
      model: OLLAMA_MODEL,
      model_loaded: modelLoaded,
      virtual_identity: true,
      persistent_memory: true,
      memory_opt_in: true,
      memory_ttl_days: MEMORY_TTL_DAYS,
      observation_registry: true,
      research_rag: RESEARCH_SEARCH_ENABLED,
      research_context_limit: RESEARCH_CONTEXT_LIMIT,
      research_crawl_autonomous: false,
      research_crawl_requires_admin: true
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      entity: 'ZORGAX-001',
      provider: 'ollama',
      virtual_identity: true,
      persistent_memory: true,
      memory_opt_in: true,
      observation_registry: true,
      research_rag: RESEARCH_SEARCH_ENABLED,
      research_crawl_autonomous: false,
      research_crawl_requires_admin: true,
      error: error.message
    });
  }
});

router.get('/observations', (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.status(400).json({ ok: false, error: 'Parametro "q" obbligatorio' });
    const observations = searchObservations(query, req.query.limit);
    res.json({
      ok: true,
      entity: 'ZORGAX-001',
      query,
      count: observations.length,
      provenance: 'data/observations.json',
      observations
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/research', async (req, res) => {
  if (!RESEARCH_SEARCH_ENABLED) {
    return res.status(503).json({ ok: false, error: 'Zorgax research RAG is disabled' });
  }

  const query = String(req.query.q || '').trim();
  if (!query) return res.status(400).json({ ok: false, error: 'Parametro "q" obbligatorio' });

  try {
    const retrieval = await researchRag.retrieve({
      query,
      scope: req.query.scope,
      limit: req.query.limit || RESEARCH_CONTEXT_LIMIT
    });
    return res.json({
      ok: true,
      entity: 'ZORGAX-001',
      query: retrieval.query,
      scope: retrieval.scope,
      count: retrieval.sources.length,
      provenance: 'MongoDB ResearchDocument text index',
      sources: retrieval.sources,
      crawl_performed: false,
      refresh_endpoint: retrieval.sources.length === 0 ? '/api/research/crawl' : null
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Research retrieval failed', detail: error.message });
  }
});

router.get('/memory', async (req, res) => {
  try {
    const memoryKey = req.get('x-zorgax-memory-key');
    if (!validMemoryKey(memoryKey)) {
      return res.status(400).json({ ok: false, error: 'Chiave memoria non valida' });
    }

    const memories = await getMemories(memoryKey, 50);
    res.json({
      ok: true,
      entity: 'ZORGAX-001',
      memories: memories.map(({ _id, category, claimClass, content, source, createdAt, expiresAt }) => ({
        id: String(_id), category, claimClass, content, source, createdAt, expiresAt
      }))
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/memory', async (req, res) => {
  try {
    const memoryKey = req.get('x-zorgax-memory-key');
    const { content, category = 'interaction', claimClass = 'uncertain', source = 'user_opt_in' } = req.body || {};

    if (!validMemoryKey(memoryKey)) {
      return res.status(400).json({ ok: false, error: 'Chiave memoria non valida' });
    }
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ ok: false, error: 'Contenuto memoria obbligatorio' });
    }
    if (content.trim().length > 1000) {
      return res.status(400).json({ ok: false, error: 'Memoria troppo lunga (max 1000 caratteri)' });
    }
    if (looksSensitive(content)) {
      return res.status(400).json({
        ok: false,
        error: 'Questa memoria sembra contenere credenziali o segreti e non verrà salvata'
      });
    }
    if (!['interaction', 'observation', 'decision'].includes(category)) {
      return res.status(400).json({ ok: false, error: 'Categoria memoria non valida' });
    }
    if (!['verified', 'uncertain', 'speculative', 'fictional'].includes(claimClass)) {
      return res.status(400).json({ ok: false, error: 'Classificazione memoria non valida' });
    }

    const item = await ZorgaxMemory.create({
      entityId: 'ZORGAX-001',
      ownerHash: hashMemoryKey(memoryKey),
      category,
      claimClass,
      content: content.trim(),
      source: String(source || 'user_opt_in').slice(0, 120),
      expiresAt: expiresAt()
    });

    res.status(201).json({
      ok: true,
      memory: {
        id: String(item._id),
        category: item.category,
        claimClass: item.claimClass,
        content: item.content,
        source: item.source,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.delete('/memory', async (req, res) => {
  try {
    const memoryKey = req.get('x-zorgax-memory-key');
    if (!validMemoryKey(memoryKey)) {
      return res.status(400).json({ ok: false, error: 'Chiave memoria non valida' });
    }

    const result = await ZorgaxMemory.deleteMany({
      entityId: 'ZORGAX-001',
      ownerHash: hashMemoryKey(memoryKey)
    });
    res.json({ ok: true, deleted: result.deletedCount || 0 });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.delete('/memory/:id', async (req, res) => {
  try {
    const memoryKey = req.get('x-zorgax-memory-key');
    if (!validMemoryKey(memoryKey)) {
      return res.status(400).json({ ok: false, error: 'Chiave memoria non valida' });
    }

    const deleted = await ZorgaxMemory.findOneAndDelete({
      _id: req.params.id,
      entityId: 'ZORGAX-001',
      ownerHash: hashMemoryKey(memoryKey)
    });

    if (!deleted) return res.status(404).json({ ok: false, error: 'Memoria non trovata' });
    res.json({ ok: true, deleted: String(deleted._id) });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      prompt,
      useMemory = true,
      useObservations = true,
      useResearch = true,
      researchScope = 'all',
      researchLimit = RESEARCH_CONTEXT_LIMIT
    } = req.body || {};
    const userMessage = message || prompt;

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ ok: false, error: 'Parametro "message" obbligatorio' });
    }

    const memoryKey = req.get('x-zorgax-memory-key');
    const memories = useMemory && validMemoryKey(memoryKey)
      ? await getMemories(memoryKey)
      : [];
    const observations = useObservations
      ? searchObservations(userMessage, OBSERVATION_CONTEXT_LIMIT)
      : [];

    let research = { sources: [], context: '', query: userMessage.trim(), scope: researchScope };
    let researchError = null;
    if (useResearch && RESEARCH_SEARCH_ENABLED) {
      try {
        research = await researchRag.retrieve({
          query: userMessage,
          scope: researchScope,
          limit: researchLimit
        });
      } catch (error) {
        researchError = error.message;
      }
    }

    const systemPrompt = readText(SYSTEM_PROMPT_PATH);
    const memoriesContext = memoryContext(memories);
    const observationsContext = observationContext(observations);
    const messages = [{ role: 'system', content: systemPrompt }];
    if (memoriesContext) messages.push({ role: 'system', content: memoriesContext });
    if (observationsContext) messages.push({ role: 'system', content: observationsContext });
    if (research.context) messages.push({ role: 'system', content: research.context });
    messages.push({ role: 'user', content: userMessage.trim() });

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, messages })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        entity: 'ZORGAX-001',
        provider: 'ollama',
        error: data
      });
    }

    const rawAnswer = data.message?.content || '';
    const researchSources = Array.isArray(research.sources) ? research.sources : [];
    const citationContract = ensureResearchCitationContract(rawAnswer, researchSources);
    const answer = citationContract.answer;
    res.json({
      ok: true,
      entity: 'ZORGAX-001',
      name: 'Zorgax',
      virtual_identity: true,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      memory_used: memories.length,
      observations_used: observations.map(item => item.observation_id),
      observation_provenance: observations.length ? 'data/observations.json' : null,
      research_enabled: RESEARCH_SEARCH_ENABLED,
      research_used: researchSources.map(source => source.label),
      research_sources: researchSources,
      research_provenance: researchSources.length ? 'MongoDB ResearchDocument text index' : null,
      research_citation_enforced: citationContract.enforced,
      research_cited_labels: citationContract.citedLabels,
      research_refresh_required: Boolean(useResearch && RESEARCH_SEARCH_ENABLED && researchSources.length === 0),
      research_refresh_endpoint: useResearch && RESEARCH_SEARCH_ENABLED && researchSources.length === 0 ? '/api/research/crawl' : null,
      research_crawl_performed: false,
      research_error: researchError,
      message: answer,
      response: answer
    });
  } catch (error) {
    console.error('Zorgax error:', error);
    res.status(500).json({
      ok: false,
      entity: 'ZORGAX-001',
      virtual_identity: true,
      error: error.message
    });
  }
});

module.exports = router;