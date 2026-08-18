const express = require('express');

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

router.get('/status', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = await response.json();
    const models = data.models || [];

    const modelLoaded = models.some(
      model => model.name === OLLAMA_MODEL ||
               model.name.startsWith(`${OLLAMA_MODEL}:`)
    );

    res.json({
      ok: true,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      ollama: true,
      model_loaded: modelLoaded
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      provider: 'ollama',
      ollama: false,
      error: error.message
    });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { message, prompt } = req.body || {};
    const userMessage = message || prompt;

    if (!userMessage || typeof userMessage !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Parametro "message" obbligatorio'
      });
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          {
            role: 'system',
            content:
              'Sei MyZubster AI, assistente del progetto MyZubster. ' +
              'Rispondi sempre in italiano, in modo utile, chiaro e conciso.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        provider: 'ollama',
        error: data
      });
    }

    const answer = data.message?.content || '';

    res.json({
      ok: true,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      message: answer,
      response: answer
    });

  } catch (error) {
    console.error('Ollama error:', error);

    res.status(500).json({
      ok: false,
      provider: 'ollama',
      error: error.message
    });
  }
});

module.exports = router;
