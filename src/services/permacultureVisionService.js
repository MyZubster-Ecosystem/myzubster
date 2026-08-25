const crypto = require('crypto');
const { buildPlanningContext } = require('./permacultureAiService');

const VISION_VERSION = 'permaculture-vision-v1';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const DEFAULT_MODEL = 'qwen2.5vl:3b';

const OBSERVATION_CATEGORIES = [
  'water', 'soil', 'vegetation', 'biodiversity', 'infrastructure', 'risk', 'unknown'
];
const PERMACULTURE_PRINCIPLES = [
  'observe_interact', 'catch_store_energy', 'obtain_yield', 'self_regulate_feedback',
  'renewable_resources', 'no_waste', 'patterns_to_details', 'integrate_not_segregate',
  'small_slow_solutions', 'diversity', 'edges_marginal', 'respond_to_change'
];
const ASSESSMENTS = ['clear_signals', 'partial_signals', 'insufficient_evidence', 'not_permaculture'];
const PRIORITIES = ['high', 'medium', 'low'];
const TIMEFRAMES = ['observe_first', 'now', 'this_season', 'long_term'];

const VISION_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'observations', 'permacultureSignals', 'missingEvidence', 'recommendations',
    'cautions', 'overallAssessment'
  ],
  properties: {
    observations: {
      type: 'array',
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['category', 'label', 'evidence', 'confidence'],
        properties: {
          category: { type: 'string', enum: OBSERVATION_CATEGORIES },
          label: { type: 'string' },
          evidence: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        }
      }
    },
    permacultureSignals: {
      type: 'array',
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['principle', 'evidence', 'confidence'],
        properties: {
          principle: { type: 'string', enum: PERMACULTURE_PRINCIPLES },
          evidence: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        }
      }
    },
    missingEvidence: { type: 'array', maxItems: 10, items: { type: 'string' } },
    recommendations: {
      type: 'array',
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['priority', 'action', 'reason', 'confidence', 'timeframe'],
        properties: {
          priority: { type: 'string', enum: PRIORITIES },
          action: { type: 'string' },
          reason: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          timeframe: { type: 'string', enum: TIMEFRAMES }
        }
      }
    },
    cautions: { type: 'array', maxItems: 8, items: { type: 'string' } },
    overallAssessment: {
      type: 'object',
      additionalProperties: false,
      required: ['classification', 'confidence', 'explanation'],
      properties: {
        classification: { type: 'string', enum: ASSESSMENTS },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        explanation: { type: 'string' }
      }
    }
  }
};

class PermacultureVisionError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'PermacultureVisionError';
    this.status = status;
    this.code = code;
  }
}

function fail(message, status, code) {
  throw new PermacultureVisionError(message, status, code);
}

function detectImageMime(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
    return 'image/png';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

function validateImage(buffer, declaredMime) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(declaredMime)) {
    fail('Use a JPEG, PNG or WebP image', 415, 'PERMACULTURE_VISION_UNSUPPORTED_MEDIA');
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    fail('A photo body is required', 400, 'PERMACULTURE_VISION_PHOTO_REQUIRED');
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    fail('Photo exceeds the 8 MB limit', 413, 'PERMACULTURE_VISION_PHOTO_TOO_LARGE');
  }
  const detectedMime = detectImageMime(buffer);
  if (!detectedMime || detectedMime !== declaredMime) {
    fail('Image content does not match its Content-Type', 415, 'PERMACULTURE_VISION_INVALID_IMAGE');
  }
  return detectedMime;
}

function isLoopbackHostname(hostname) {
  const normalized = String(hostname || '').toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function resolveOllamaUrl(options = {}) {
  const raw = options.ollamaUrl || process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  let url;
  try {
    url = new URL(raw);
  } catch (_error) {
    fail('Invalid OLLAMA_URL', 503, 'PERMACULTURE_VISION_CONFIGURATION_ERROR');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    fail('OLLAMA_URL must be an HTTP(S) URL without embedded credentials', 503, 'PERMACULTURE_VISION_CONFIGURATION_ERROR');
  }
  const remoteAllowed = options.allowRemote === true || process.env.PERMACULTURE_VISION_ALLOW_REMOTE === 'true';
  if (!isLoopbackHostname(url.hostname) && !remoteAllowed) {
    fail(
      'Photo analysis is restricted to a local Ollama endpoint',
      503,
      'PERMACULTURE_VISION_LOCAL_ONLY'
    );
  }
  return url.toString().replace(/\/+$/, '');
}

function safeText(value, maxLength) {
  if (typeof value !== 'string' || !value.trim()) {
    fail('Vision model returned invalid text', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  return value.trim().slice(0, maxLength);
}

function safeConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1) {
    fail('Vision model returned invalid confidence', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  return Math.round(number * 1000) / 1000;
}

function safeEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    fail(`Vision model returned invalid ${field}`, 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  return value;
}

function safeStringList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) {
    fail('Vision model returned an invalid list', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  return [...new Set(value.slice(0, maxItems).map(item => safeText(item, maxLength)))];
}

function rejectSensitiveVisionOutput(raw) {
  const serialized = JSON.stringify(raw);
  const patterns = [
    /\b(?:lat|latitude|lng|longitude|coordinate|coordinates|gps)\b\s*[:=]?\s*-?\d/i,
    /-?\d{1,2}\.\d{4,}\s*[,;]\s*-?\d{1,3}\.\d{4,}/,
    /\b(?:address|indirizzo|street|strada|via|viale|piazza)\b\s*[:=]?\s*[\wÀ-ÿ' -]*\d+/i,
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:owner|proprietario|persona identificata|identity|identità)\b\s*[:=]/i
  ];
  if (patterns.some(pattern => pattern.test(serialized))) {
    fail(
      'Vision output contained sensitive location or identity data',
      502,
      'PERMACULTURE_VISION_SENSITIVE_OUTPUT'
    );
  }
}

function validateVisionOutput(raw, details = {}) {
  if (!raw || typeof raw !== 'object') {
    fail('Vision model returned an invalid payload', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  rejectSensitiveVisionOutput(raw);
  if (!Array.isArray(raw.observations) || raw.observations.length === 0) {
    fail('Vision model returned no observations', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  if (!Array.isArray(raw.recommendations) || raw.recommendations.length === 0) {
    fail('Vision model returned no recommendations', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  if (!/^[a-f0-9]{64}$/.test(details.imageSha256 || '')) {
    fail('Invalid image commitment', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  const observations = raw.observations.slice(0, 12).map(item => ({
    category: safeEnum(item.category, OBSERVATION_CATEGORIES, 'observation category'),
    label: safeText(item.label, 120),
    evidence: safeText(item.evidence, 400),
    confidence: safeConfidence(item.confidence)
  }));
  const permacultureSignals = (Array.isArray(raw.permacultureSignals) ? raw.permacultureSignals : [])
    .slice(0, 12)
    .map(item => ({
      principle: safeEnum(item.principle, PERMACULTURE_PRINCIPLES, 'permaculture principle'),
      evidence: safeText(item.evidence, 400),
      confidence: safeConfidence(item.confidence)
    }));
  const recommendations = raw.recommendations.slice(0, 10).map(item => ({
    priority: safeEnum(item.priority, PRIORITIES, 'recommendation priority'),
    action: safeText(item.action, 400),
    reason: safeText(item.reason, 500),
    confidence: safeConfidence(item.confidence),
    timeframe: safeEnum(item.timeframe, TIMEFRAMES, 'recommendation timeframe')
  }));
  const assessment = raw.overallAssessment || {};
  return {
    schemaVersion: VISION_VERSION,
    provider: 'ollama',
    model: safeText(details.model || DEFAULT_MODEL, 120),
    analyzedAt: details.now || new Date(),
    imageSha256: details.imageSha256,
    mimeType: safeEnum(details.mimeType, ['image/jpeg', 'image/png', 'image/webp'], 'image type'),
    observations,
    permacultureSignals,
    missingEvidence: safeStringList(raw.missingEvidence || [], 10, 300),
    recommendations,
    cautions: safeStringList(raw.cautions || [], 8, 300),
    overallAssessment: {
      classification: safeEnum(assessment.classification, ASSESSMENTS, 'assessment'),
      confidence: safeConfidence(assessment.confidence),
      explanation: safeText(assessment.explanation, 600)
    },
    humanReviewRequired: true
  };
}

function extractJson(content) {
  const text = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    fail('Vision response does not contain JSON', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (_error) {
    fail('Vision response contains invalid JSON', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
  }
}

async function analyzePermacultureImage(buffer, declaredMime, site, options = {}) {
  const mimeType = validateImage(buffer, declaredMime);
  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== 'function') {
    fail('Photo analysis provider is unavailable', 503, 'PERMACULTURE_VISION_UNAVAILABLE');
  }
  const ollamaUrl = resolveOllamaUrl(options);
  const model = options.model || process.env.PERMACULTURE_VISION_MODEL || DEFAULT_MODEL;
  const timeoutMs = Math.max(
    5000,
    Math.min(Number(options.timeoutMs || process.env.PERMACULTURE_VISION_TIMEOUT_MS) || 90000, 180000)
  );
  const context = buildPlanningContext(site);
  const imageSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try {
      response = await fetchImpl(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          stream: false,
          format: VISION_OUTPUT_SCHEMA,
          options: { temperature: 0.1 },
          messages: [
            {
              role: 'system',
              content: [
                'Analizza la foto come assistente prudente di permacultura.',
                'Distingui sempre ciò che è visibile dalle ipotesi e assegna una confidenza.',
                'Rileva copertura del suolo, diversità, consociazioni, gestione idrica, habitat, bordi e rischi osservabili.',
                'Non identificare persone, non trascrivere targhe o dati personali e non inferire indirizzi, GPS o coordinate.',
                'Non diagnosticare con certezza specie, malattie, suolo o idrologia da una sola foto.',
                'Dai azioni conservative; scavi, strutture, trattamenti o cambi idrici richiedono verifica umana.',
                'Restituisci soltanto JSON conforme allo schema richiesto, in italiano.'
              ].join(' ')
            },
            {
              role: 'user',
              content: `Contesto volontario e privo di posizione esatta: ${JSON.stringify(context)}`,
              images: [buffer.toString('base64')]
            }
          ]
        })
      });
    } catch (error) {
      if (error instanceof PermacultureVisionError) throw error;
      fail('Local vision model is unavailable', 503, 'PERMACULTURE_VISION_UNAVAILABLE');
    }
    let data;
    try {
      data = await response.json();
    } catch (_error) {
      fail('Vision provider returned an invalid response', 502, 'PERMACULTURE_VISION_INVALID_OUTPUT');
    }
    if (!response.ok) {
      fail(`Vision provider failed with HTTP ${response.status}`, 503, 'PERMACULTURE_VISION_UNAVAILABLE');
    }
    return validateVisionOutput(extractJson(data.message?.content), {
      model,
      now: options.now || new Date(),
      imageSha256,
      mimeType
    });
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  VISION_VERSION,
  VISION_OUTPUT_SCHEMA,
  MAX_IMAGE_BYTES,
  PermacultureVisionError,
  detectImageMime,
  validateImage,
  resolveOllamaUrl,
  rejectSensitiveVisionOutput,
  validateVisionOutput,
  analyzePermacultureImage
};
