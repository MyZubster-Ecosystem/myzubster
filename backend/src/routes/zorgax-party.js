const express = require('express');
const { optionalAuthenticate, authenticate } = require('../../../src/middleware/auth');
const {
  buildPartyContext,
  validatePartyContext
} = require('../services/zorgaxPartyContext');
const { answerFromPartyContext } = require('../services/zorgaxPartyAssistant');
const {
  buildPartyTelemetry,
  summarizePartyTelemetry
} = require('../services/zorgaxPartyTelemetry');
const {
  publicAllowlist,
  executePartyCommand
} = require('../services/zorgaxPartyCommands');
const {
  createPartyReport,
  moderationSummary,
  reviewPartyReport,
  moderationCapabilities
} = require('../services/zorgaxPartyModeration');
const {
  archiveCapabilities,
  createArchiveHandoff,
  getLatestArchive
} = require('../services/zorgaxPartyArchive');

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

router.get('/party-capabilities', (_req, res) => {
  return res.json({
    success: true,
    commands: publicAllowlist(),
    moderation: moderationCapabilities(),
    archive: archiveCapabilities(),
    unavailableCategories: [
      'financial-actions',
      'concealed-location-distribution',
      'robot-commands',
      'physical-system-commands',
      'unrestricted-tool-execution'
    ]
  });
});

router.get('/party-archive', async (_req, res) => {
  try {
    const result = await getLatestArchive();
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('ZORGAX Party Archive error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to load Party Mode archive context' });
  }
});

router.post('/party-archive-handoff', authenticate, async (req, res) => {
  try {
    const result = await createArchiveHandoff({
      actorUserId: req.userId,
      actorRole: req.userRole || 'user',
      confirmed: req.body?.confirmed === true,
      communityId: req.body?.communityId,
      eventId: req.body?.eventId,
      roomId: req.body?.roomId,
      visibility: req.body?.visibility || 'private',
      assets: req.body?.assets || []
    });
    if (!result.valid) {
      return res.status(result.status || 400).json({ success: false, error: result.error });
    }
    return res.status(result.status || 201).json({ success: true, archive: result.archive });
  } catch (error) {
    console.error('ZORGAX Party Archive Handoff error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to create Party Mode archive handoff' });
  }
});

router.post('/party-command', authenticate, async (req, res) => {
  try {
    const result = await executePartyCommand({
      command: req.body?.command,
      actorUserId: req.userId,
      actorRole: req.userRole || 'user',
      confirmed: req.body?.confirmed === true,
      idempotencyKey: req.get('Idempotency-Key') || req.body?.idempotencyKey,
      payload: req.body?.payload || {}
    });

    if (!result.valid) {
      return res.status(result.status || 400).json({
        success: false,
        error: result.error
      });
    }

    return res.status(result.status || 200).json({
      success: true,
      command: result.command,
      outcome: result.outcome,
      duplicate: result.duplicate === true,
      resource: result.resource || null,
      result: result.result || null
    });
  } catch (error) {
    console.error('ZORGAX Party Command error:', error?.name || 'Error');
    return res.status(500).json({
      success: false,
      error: 'Unable to execute Party Mode command'
    });
  }
});

router.post('/party-reports', authenticate, async (req, res) => {
  try {
    const result = await createPartyReport({
      reporterUserId: req.userId,
      targetType: req.body?.targetType,
      targetId: req.body?.targetId,
      reason: req.body?.reason,
      details: req.body?.details
    });

    if (!result.valid) {
      return res.status(result.status || 400).json({ success: false, error: result.error });
    }

    return res.status(result.status).json({ success: true, report: result.report });
  } catch (error) {
    console.error('ZORGAX Party Report error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to submit Party Mode report' });
  }
});

router.get('/party-moderation-summary', authenticate, async (req, res) => {
  try {
    const result = await moderationSummary({ actorRole: req.userRole || 'user' });
    if (!result.valid) {
      return res.status(result.status || 400).json({ success: false, error: result.error });
    }
    return res.json({ success: true, summary: result.summary });
  } catch (error) {
    console.error('ZORGAX Party Moderation Summary error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to load moderation summary' });
  }
});

router.post('/party-moderation-action', authenticate, async (req, res) => {
  try {
    const result = await reviewPartyReport({
      actorUserId: req.userId,
      actorRole: req.userRole || 'user',
      reportId: req.body?.reportId,
      action: req.body?.action,
      note: req.body?.note
    });

    if (!result.valid) {
      return res.status(result.status || 400).json({ success: false, error: result.error });
    }

    return res.json({ success: true, action: result.action, report: result.report });
  } catch (error) {
    console.error('ZORGAX Party Moderation Action error:', error?.name || 'Error');
    return res.status(500).json({ success: false, error: 'Unable to update moderation report' });
  }
});

module.exports = router;
