const express = require('express');
const { optionalAuthenticate } = require('../../../src/middleware/auth');
const {
  buildPartyContext,
  validatePartyContext
} = require('../services/zorgaxPartyContext');
const { answerFromPartyContext } = require('../services/zorgaxPartyAssistant');
const {
  buildPartyTelemetry,
  summarizePartyTelemetry
} = require('../services/zorgaxPartyTelemetry');

const router = express.Router();

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Zorgax-Mode', 'party');
  next();
});

async function contextForRequest(req) {
  const context = await buildPartyContext({
    user: req.user || null,
    sessionId: req.query?.sessionId || req.body?.sessionId || null
  });
  const validation = validatePartyContext(context);
  if (!validation.valid) {
    const error = new Error('PartyContext validation failed');
    error.validationErrors = validation.errors;
    throw error;
  }
  return context;
}

router.get('/party-context', optionalAuthenticate, async (req, res) => {
  try {
    const context = await contextForRequest(req);
    return res.json({ success: true, context });
  } catch (error) {
    console.error('ZORGAX PartyContext error:', error?.name || 'Error');
    return res.status(500).json({
      success: false,
      error: 'Unable to build PartyContext',
      details: error.validationErrors
    });
  }
});

router.post('/party-assistant', optionalAuthenticate, async (req, res) => {
  try {
    const context = await contextForRequest(req);
    const result = answerFromPartyContext({
      question: req.body?.question,
      context
    });

    return res.json({
      success: true,
      answer: result.answer,
      status: result.status,
      grounded: result.grounded,
      sources: result.sources,
      context: {
        id: context.id,
        version: context.version,
        generatedAt: context.generatedAt,
        expiresAt: context.expiresAt
      }
    });
  } catch (error) {
    console.error('ZORGAX Party Assistant error:', error?.name || 'Error');
    return res.status(500).json({
      success: false,
      error: 'Unable to answer from PartyContext'
    });
  }
});

router.get('/party-telemetry', optionalAuthenticate, async (_req, res) => {
  try {
    const telemetry = await buildPartyTelemetry();
    const result = summarizePartyTelemetry(telemetry);
    return res.json({
      success: true,
      status: result.status,
      summary: result.summary,
      telemetry: result.telemetry
    });
  } catch (error) {
    console.error('ZORGAX Party Telemetry error:', error?.name || 'Error');
    return res.status(500).json({
      success: false,
      error: 'Unable to build Party Mode telemetry'
    });
  }
});

module.exports = router;
