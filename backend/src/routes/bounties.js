const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const REGISTRY_PATH = path.resolve(__dirname, '../../../bounty-engine/registry-v2.json');

function readRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(raw);
}

function normalize(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : null;
}

router.get('/', (req, res) => {
  try {
    const registry = readRegistry();
    let entries = Array.isArray(registry.entries) ? registry.entries : [];

    const classification = normalize(req.query.classification);
    const workState = normalize(req.query.work_state);
    const settlementState = normalize(req.query.settlement_state);
    const asset = normalize(req.query.asset);
    const fundingState = normalize(req.query.funding_state);

    if (classification) {
      entries = entries.filter((entry) => entry.classification === classification);
    }

    if (workState) {
      entries = entries.filter((entry) => entry.work_state === workState);
    }

    if (settlementState) {
      entries = entries.filter((entry) => entry.settlement_state === settlementState);
    }

    if (asset) {
      entries = entries.filter((entry) =>
        Array.isArray(entry.rewards) && entry.rewards.some((reward) => reward.asset === asset)
      );
    }

    if (fundingState) {
      entries = entries.filter((entry) =>
        Array.isArray(entry.rewards) && entry.rewards.some((reward) => reward.funding_state === fundingState)
      );
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 200)
      : 100;

    const total = entries.length;
    entries = entries.slice(0, limit);

    const summary = entries.reduce(
      (acc, entry) => {
        acc.by_classification[entry.classification] =
          (acc.by_classification[entry.classification] || 0) + 1;
        acc.by_work_state[entry.work_state] = (acc.by_work_state[entry.work_state] || 0) + 1;
        acc.by_settlement_state[entry.settlement_state] =
          (acc.by_settlement_state[entry.settlement_state] || 0) + 1;

        for (const reward of entry.rewards || []) {
          acc.by_asset[reward.asset] = (acc.by_asset[reward.asset] || 0) + 1;
          acc.by_funding_state[reward.funding_state] =
            (acc.by_funding_state[reward.funding_state] || 0) + 1;
        }

        return acc;
      },
      {
        by_classification: {},
        by_work_state: {},
        by_settlement_state: {},
        by_asset: {},
        by_funding_state: {}
      }
    );

    res.json({
      success: true,
      registry_version: registry.version,
      generated_at: registry.generated_at,
      canonical_policy: registry.canonical_policy,
      filters: {
        classification,
        work_state: workState,
        settlement_state: settlementState,
        asset,
        funding_state: fundingState,
        limit
      },
      total,
      count: entries.length,
      summary,
      entries
    });
  } catch (error) {
    console.error('Bounty registry API error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to read bounty registry'
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const registry = readRegistry();
    const entry = (registry.entries || []).find((item) => item.id === req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }

    return res.json({
      success: true,
      registry_version: registry.version,
      canonical_policy: registry.canonical_policy,
      entry
    });
  } catch (error) {
    console.error('Bounty registry detail API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to read bounty registry'
    });
  }
});

module.exports = router;
