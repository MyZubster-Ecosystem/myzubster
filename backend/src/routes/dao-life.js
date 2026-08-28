const express = require('express');
const {
  LIFE_DAO_POLICY,
  getLifeDaoPublicState,
} = require('../services/lifeDaoPolicy');

const router = express.Router();

router.get('/status', (_req, res) => {
  const state = getLifeDaoPublicState();
  return res.json({
    success: true,
    data: {
      governanceLane: state.governanceLane,
      governanceMode: state.governanceMode,
      bindingVotingPower: state.bindingVotingPower,
      enrollment: state.enrollment,
      counts: state.counts,
    },
  });
});

router.get('/policy', (_req, res) => {
  return res.json({ success: true, data: LIFE_DAO_POLICY });
});

router.get('/participants', (_req, res) => {
  const state = getLifeDaoPublicState();
  return res.json({
    success: true,
    data: state.participants,
    roleSlots: state.roleSlots,
    count: state.participants.length,
  });
});

module.exports = router;
