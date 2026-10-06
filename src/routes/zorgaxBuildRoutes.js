const express = require('express');
const {
  createBuildPlan,
  sourceComponents
} = require('../services/zorgaxBuildPlanner');
const {
  isEvaBuildIntent,
  createEvaBuildPlan
} = require('../services/zorgaxEvaBuildPlanner');

const router = express.Router();

function createRequestedBuildPlan(request) {
  return isEvaBuildIntent(request) ? createEvaBuildPlan(request) : createBuildPlan(request);
}

router.post('/plan', async (req, res) => {
  try {
    const request = String(req.body?.request || req.body?.message || req.body?.prompt || '').trim();
    if (!request) return res.status(400).json({ ok: false, error: 'Parametro "request" obbligatorio' });

    const plan = createRequestedBuildPlan(request);
    const sourcing = await sourceComponents(plan, {
      live: req.body?.live !== false,
      limit: req.body?.limit
    });

    return res.json({
      ok: true,
      entity: 'ZORGAX-001',
      capability: 'build-and-source-v1',
      plan,
      sourcing,
      purchase_performed: false,
      automatic_payment: false
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const request = String(req.query.q || '').trim();
    if (!request) return res.status(400).json({ ok: false, error: 'Parametro "q" obbligatorio' });
    const plan = createRequestedBuildPlan(request);
    const sourcing = await sourceComponents(plan, { live: req.query.live !== 'false', limit: req.query.limit });
    return res.json({
      ok: true,
      entity: 'ZORGAX-001',
      capability: 'build-and-source-v1',
      plan_type: plan.type,
      plan,
      sourcing,
      purchase_performed: false,
      automatic_payment: false
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/status', (_req, res) => {
  res.json({
    ok: true,
    entity: 'ZORGAX-001',
    capability: 'build-and-source-v1',
    supported_templates: ['robot', 'eva_ioni_robot', 'electric_scooter'],
    providers: {
      brave_search: Boolean(process.env.BRAVE_SEARCH_API_KEY),
      tavily: Boolean(process.env.TAVILY_API_KEY),
      amazon_search_links: true,
      ebay_search_links: true,
      aliexpress_search_links: true,
      mouser_search_links: true,
      digikey_search_links: true,
      general_web_search_links: true
    },
    purchase_enabled: false,
    credential_changes_required: false
  });
});

module.exports = router;
