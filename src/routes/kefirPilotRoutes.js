const express = require('express');
const { createSyntheticKefirDemo } = require('../services/kefirPilotService');

const router = express.Router();

router.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'MyZubster Kefir Circular Pilot',
  pilotId: 'MZ-KEFIR-PILOT-001',
  status: 'CANDIDATE_PILOT_TRACK',
  syntheticOnly: true,
  foodOperationAuthorized: false,
  personalOrHealthDataOnChain: false,
}));

router.get('/demo', (_req, res) => {
  try {
    return res.json(createSyntheticKefirDemo());
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;
