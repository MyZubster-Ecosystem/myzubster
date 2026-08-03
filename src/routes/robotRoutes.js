const express = require('express');
const router = express.Router();
const robotController = require('../controllers/robotController');
const { authenticate, isAdmin } = require('../middleware/auth');

// ============================================================
// ROBOT WALLET ROUTES
// ============================================================

// Register a new robot (creates wallet + reputation NFT)
router.post('/register', authenticate, robotController.registerRobot);

// List robots for authenticated user
router.get('/', authenticate, robotController.listRobots);

// Get robot details
router.get('/:robotId', authenticate, robotController.getRobot);

// Update spending governance (owner or admin)
router.patch('/:robotId/governance', authenticate, robotController.updateGovernance);

// ============================================================
// JOB ROUTES
// ============================================================

// Create a new job with escrow
router.post('/jobs/create', authenticate, robotController.createJob);

// List jobs
router.get('/jobs/list', authenticate, robotController.listJobs);

// Get job details
router.get('/jobs/:jobId', authenticate, robotController.getJob);

// Submit delivery proof
router.post('/jobs/:jobId/deliver', authenticate, robotController.submitDelivery);

// Verify and redeem escrow
router.post('/jobs/:jobId/verify', authenticate, robotController.verifyAndRedeem);

// Open a dispute
router.post('/jobs/:jobId/dispute', authenticate, robotController.openDispute);

// ============================================================
// ADMIN DASHBOARD
// ============================================================

// Admin dashboard
router.get('/admin/dashboard', authenticate, isAdmin, robotController.getDashboard);

module.exports = router;
