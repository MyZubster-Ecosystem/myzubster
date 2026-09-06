const express = require('express');
const { optionalAuthenticate } = require('../../../src/middleware/auth');
const {
  buildPartyContext,
  validatePartyContext
} = require('../services/zorgaxPartyContext');

const router = express.Router();

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Zorgax-Mode', 'party');
  next();
});

router.get('/party-context', optionalAuthenticate, async (req, res) => {
  try {
    const context = await buildPartyContext({
      user: req.user || null,
      sessionId: req.query?.sessionId || null
    });
    const validation = validatePartyContext(context);

    if (!validation.valid) {
      return res.status(500).json({
        success: false,
        error: 'PartyContext validation failed',
        details: validation.errors
      });
    }

    return res.json({
      success: true,
      context
    });
  } catch (error) {
    console.error('ZORGAX PartyContext error:', error?.name || 'Error');
    return res.status(500).json({
      success: false,
      error: 'Unable to build PartyContext'
    });
  }
});

module.exports = router;
