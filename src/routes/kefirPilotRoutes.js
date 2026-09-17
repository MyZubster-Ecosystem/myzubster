const express = require('express');
const { createSyntheticKefirDemo } = require('../services/kefirPilotService');
const marketplaceHandoverRoutes = require('./marketplaceHandoverRoutes');

const router = express.Router();

router.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'MyZubster Kefir Circular Pilot',
  pilotId: 'MZ-KEFIR-PILOT-001',
  status: 'CANDIDATE_PILOT_TRACK',
  syntheticOnly: false,
  realHandoverPath: '/api/kefir-pilot/handover',
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

// Real, authenticated Marketplace evidence flow for a free hand-delivered kefir donation.
// This records only explicit participant confirmations. It does not create payments,
// food-safety claims, learning outcomes or blockchain evidence.
router.use('/handover', marketplaceHandoverRoutes);

module.exports = router;
