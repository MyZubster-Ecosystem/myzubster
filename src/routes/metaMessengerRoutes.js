'use strict';

const express = require('express');
const crypto = require('crypto');
const { waitUntil } = require('@vercel/functions');
const { answer } = require('../services/zorgaxAssistantService');
const router = express.Router();

function configured() {
  return Boolean(process.env.META_WEBHOOK_VERIFY_TOKEN && process.env.META_APP_SECRET && process.env.META_PAGE_ACCESS_TOKEN);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function validSignature(req) {
  const secret = process.env.META_APP_SECRET;
  const signature = req.get('x-hub-signature-256');
  if (!secret || !signature || !signature.startsWith('sha256=')) return false;
  const raw = req.rawBody;
  if (!Buffer.isBuffer(raw)) return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(raw).digest('hex')}`;
  return safeEqual(signature, expected);
}

async function askZorgax(message) {
  const result = await answer({ message, useWeb: false, history: [], limit: 1 });
  const text = String(result?.answer || result?.text || result?.response || result?.message || '').trim();
  if (!text) throw new Error('Zorgax ha restituito una risposta vuota');
  return text.slice(0, 1900);
}

async function sendMessage(recipientId, text) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error('META_PAGE_ACCESS_TOKEN non configurato');
  const version = process.env.META_GRAPH_API_VERSION || 'v26.0';
  const response = await fetch(`https://graph.facebook.com/${version}/me/messages?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient: { id: recipientId }, messaging_type: 'RESPONSE', message: { text } })
  });
  if (!response.ok) throw new Error(`Meta Send API ${response.status}`);
}

async function handleMessageEvent(event) {
  try {
    const reply = await askZorgax(event.text);
    await sendMessage(event.senderId, reply);
    console.info('[meta-messenger]', JSON.stringify({ event: 'message_handled', mode: 'zorgax' }));
  } catch (error) {
    console.error('[meta-messenger]', error.message);
    try {
      await sendMessage(event.senderId, 'Zorgax è temporaneamente non disponibile. Riprova tra poco.');
    } catch (fallbackError) {
      console.error('[meta-messenger]', `fallback_send_failed: ${fallbackError.message}`);
    }
  }
}

router.get('/status', (_req, res) => res.json({
  ok: true,
  service: 'meta-messenger-community-bridge',
  configured: configured(),
  zorgaxAI: true,
  webhook: 'https://www.myzubster.com/api/meta/messenger/webhook'
}));

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && process.env.META_WEBHOOK_VERIFY_TOKEN && safeEqual(token, process.env.META_WEBHOOK_VERIFY_TOKEN)) {
    return res.status(200).send(String(challenge || ''));
  }
  return res.sendStatus(403);
});

router.post('/webhook', async (req, res) => {
  if (!validSignature(req)) return res.sendStatus(401);
  const events = [];
  for (const entry of req.body?.entry || []) {
    for (const event of entry.messaging || []) {
      if (event.message?.is_echo) continue;
      const senderId = event.sender?.id;
      const text = String(event.message?.text || '').trim();
      if (senderId && text) events.push({ senderId, text });
    }
  }

  // Meta expects a fast acknowledgement. Keep the actual Zorgax + Send API work
  // alive after the 200 response so Vercel does not freeze the function early.
  if (events.length) {
    waitUntil(Promise.allSettled(events.map(handleMessageEvent)));
  }
  return res.sendStatus(200);
});

module.exports = router;
module.exports._test = { safeEqual, validSignature, configured, handleMessageEvent };
