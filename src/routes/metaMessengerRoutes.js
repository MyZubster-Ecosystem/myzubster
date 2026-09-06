'use strict';

const express = require('express');
const crypto = require('crypto');
const { waitUntil } = require('@vercel/functions');
const { answer } = require('../services/zorgaxAssistantService');
const router = express.Router();

const MAX_HISTORY_MESSAGES = 10;
const HISTORY_TTL_MS = 30 * 60 * 1000;
const MAX_CONVERSATIONS = 500;
const conversationMemory = new Map();

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

function cleanupMemory(now = Date.now()) {
  for (const [key, value] of conversationMemory.entries()) {
    if (!value?.updatedAt || now - value.updatedAt > HISTORY_TTL_MS) conversationMemory.delete(key);
  }
  while (conversationMemory.size > MAX_CONVERSATIONS) {
    const oldestKey = conversationMemory.keys().next().value;
    if (!oldestKey) break;
    conversationMemory.delete(oldestKey);
  }
}

function conversationKey(senderId) {
  return crypto.createHash('sha256').update(String(senderId || '')).digest('hex');
}

function getHistory(senderId) {
  cleanupMemory();
  const item = conversationMemory.get(conversationKey(senderId));
  if (!item) return [];
  return item.history.slice(-MAX_HISTORY_MESSAGES);
}

function rememberTurn(senderId, userText, assistantText) {
  cleanupMemory();
  const key = conversationKey(senderId);
  const current = conversationMemory.get(key)?.history || [];
  const history = [
    ...current,
    { role: 'user', content: String(userText || '').slice(0, 1200) },
    { role: 'assistant', content: String(assistantText || '').slice(0, 1900) }
  ].slice(-MAX_HISTORY_MESSAGES);
  conversationMemory.delete(key);
  conversationMemory.set(key, { history, updatedAt: Date.now() });
}

function cleanMessengerText(value) {
  return String(value || '')
    .replace(/```[\s\S]*?```/g, block => block.replace(/```(?:\w+)?\n?/g, '').replace(/```/g, ''))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1: $2')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|\s)[*_]([^*_\n]+)[*_](?=\s|$)/g, '$1$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function messengerPrompt(message) {
  return `MESSENGER CHANNEL RULES:\n- Reply in the same language as the user's latest meaningful message.\n- Keep replies concise and conversational: normally 2-6 short lines.\n- Do not use Markdown formatting, Markdown tables, headings, bold, italics, or fenced code blocks. Plain text, short lines and emoji are fine.\n- When the user expresses a concrete goal, give one immediate next step first instead of listing the whole ecosystem.\n- Use these live MyZubster destinations only when relevant: Marketplace/Seller https://www.myzubster.com/marketplace ; Metaverse https://www.myzubster.com/metaverse ; LIFE Pilot https://www.myzubster.com/life-pilot ; Community/login https://www.myzubster.com/social-login .\n- Do not repeat links the user does not need.\n- COMMERCIAL FACTS: Buyer access is free. The configured default Seller plan is SELLER_MONTHLY at EUR 9.90/month (MARKETPLACE_SELLER_MONTHLY_EUR may change the live amount). Never say Seller registration, publishing, commissions, payment fees, discounts, refunds, or other commercial terms are free or have a specific price unless that fact is supplied by verified runtime/project evidence.\n- For Seller price questions, state EUR 9.90/month as the configured default and explicitly tell the user to verify the current live price shown in Marketplace because configuration can change. Do not invent commissions or payment fees.\n- For any other price/payment/commission question without verified evidence, say you cannot confirm the current amount and direct the user to the live Marketplace instead of guessing.\n- Guide Seller onboarding one confirmed step at a time. Do not claim login, activation, checkout, listing publication, payment setup, or a later screen is available/completed until runtime or the user confirms it.\n\nUSER MESSAGE:\n${String(message || '').trim()}`;
}

async function askZorgax(message, senderId) {
  const history = getHistory(senderId);
  const result = await answer({ message: messengerPrompt(message), useWeb: false, history, limit: 1 });
  const raw = String(result?.answer || result?.text || result?.response || result?.message || '').trim();
  const text = cleanMessengerText(raw).slice(0, 1900);
  if (!text) throw new Error('Zorgax ha restituito una risposta vuota');
  rememberTurn(senderId, message, text);
  return text;
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
    const reply = await askZorgax(event.text, event.senderId);
    await sendMessage(event.senderId, reply);
    console.info('[meta-messenger]', JSON.stringify({ event: 'message_handled', mode: 'zorgax', history: 'warm-instance' }));
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
  conversationMemory: 'ephemeral-warm-instance',
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

  if (events.length) {
    waitUntil(Promise.allSettled(events.map(handleMessageEvent)));
  }
  return res.sendStatus(200);
});

module.exports = router;
module.exports._test = {
  safeEqual,
  validSignature,
  configured,
  handleMessageEvent,
  cleanMessengerText,
  messengerPrompt,
  getHistory,
  rememberTurn
};
