const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { createZorgaxAccessMiddleware, publicAccess } = require('../middleware/zorgaxAccess');
const ZorgaxDataEntry = require('../models/ZorgaxDataEntry');
const { answer, searchWeb, previewData, digestPreview } = require('../services/zorgaxAssistantService');
const { catalog, createCheckoutIntent, getPaymentIntent, listPaymentIntents } = require('../services/zorgaxLegacyMonetizationService');
const { getAccess } = require('../services/zorgaxAccessService');
const { refreshPaymentIntent, verifyAndActivatePaymentIntent } = require('../services/zorgaxPaymentIntentService');
const { getPaymentReceipt } = require('../services/zorgaxBillingService');

const router = express.Router();
const { loadZorgaxAccess, requireZorgaxPlan } = createZorgaxAccessMiddleware();

router.get('/status', (_req, res) => {
  res.json({ ok: true, entity: 'ZORGAX-001', capability: 'general-assistant-v1', chat: true, web_research: true, data_entry: true, monetization: true, paid_access_lifecycle: true, paid_access_enforced: true, payment_intents_persisted: true, automatic_payment_monitoring: true, payment_history: true, payment_receipts: true, renewal_stacking: true, automatic_recurring_charges: false, payment_activation_requires_trusted_verifier: true, crypto_quotes_require_trusted_provider: true, guest_chat: true, guest_web_research: false, free_web_research_limit: 2, pro_workspace_required: true, developer_api_required: true, data_write_requires_auth: true, data_write_requires_confirmation: true, autonomous_persistent_writes: false, providers: { brave_search: Boolean(process.env.BRAVE_SEARCH_API_KEY), tavily: Boolean(process.env.TAVILY_API_KEY), google_news: true, wikipedia: true, general_ai_gateway: true } });
});

router.get('/pricing', (_req, res) => res.json({ ok: true, entity: 'ZORGAX-001', ...catalog() }));

router.post('/checkout/intent', authenticate, async (req, res) => {
  try {
    const intent = await createCheckoutIntent({ ownerId: req.userId, planId: req.body?.plan, asset: req.body?.asset, renew: req.body?.renew === true });
    res.status(201).json({ ok: true, entity: 'ZORGAX-001', intent, warning: 'Il checkout non firma né invia fondi. L’accesso resta inattivo finché il pagamento non è verificato indipendentemente.' });
  } catch (error) { res.status(400).json({ ok: false, error: error.message }); }
});

router.get('/checkout/intent/:intentId', authenticate, async (req, res) => {
  try { res.json({ ok: true, entity: 'ZORGAX-001', intent: await getPaymentIntent({ ownerId: req.userId, intentId: req.params.intentId }) }); }
  catch (error) { res.status(404).json({ ok: false, error: error.message }); }
});

router.post('/checkout/intent/:intentId/verify', authenticate, async (req, res) => {
  try {
    const result = await verifyAndActivatePaymentIntent({ ownerId: req.userId, intentId: req.params.intentId, paymentReference: req.body?.paymentReference });
    res.status(result.pending ? 202 : 200).json({ ok: true, entity: 'ZORGAX-001', ...result });
  } catch (error) {
    const status = /non trovato/i.test(error.message) ? 404 : /scaduto|insufficienti|non verificato|non verificabile/i.test(error.message) ? 422 : 400;
    res.status(status).json({ ok: false, error: error.message });
  }
});

router.post('/checkout/intent/:intentId/refresh', authenticate, async (req, res) => {
  try {
    const result = await refreshPaymentIntent({ ownerId: req.userId, intentId: req.params.intentId });
    res.status(result.pending ? 202 : 200).json({ ok: true, entity: 'ZORGAX-001', ...result });
  } catch (error) {
    const status = /non trovat[oa]/i.test(error.message) ? 404 : /scaduto|non verificabile/i.test(error.message) ? 422 : 400;
    res.status(status).json({ ok: false, error: error.message });
  }
});

router.get('/checkout/history', authenticate, async (req, res) => {
  try {
    const intents = await listPaymentIntents({ ownerId: req.userId, limit: req.query.limit });
    res.json({ ok: true, entity: 'ZORGAX-001', intents });
  } catch (error) { res.status(500).json({ ok: false, error: 'Storico pagamenti temporaneamente non disponibile' }); }
});

router.get('/checkout/intent/:intentId/receipt', authenticate, async (req, res) => {
  try {
    const receipt = await getPaymentReceipt({ ownerId: req.userId, intentId: req.params.intentId });
    res.json({ ok: true, entity: 'ZORGAX-001', receipt });
  } catch (error) {
    const status = /non trovat[oa]/i.test(error.message) ? 404 : 400;
    res.status(status).json({ ok: false, error: error.message });
  }
});

router.get('/access', authenticate, async (req, res) => {
  try { res.json({ ok: true, entity: 'ZORGAX-001', access: publicAccess(await getAccess(req.userId)) }); }
  catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

router.post('/chat', optionalAuthenticate, loadZorgaxAccess, async (req, res) => {
  try {
    const requestedWeb = req.body?.useWeb !== false;
    const policy = req.zorgaxPolicy;
    const requestedLimit = Number(req.body?.limit);
    const safeRequestedLimit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 5;
    const limit = policy.maxWebResults > 0 ? Math.min(safeRequestedLimit, policy.maxWebResults) : 1;
    const useWeb = requestedWeb && policy.webResearch;
    const result = await answer({ message: req.body?.message || req.body?.prompt, useWeb, history: req.body?.history || [], limit });
    const accessNotice = requestedWeb && !policy.webResearch
      ? 'Accedi a MyZubster per abilitare la ricerca web. La risposta corrente usa solo l’assistente base.'
      : policy.researchMode === 'LIMITED' && requestedWeb
        ? `Ricerca Free limitata a ${policy.maxWebResults} fonti per richiesta.`
        : null;
    res.json({ ok: true, entity: 'ZORGAX-001', ...result, external_sources: result.sources, access: publicAccess(req.zorgaxAccess), featureAccess: policy, accessNotice });
  }
  catch (error) { res.status(502).json({ ok: false, error: error.message }); }
});

router.get('/research', authenticate, requireZorgaxPlan('developer'), async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, req.zorgaxPolicy.maxWebResults) : req.zorgaxPolicy.maxWebResults;
    const result = await searchWeb(req.query.q, limit);
    res.json({ ok: true, entity: 'ZORGAX-001', ...result, read_only: true, access: publicAccess(req.zorgaxAccess) });
  }
  catch (error) { res.status(502).json({ ok: false, error: error.message }); }
});

router.post('/data/preview', (req, res) => {
  try { const input = typeof req.body?.input === 'string' ? req.body.input : JSON.stringify(req.body?.data || req.body || {}); res.json({ ok: true, entity: 'ZORGAX-001', ...previewData(input) }); }
  catch (error) { res.status(400).json({ ok: false, error: error.message }); }
});

router.post('/data/commit', authenticate, requireZorgaxPlan('pro'), async (req, res) => {
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

router.get('/data', authenticate, requireZorgaxPlan('pro'), async (req, res) => {
  try { const rows = await ZorgaxDataEntry.find({ ownerId: String(req.userId) }).sort({ createdAt: -1 }).limit(100).lean(); res.json({ ok: true, count: rows.length, entries: rows.map(row => ({ id: String(row._id), category: row.category, title: row.title, data: row.data, source: row.source, createdAt: row.createdAt })) }); }
  catch (error) { res.status(500).json({ ok: false, error: error.message }); }
});

module.exports = router;
