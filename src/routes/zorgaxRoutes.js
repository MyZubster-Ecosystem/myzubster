const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const SYSTEM_PROMPT_PATH = path.join(__dirname, '..', '..', 'agents', 'zorgax', 'SYSTEM_PROMPT.md');
const PROFILE_PATH = path.join(__dirname, '..', '..', 'config', 'entities', 'zorgax.json');

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readProfile() {
  return JSON.parse(readText(PROFILE_PATH));
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
    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

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
      virtual_identity: true
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      entity: 'ZORGAX-001',
      provider: 'ollama',
      virtual_identity: true,
      error: error.message
    });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, prompt } = req.body || {};
    const userMessage = message || prompt;

    if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'Parametro "message" obbligatorio'
      });
    }

    const systemPrompt = readText(SYSTEM_PROMPT_PATH);
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage.trim() }
        ]
      })
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
