const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ZorgaxMemory = require('../models/ZorgaxMemory');

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const SYSTEM_PROMPT_PATH = path.join(__dirname, '..', '..', 'agents', 'zorgax', 'SYSTEM_PROMPT.md');
const PROFILE_PATH = path.join(__dirname, '..', '..', 'config', 'entities', 'zorgax.json');
const MEMORY_TTL_DAYS = Math.max(1, Math.min(Number(process.env.ZORGAX_MEMORY_TTL_DAYS) || 90, 365));
const MEMORY_CONTEXT_LIMIT = 8;

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readProfile() {
  return JSON.parse(readText(PROFILE_PATH));
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
      memory_ttl_days: MEMORY_TTL_DAYS
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      entity: 'ZORGAX-001',
      provider: 'ollama',
      virtual_identity: true,
      persistent_memory: true,
      memory_opt_in: true,
      error: error.message
    });
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
    const { message, prompt, useMemory = true } = req.body || {};
    const userMessage = message || prompt;

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({ ok: false, error: 'Parametro "message" obbligatorio' });
    }

    const memoryKey = req.get('x-zorgax-memory-key');
    const memories = useMemory && validMemoryKey(memoryKey)
      ? await getMemories(memoryKey)
      : [];

    const systemPrompt = readText(SYSTEM_PROMPT_PATH);
    const context = memoryContext(memories);
    const messages = [{ role: 'system', content: systemPrompt }];
    if (context) messages.push({ role: 'system', content: context });
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

    const answer = data.message?.content || '';
    res.json({
      ok: true,
      entity: 'ZORGAX-001',
      name: 'Zorgax',
      virtual_identity: true,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      memory_used: memories.length,
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
