// Community Ambassador API Routes
// /api/ambassadors/* endpoints

const express = require('express');
const router = express.Router();
const Ambassador = require('../models/Ambassador');

// Initialize with database
let ambassador;

// Middleware to initialize model
router.use((req, res, next) => {
  if (!ambassador) {
    const db = req.app.get('db');
    ambassador = new Ambassador(db);
  }
  next();
});

// ── Get Ambassador Profile ──
// GET /api/ambassadors/:id
router.get('/:id', async (req, res) => {
  try {
    const profile = await ambassador.getAmbassador(parseInt(req.params.id));
    if (!profile) {
      return res.status(404).json({ error: 'Ambassador not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── List Ambassadors ──
// GET /api/ambassadors?status=active&role=local
router.get('/', async (req, res) => {
  try {
    const { status, role } = req.query;
    const ambassadors = await ambassador.listAmbassadors(status, role);
    res.json({
      count: ambassadors.length,
      ambassadors,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Apply to be Ambassador ──
// POST /api/ambassadors/apply
router.post('/apply', async (req, res) => {
  try {
    const { userId, role, bio, location } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role are required' });
    }

    const validRoles = ['local', 'content_creator', 'event_organizer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role',
        validRoles,
      });
    }

    const result = await ambassador.createAmbassador(userId, role, bio, location);
    res.status(201).json({
      message: 'Ambassador application submitted',
      ambassador: result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Update Ambassador Status ──
// PATCH /api/ambassadors/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'active', 'inactive', 'suspended'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status', validStatuses });
    }

    const result = await ambassador.updateAmbassadorStatus(parseInt(req.params.id), status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Log Activity ──
// POST /api/ambassadors/:id/activities
router.post('/:id/activities', async (req, res) => {
  try {
    const { type, description, points } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Activity type is required' });
    }

    const validTypes = ['event_organized', 'event_attended', 'content_created', 
                        'community_helped', 'referral', 'feedback'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid activity type', validTypes });
    }

    const result = await ambassador.logActivity(
      parseInt(req.params.id),
      type,
      description,
      points || 10
    );
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Get Activities ──
// GET /api/ambassadors/:id/activities
router.get('/:id/activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = await ambassador.getActivities(parseInt(req.params.id), limit);
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Leaderboard ──
// GET /api/ambassadors/leaderboard/top
router.get('/leaderboard/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await ambassador.getLeaderboard(limit);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Events ──
// GET /api/ambassadors/events/list
router.get('/events/list', async (req, res) => {
  try {
    const { status } = req.query;
    const events = await ambassador.listEvents(status);
    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ambassadors/events/create
router.post('/events/create', async (req, res) => {
  try {
    const { organizerId, title, description, type, location, startTime, endTime, maxParticipants } = req.body;
    
    if (!organizerId || !title || !type || !startTime) {
      return res.status(400).json({ error: 'organizerId, title, type, and startTime are required' });
    }

    const validTypes = ['meetup', 'workshop', 'talk', 'hackathon', 'online'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid event type', validTypes });
    }

    const event = await ambassador.createEvent(organizerId, {
      title, description, type, location, startTime, endTime, maxParticipants,
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ambassadors/events/:id/register
router.post('/events/:id/register', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await ambassador.registerForEvent(parseInt(req.params.id), userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── Rewards ──
// GET /api/ambassadors/rewards/available
router.get('/rewards/available', async (req, res) => {
  try {
    const rewards = await ambassador.getRewards();
    res.json({ rewards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ambassadors/rewards/claim
router.post('/rewards/claim', async (req, res) => {
  try {
    const { ambassadorId, rewardType, rewardName, pointsCost } = req.body;
    
    if (!ambassadorId || !rewardType || !rewardName || !pointsCost) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await ambassador.claimReward(ambassadorId, rewardType, rewardName, pointsCost);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── Statistics ──
// GET /api/ambassadors/stats/overview
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await ambassador.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
