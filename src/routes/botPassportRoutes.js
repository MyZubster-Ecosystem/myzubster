const express = require('express');
const { authenticate } = require('../middleware/auth');
const BotPassport = require('../models/botPassportModel');
const {
  createBotPassportInput,
  publicBotPassport
} = require('../services/botPassportService');

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const data = createBotPassportInput(req.body);
    const passport = await BotPassport.create({
      ...data,
      ownerId: String(req.userId)
    });

    res.status(201).json({
      success: true,
      passport: publicBotPassport(passport)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.statusCode ? error.message : 'Unable to create bot passport'
    });
  }
});

router.get('/mine', authenticate, async (req, res) => {
  try {
    const passports = await BotPassport
      .find({ ownerId: String(req.userId) })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      passports: passports.map(publicBotPassport)
    });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Unable to list bot passports' });
  }
});

router.post('/:botId/revoke', authenticate, async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (reason.length > 240) {
      return res.status(400).json({ success: false, error: 'reason is too long' });
    }

    const passport = await BotPassport.findOneAndUpdate(
      { botId: req.params.botId, ownerId: String(req.userId), status: { $ne: 'REVOKED' } },
      {
        $set: {
          status: 'REVOKED',
          revokedAt: new Date(),
          revocationReason: reason || null
        }
      },
      { new: true }
    );

    if (!passport) {
      return res.status(404).json({ success: false, error: 'Bot passport not found' });
    }

    res.json({ success: true, passport: publicBotPassport(passport) });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Unable to revoke bot passport' });
  }
});

router.get('/:botId', async (req, res) => {
  try {
    const passport = await BotPassport.findOne({ botId: req.params.botId }).lean();
    if (!passport) {
      return res.status(404).json({ success: false, error: 'Bot passport not found' });
    }

    res.json({ success: true, passport: publicBotPassport(passport) });
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Unable to load bot passport' });
  }
});

module.exports = router;
