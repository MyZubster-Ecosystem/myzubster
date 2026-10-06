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
    'Rispondi prima alla domanda reale dell’utente. La validazione deve supportare la risposta, non sostituirla.',
    'Quando l’utente vuole contribuire dati, guidalo in linguaggio naturale e chiedi solo i dati mancanti.',
    'Lavora evidence-first. Distingui sempre fatti verificati, inferenze e informazioni mancanti.',
    'Non inventare stato dei servizi, misure, finanziamenti, partnership, pagamenti, approvazioni o deploy.',
    'MYZ è un registro interno di ricompense/contabilità; qualsiasi settlement esterno richiede verifica indipendente.',
    'Rispondi nella lingua dell’utente. Sii operativo, conciso e indica il prossimo passo verificabile solo quando è utile.'
  ].join('\n');
}

function normalizedMessage(message) {
  return String(message || '')
    .trim()
    .toLocaleLowerCase('it-IT')
    .replace(/[!?.,;:]+/g, '')
    .replace(/\s+/g, ' ');
}

function guidedFallback(entity, message) {
  const normalized = normalizedMessage(message);
  const statusQuestions = new Set([
    'adesso funzioni',
    'ora funzioni',
    'funzioni',
    'sei attivo',
    'sei online',
    'ci sei'
  ]);

  if (statusQuestions.has(normalized)) {
    return `Sì, sono ${entity.displayName} e posso risponderti. In questo momento sto usando la guida locale di MyZubster perché il motore generativo avanzato non è raggiungibile da questo nodo. Puoi comunque farmi domande o chiedermi aiuto per inserire un’osservazione.`;
  }

  if (/^(ciao|salve|buongiorno|buonasera|hey|hello)$/.test(normalized)) {
    return `Ciao! Sono ${entity.displayName}. Come posso aiutarti? Posso rispondere alle tue domande oppure guidarti nell’inserimento di dati e osservazioni in MyZubster.`;
  }

  if (/(inser|aggiung|registr|segnal|caric).*(dato|dati|osservaz|piant|animal|foto|luog|posto)/.test(normalized)) {
    return `Certo. Ti aiuto a preparare l’inserimento. Dimmi prima cosa vuoi registrare; poi ti chiederò solo le informazioni mancanti. Se il salvataggio richiede una funzione non disponibile da questo nodo, te lo dirò chiaramente prima di confermare qualsiasi operazione.`;
  }

  return [
    `Posso aiutarti con questa richiesta: “${String(message || '').trim().replace(/\s+/g, ' ').slice(0, 180)}”.`,
    '',
    'Il motore generativo avanzato non è raggiungibile da questo nodo, quindi non voglio fingere di avere generato una risposta completa.',
    `Posso comunque guidarti nelle funzioni disponibili di ${entity.displayName}. Prova a formulare la domanda in modo diretto oppure dimmi quale dato o osservazione vuoi inserire.`
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
    return res.json({ ok: true, entity: entity.id, provider: 'registry', model: null, available: true, modelLoaded: false, mode: 'guided-fallback', detail: 'Motore generativo non raggiungibile; guida locale disponibile.' });
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
module.exports.guidedFallback = guidedFallback;
