const express = require('express');
const rateLimit = require('express-rate-limit');
const entities = require('../../frontend/src/data/canonicalEntities.json');
const {
  buildEntityBundle,
  buildProgramBundle
} = require('../services/entityBountyService');

const router = express.Router();
const OLLAMA_URL = String(process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.ENTITY_OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const CHAT_TIMEOUT_MS = Math.max(5000, Math.min(Number(process.env.ENTITY_CHAT_TIMEOUT_MS) || 45000, 120000));

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 24,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Troppe richieste: attendi un minuto prima di riprovare.' }
});

function findEntity(slug) {
  return entities.find(entity => entity.slug === String(slug || '').toLowerCase());
}

function publicEntity(entity) {
  const { id, slug, displayName, icon, accent, type, role, mission, workflow, capabilities, boundaries, suggestions, repository, advancedUrl } = entity;
  return { id, slug, displayName, icon, accent, type, role, mission, workflow, capabilities, boundaries, suggestions, repository, advancedUrl: advancedUrl || null };
}

function systemPrompt(entity) {
  return [
    `Sei ${entity.displayName}, ${entity.role} nell'ecosistema MyZubster.`,
    `Missione: ${entity.mission}`,
    `Workflow canonico: ${entity.workflow.join(' → ')}.`,
    `Capacità: ${entity.capabilities.join(', ')}.`,
    `Limiti: ${entity.boundaries.join(' ')}`,
    `Repository di riferimento: ${entity.repository.url}.`,
    'Lavora evidence-first. Distingui sempre fatti verificati, inferenze e informazioni mancanti.',
    'Non inventare stato dei servizi, misure, finanziamenti, partnership, pagamenti, approvazioni o deploy.',
    'MYZ è un registro interno di ricompense/contabilità; qualsiasi settlement esterno richiede verifica indipendente.',
    'Rispondi nella lingua dell’utente. Sii operativo, conciso e indica il prossimo passo verificabile.'
  ].join('\n');
}

function guidedFallback(entity, message) {
  const excerpt = String(message || '').trim().replace(/\s+/g, ' ').slice(0, 180);
  return [
    `${entity.icon} Sono ${entity.displayName}. Ho ricevuto la richiesta: “${excerpt}”.`,
    '',
    `Percorso consigliato: ${entity.workflow.join(' → ')}.`,
    `Primo passo verificabile: ${entity.suggestions[0]}.`,
    `Confine da rispettare: ${entity.boundaries[0]}`,
    '',
    'Il motore generativo non è raggiungibile da questo nodo web: questa è una guida canonica locale, non una risposta generata né una prova dello stato del progetto.',
    `Riferimento pubblico: ${entity.repository.url}`
  ].join('\n');
}

async function ollamaChat(entity, message) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt(entity) },
          { role: 'user', content: message.trim() }
        ],
        options: { temperature: 0.2 }
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const answer = String(data.message?.content || '').trim();
    if (!answer) throw new Error('Risposta Ollama vuota');
    return answer;
  } finally {
    clearTimeout(timeout);
  }
}

router.get('/', (_req, res) => {
  const bountyProgram = buildProgramBundle(entities);
  res.json({
    ok: true,
    schemaVersion: '1.0.0',
    count: entities.length,
    entities: entities.map(publicEntity),
    bountyProgram: bountyProgram.summary,
    policy: {
      localFirst: true,
      evidenceFirst: true,
      serverMemory: false,
      automaticSettlement: false
    }
  });
});

router.get('/bounties', (req, res) => {
  const track = typeof req.query.track === 'string'
    ? req.query.track.trim().toLowerCase()
    : null;
  const status = typeof req.query.status === 'string'
    ? req.query.status.trim().toUpperCase()
    : null;

  return res.json(buildProgramBundle(entities, { track, status }));
});

router.get('/:slug/status', async (req, res) => {
  const entity = findEntity(req.params.slug);
  if (!entity) return res.status(404).json({ ok: false, error: 'Entità non trovata' });

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models : [];
    const modelLoaded = models.some(model => model.name === OLLAMA_MODEL || model.name?.startsWith(`${OLLAMA_MODEL}:`));
    return res.json({ ok: true, entity: entity.id, provider: 'ollama', model: OLLAMA_MODEL, available: true, modelLoaded, mode: 'generative' });
  } catch (error) {
    return res.json({ ok: true, entity: entity.id, provider: 'registry', model: null, available: true, modelLoaded: false, mode: 'guided-fallback', detail: 'Motore generativo non raggiungibile; guida canonica disponibile.' });
  }
});

router.get('/:slug/bounties', (req, res) => {
  const entity = findEntity(req.params.slug);
  if (!entity) return res.status(404).json({ ok: false, error: 'Entità non trovata' });
  return res.json(buildEntityBundle(entity));
});

router.get('/:slug', (req, res) => {
  const entity = findEntity(req.params.slug);
  if (!entity) return res.status(404).json({ ok: false, error: 'Entità non trovata' });
  return res.json({ ok: true, entity: publicEntity(entity) });
});

router.post('/:slug/chat', chatLimiter, async (req, res) => {
  const entity = findEntity(req.params.slug);
  if (!entity) return res.status(404).json({ ok: false, error: 'Entità non trovata' });

  const message = req.body?.message;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ ok: false, error: 'Parametro “message” obbligatorio' });
  }
  if (message.trim().length > 4000) {
    return res.status(400).json({ ok: false, error: 'Messaggio troppo lungo (massimo 4000 caratteri)' });
  }

  let answer;
  let mode = 'generative';
  let provider = 'ollama';
  try {
    answer = await ollamaChat(entity, message);
  } catch (error) {
    answer = guidedFallback(entity, message);
    mode = 'guided-fallback';
    provider = 'registry';
  }

  return res.json({
    ok: true,
    entity: publicEntity(entity),
    provider,
    model: provider === 'ollama' ? OLLAMA_MODEL : null,
    mode,
    memoryStored: false,
    message: answer,
    response: answer,
    references: [{ label: entity.repository.name, url: entity.repository.url, kind: 'public-repository' }]
  });
});

module.exports = router;
module.exports.findEntity = findEntity;
module.exports.systemPrompt = systemPrompt;
