'use strict';

const express = require('express');

const router = express.Router();

const RULES = [
  'Rispetto reciproco: niente molestie o discriminazione.',
  'Condividi solo eventi e spazi approvati dagli organizzatori.',
  'Niente istruzioni per accessi abusivi o per aggirare permessi e controlli.',
  'Tutela la privacy: non pubblicare dati personali senza consenso.',
  'Welfare, accessibilita e sicurezza vengono prima della promozione.'
];

function botToken() { return process.env.FLYTEK_RAVER_BOT_TOKEN || process.env.FLYTEK_TELEGRAM_BOT_TOKEN; }
function configured() { return Boolean(botToken()); }
function telegramApi(method) {
  const token = botToken();
  if (!token) throw new Error('FLYTEK_RAVER_BOT_TOKEN non configurato');
  return `https://api.telegram.org/bot${token}/${method}`;
}
async function telegramCall(method, payload) {
  const response = await fetch(telegramApi(method), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.description || `Telegram API ${response.status}`);
  return data;
}
function commandText(command) {
  switch (command) {
    case '/start': case '/help': return ['🔊 Flytek Community Bot','','Bot della community raver/DIY collegato a MyZubster.','','/events - eventi pubblici approvati','/lineup - lineup e timetable confermate','/crew - ruoli e contributi della crew','/welfare - welfare, acqua, accessibilita e sicurezza','/organize - checklist per un party autorizzato','/rules - regole community'].join('\n');
    case '/rules': return `📜 Regole Flytek\n\n${RULES.map(rule => `• ${rule}`).join('\n')}`;
    case '/events': return '📅 Eventi Flytek\n\nNessun evento pubblico confermato e collegato al bot in questo momento. Verranno mostrati solo eventi approvati dagli organizzatori.';
    case '/lineup': return '🎛️ Lineup\n\nNessuna lineup pubblica confermata. Il bot pubblica lineup e timetable solo dopo approvazione degli organizzatori/artisti.';
    case '/crew': return '🧰 Crew\n\nRuoli utili: sound, luci, artist liaison, comunicazione, hospitality, welfare, accessibilita, pulizia/raccolta differenziata e archivio culturale con consenso.';
    case '/welfare': return '💚 Welfare\n\nPrevedi acqua potabile, area riposo, accessibilita, contatti di emergenza, gestione del rumore, rifiuti e persone riconoscibili a cui chiedere aiuto. Il bot non sostituisce professionisti o piani di sicurezza richiesti dalla legge.';
    case '/organize': return ['🗂️ Checklist party autorizzato','','1. Definisci concept, data e organizzatori responsabili.','2. Verifica disponibilita e autorizzazione dello spazio.','3. Controlla permessi, capienza, rumore, sicurezza e requisiti locali.','4. Conferma sound system, artisti e timetable.','5. Assegna crew per tecnica, welfare, hospitality, comunicazione e pulizia.','6. Pubblica solo informazioni approvate dagli organizzatori.','7. Prepara welfare, accessibilita, acqua, rifiuti e piano di emergenza.','8. Archivia flyer, lineup e contributi con consenso.','','Il bot non aiuta a bypassare permessi, controlli o accessi non autorizzati.'].join('\n');
    default: return null;
  }
}
function normalizeCommand(text) { const first = String(text || '').trim().split(/\s+/)[0].toLowerCase(); return first.replace(/@[^\s]+$/, ''); }
function canonicalWebhookUrl() { return process.env.FLYTEK_TELEGRAM_WEBHOOK_URL || 'https://www.myzubster.com/api/telegram/flytek/webhook'; }
async function registerAndVerifyWebhook() {
  const webhookUrl = canonicalWebhookUrl();
  const secretToken = process.env.FLYTEK_TELEGRAM_WEBHOOK_SECRET || undefined;
  const setResult = await telegramCall('setWebhook', { url: webhookUrl, allowed_updates: ['message', 'edited_message'], drop_pending_updates: false, ...(secretToken ? { secret_token: secretToken } : {}) });
  const info = await telegramCall('getWebhookInfo', {});
  const actualUrl = info.result?.url || '';
  const verified = setResult.result === true && actualUrl === webhookUrl;
  console.info('[flytek-telegram]', JSON.stringify({ event: 'webhook_registration', verified, webhookUrl: actualUrl, pending: info.result?.pending_update_count || 0, lastError: info.result?.last_error_message || null }));
  return { verified, webhookUrl: actualUrl, pendingUpdateCount: info.result?.pending_update_count || 0, lastError: info.result?.last_error_message || null };
}
router.get('/status', async (_req, res) => {
  const base = { ok: true, service: 'flytek-telegram-community-bot', configured: configured(), webhookSecretConfigured: Boolean(process.env.FLYTEK_TELEGRAM_WEBHOOK_SECRET), setupSecretConfigured: Boolean(process.env.FLYTEK_TELEGRAM_SETUP_SECRET), webhookUrl: canonicalWebhookUrl() };
  if (!configured()) return res.json({ ...base, webhookVerified: false });
  try {
    const verification = await registerAndVerifyWebhook();
    return res.status(verification.verified ? 200 : 502).json({ ...base, webhookVerified: verification.verified, telegramWebhookUrl: verification.webhookUrl, pendingUpdateCount: verification.pendingUpdateCount, lastError: verification.lastError });
  } catch (error) {
    console.error('[flytek-telegram] status setup failed:', error.message);
    return res.status(502).json({ ...base, webhookVerified: false, error: 'Registrazione webhook Telegram fallita' });
  }
});
router.post('/webhook', async (req, res) => {
  const expectedSecret = process.env.FLYTEK_TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret && req.get('x-telegram-bot-api-secret-token') !== expectedSecret) return res.status(401).json({ ok: false, error: 'Webhook secret non valido' });
  const message = req.body?.message || req.body?.edited_message;
  const chatId = message?.chat?.id;
  const command = normalizeCommand(message?.text);
  const reply = commandText(command);
  if (!chatId || !reply) return res.status(200).json({ ok: true, ignored: true });
  if (!configured()) return res.status(503).json({ ok: false, error: 'Bot Telegram non configurato' });
  try {
    await telegramCall('sendMessage', { chat_id: chatId, text: reply, disable_web_page_preview: true });
    console.info('[flytek-telegram]', JSON.stringify({ event: 'command_handled', command, chatType: message?.chat?.type || null }));
    return res.status(200).json({ ok: true, handled: true, command });
  } catch (error) {
    console.error('[flytek-telegram]', error.message);
    return res.status(502).json({ ok: false, error: 'Invio risposta Telegram fallito' });
  }
});
router.post('/setup', async (req, res) => {
  const setupSecret = process.env.FLYTEK_TELEGRAM_SETUP_SECRET;
  if (!setupSecret || req.get('x-flytek-setup-secret') !== setupSecret) return res.status(401).json({ ok: false, error: 'Setup non autorizzato' });
  if (!configured()) return res.status(503).json({ ok: false, error: 'Token Telegram non configurato' });
  try {
    const verification = await registerAndVerifyWebhook();
    return res.status(verification.verified ? 200 : 502).json({ ok: verification.verified, ...verification });
  } catch (error) {
    console.error('[flytek-telegram] setup failed:', error.message);
    return res.status(502).json({ ok: false, error: 'Configurazione webhook Telegram fallita' });
  }
});
module.exports = router;
module.exports._test = { commandText, normalizeCommand, RULES, canonicalWebhookUrl };
