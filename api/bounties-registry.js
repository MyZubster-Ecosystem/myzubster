const registry = require('../bounty-engine/registry-v2.json');

function normalize(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : null;
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const classification = normalize(req.query.classification);
  const workState = normalize(req.query.work_state);
  const settlementState = normalize(req.query.settlement_state);
  const asset = normalize(req.query.asset);
  const fundingState = normalize(req.query.funding_state);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 100;

  let entries = Array.isArray(registry.entries) ? [...registry.entries] : [];
  if (classification) entries = entries.filter((entry) => entry.classification === classification);
  if (workState) entries = entries.filter((entry) => entry.work_state === workState);
  if (settlementState) entries = entries.filter((entry) => entry.settlement_state === settlementState);
  if (asset) entries = entries.filter((entry) => entry.rewards?.some((reward) => reward.asset === asset));
  if (fundingState) entries = entries.filter((entry) => entry.rewards?.some((reward) => reward.funding_state === fundingState));

  const filteredTotal = entries.length;
  entries = entries.slice(0, limit);

  const summary = {
    total_registry_entries: Array.isArray(registry.entries) ? registry.entries.length : 0,
    filtered_total: filteredTotal,
    returned: entries.length,
    by_classification: {},
    by_asset: {},
    by_funding_state: {}
  };

  for (const entry of entries) {
    summary.by_classification[entry.classification] = (summary.by_classification[entry.classification] || 0) + 1;
    for (const reward of entry.rewards || []) {
      summary.by_asset[reward.asset] = (summary.by_asset[reward.asset] || 0) + 1;
      summary.by_funding_state[reward.funding_state] = (summary.by_funding_state[reward.funding_state] || 0) + 1;
    }
  }

  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({
    success: true,
    registry_version: registry.version,
    generated_at: registry.generated_at,
    canonical_policy: registry.canonical_policy,
    privacy: {
      public_registry: true,
      contributor_email_exposed: false,
      contributor_wallet_exposed: false
    },
    filters: {
      classification,
      work_state: workState,
      settlement_state: settlementState,
      asset,
      funding_state: fundingState,
      limit
    },
    summary,
    entries
  });
};
