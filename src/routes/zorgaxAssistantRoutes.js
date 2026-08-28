const express = require('express');
const { authenticate } = require('../middleware/auth');
const ZorgaxDataEntry = require('../models/ZorgaxDataEntry');
const { answer, searchWeb, previewData, digestPreview } = require('../services/zorgaxAssistantService');
const { catalog, createCheckoutIntent } = require('../services/zorgaxMonetizationService');
const { getAccess } = require('../services/zorgaxSubscriptionService');

const router = express.Router();

router.get('/status', (_req, res) => {
  res.json({
    ok: true,
    entity: 'ZORGAX-001',
    capability: 'general-assistant-v1',
    chat: true,
    web_research: true,
    data_entry: true,
    monetization: true,
    paid_access_lifecycle: true,
    payment_activation_requires_trusted_verifier: true,
    data_write_requires_auth: true,
    data_write_requires_confirmation: true,
    autonomous_persistent_writes: false,
    providers: {
      brave_search: Boolean(process.env.BRAVE_SEARCH_API_KEY),
      tavily: Boolean(process.env.TAVILY_API_KEY),
      wikipedia: true,
      general_ai_gateway: true
    }
  });
});

router.get('/pricing', (_req, res) => {
  res.json({ ok: true, entity: 'ZORGAX-001', ...catalog() });
});

router.post('/checkout/intent', authenticate, (req, res) => {
  try {
    const intent = createCheckoutIntent({ planId: req.body?.plan, asset: req.body?.asset });
    res.status(201).json({
      ok: true,
      entity: 'ZORGAX-001',
      intent,
      warning: 'Il checkout non firma né invia fondi. Non inviare finché cryptoAmount non è quotato e il backend di verifica non è attivo.'
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.get('/access', authenticate, async (req, res) => {
  try {
    const access = await getAccess(req.userId);
    res.json({ ok: true, entity: 'ZORGAX-001', access });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const result = await answer({
      message: req.body?.message || req.body?.prompt,
      useWeb: req.body?.useWeb !== false,
      history: req.body?.history || [],
      limit: req.body?.limit || 5
    });
    res.json({ ok: true, entity: 'ZORGAX-001', ...result, external_sources: result.sources });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

router.get('/research', async (req, res) => {
  try {
    const result = await searchWeb(req.query.q, req.query.limit || 5);
    res.json({ ok: true, entity: 'ZORGAX-001', ...result, read_only: true });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

router.post('/data/preview', (req, res) => {
  try {
    const input = typeof req.body?.input === 'string' ? req.body.input : JSON.stringify(req.body?.data || req.body || {});
    const result = previewData(input);
    res.json({ ok: true, entity: 'ZORGAX-001', ...result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post('/data/commit', authenticate, async (req, res) => {
  try {
    const { preview, digest, confirmation } = req.body || {};
    if (!preview || !digest || !confirmation) {
      return res.status(400).json({ ok: false, error: 'preview, digest e confirmation sono obbligatori' });
    }
    const expected = digestPreview(preview);
    if (expected !== digest) return res.status(409).json({ ok: false, error: 'Anteprima modificata: rigenerare la conferma' });
    if (confirmation !== `CONFERMA ${digest.slice(0, 8)}`) {
      return res.status(400).json({ ok: false, error: 'Conferma esplicita non valida' });
    }
    const entry = await ZorgaxDataEntry.create({
      ownerId: String(req.userId),
      category: String(preview.category || 'general').slice(0, 80),
      title: String(preview.title || 'Dato Zorgax').slice(0, 180),
      data: preview.data,
      source: 'zorgax_user_confirmed',
      confirmationDigest: digest,
      createdBy: req.username || null
    });
    return res.status(201).json({
      ok: true,
      id: String(entry._id),
      persisted: true,
      category: entry.category,
      title: entry.title,
      createdAt: entry.createdAt
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/data', authenticate, async (req, res) => {
  try {
    const rows = await ZorgaxDataEntry.find({ ownerId: String(req.userId) }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ ok: true, count: rows.length, entries: rows.map(row => ({
      id: String(row._id), category: row.category, title: row.title, data: row.data, source: row.source, createdAt: row.createdAt
    })) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
