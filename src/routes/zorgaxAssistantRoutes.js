const express = require('express');
const { authenticate } = require('../middleware/auth');
const ZorgaxDataEntry = require('../models/ZorgaxDataEntry');
const { answer, searchWeb, previewData, digestPreview } = require('../services/zorgaxAssistantService');
const { catalog, createCheckoutIntent, getPaymentIntent } = require('../services/zorgaxMonetizationService');
const { getAccess } = require('../services/zorgaxSubscriptionService');
const { verifyAndActivatePaymentIntent } = require('../services/zorgaxPaymentIntentService');

const router = express.Router();

router.get('/status', (_req, res) => {
  res.json({ ok: true, entity: 'ZORGAX-001', capability: 'general-assistant-v1', chat: true, web_research: true, data_entry: true, monetization: true, paid_access_lifecycle: true, payment_intents_persisted: true, payment_activation_requires_trusted_verifier: true, crypto_quotes_require_trusted_provider: true, data_write_requires_auth: true, data_write_requires_confirmation: true, autonomous_persistent_writes: false, providers: { brave_search: Boolean(process.env.BRAVE_SEARCH_API_KEY), tavily: Boolean(process.env.TAVILY_API_KEY), gdelt: true, wikipedia: true, general_ai_gateway: true } });
});

router.get('/pricing', (_req, res) => res.json({ ok: true, entity: 'ZORGAX-001', ...catalog() }));

router.post('/checkout/intent', authenticate, async (req, res) => {
  try {
    const intent = await createCheckoutIntent({ ownerId: req.userId, planId: req.body?.plan, asset: req.body?.asset });
    res.status(201).json({ ok: true, entity: 'ZORGAX-001', intent, warning: 'Il checkout non firma né invia fondi. L’accesso resta inattivo finché il pagamento non è verificato indipendentemente.' });
  } catch (error) { res.status(400).json({ ok: false, error: error.message }); }
});

router.get('/checkout/intent/:intentId', authenticate, async (req, res) => {
  try { res.json({ ok: true, entity: 'ZORGAX-001', intent: await getPaymentIntent({ ownerId: req.userId, intentId: req.params.intentId }) }); }
  catch (error) { res.status(404).json({ ok: false, error: error.message }); }
});

router.post('/checkout/intent/:intentId/verify', authenticate, async (req, res) => {
  try {
    const result = await verifyAndActivatePaymentIntent({ ownerId: req.userId, intentId: req.params.intentId, paymentReference: req.body?.paymentReference, renewalOf: req.body?.renewalOf });
    res.json({ ok: true, entity: 'ZORGAX-001', ...result });
  } catch (error) {
    const status = /non trovato/i.test(error.message) ? 404 : /scaduto|insufficienti|non verificato|non verificabile/i.test(error.message) ? 422 : 400;
    res.status(status).json({ ok: false, error: error.message });
  }
});

router.get('/access', authenticate, async (req, res) => {
  try { res.json({ ok: true, entity: 'ZORGAX-001', access: await getAccess(req.userId) }); }
  catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

router.post('/chat', async (req, res) => {
  try { const result = await answer({ message: req.body?.message || req.body?.prompt, useWeb: req.body?.useWeb !== false, history: req.body?.history || [], limit: req.body?.limit || 5 }); res.json({ ok: true, entity: 'ZORGAX-001', ...result, external_sources: result.sources }); }
  catch (error) { res.status(502).json({ ok: false, error: error.message }); }
});

router.get('/research', async (req, res) => {
  try { const result = await searchWeb(req.query.q, req.query.limit || 5); res.json({ ok: true, entity: 'ZORGAX-001', ...result, read_only: true }); }
  catch (error) { res.status(502).json({ ok: false, error: error.message }); }
});

router.post('/data/preview', (req, res) => {
  try { const input = typeof req.body?.input === 'string' ? req.body.input : JSON.stringify(req.body?.data || req.body || {}); res.json({ ok: true, entity: 'ZORGAX-001', ...previewData(input) }); }
  catch (error) { res.status(400).json({ ok: false, error: error.message }); }
});

router.post('/data/commit', authenticate, async (req, res) => {
  try {
    const { preview, digest, confirmation } = req.body || {};
    if (!preview || !digest || !confirmation) return res.status(400).json({ ok: false, error: 'preview, digest e confirmation sono obbligatori' });
    const expected = digestPreview(preview);
    if (expected !== digest) return res.status(409).json({ ok: false, error: 'Anteprima modificata: rigenerare la conferma' });
    if (confirmation !== `CONFERMA ${digest.slice(0, 8)}`) return res.status(400).json({ ok: false, error: 'Conferma esplicita non valida' });
    const entry = await ZorgaxDataEntry.create({ ownerId: String(req.userId), category: String(preview.category || 'general').slice(0, 80), title: String(preview.title || 'Dato Zorgax').slice(0, 180), data: preview.data, source: 'zorgax_user_confirmed', confirmationDigest: digest, createdBy: req.username || null });
    return res.status(201).json({ ok: true, id: String(entry._id), persisted: true, category: entry.category, title: entry.title, createdAt: entry.createdAt });
  } catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

router.get('/data', authenticate, async (req, res) => {
  try { const rows = await ZorgaxDataEntry.find({ ownerId: String(req.userId) }).sort({ createdAt: -1 }).limit(100).lean(); res.json({ ok: true, count: rows.length, entries: rows.map(row => ({ id: String(row._id), category: row.category, title: row.title, data: row.data, source: row.source, createdAt: row.createdAt })) }); }
  catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

module.exports = router;
