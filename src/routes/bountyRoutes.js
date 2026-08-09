
/**
 * Bounty Routes
 * Defines API endpoints for bounty management including
 * automatic reward assignment and minting
 */

const express = require('express');
const router = express.Router();

const {
  getBounties,
  getBountyById,
  createBounty,
  assignBounty,
  mintReward,
  assignAndMint,
  getRewardStatus,
  updateBounty,
  deleteBounty
} = require('../controllers/bountyController');

// ── Basic CRUD ──────────────────────────────────────────────────────────────

// GET  /api/bounties          - list all bounties
router.get('/', getBounties);

// GET  /api/bounties/:id      - get a single bounty
router.get('/:id', getBountyById);

// POST /api/bounties          - create a new bounty
router.post('/', createBounty);

// PUT  /api/bounties/:id      - update a bounty
router.put('/:id', updateBounty);

// DELETE /api/bounties/:id    - delete a bounty
router.delete('/:id', deleteBounty);

// ── Reward Assignment & Minting ─────────────────────────────────────────────

// POST /api/bounties/:id/assign
// Automatically assign a bounty to a user
router.post('/:id/assign', assignBounty);

// POST /api/bounties/:id/mint
// Mint the reward for a completed/assigned bounty
router.post('/:id/mint', mintReward);

// POST /api/bounties/:id/assign-and-mint
// Atomic: assign + mint in one request (automatic reward distribution)
router.post('/:id/assign-and-mint', assignAndMint);

// GET  /api/bounties/:id/reward-status
// Check the minting/assignment status of a bounty reward
router.get('/:id/reward-status', getRewardStatus);

module.exports = router;
    