const express = require('express');
const mongoose = require('mongoose');
const SkillExchange = require('../models/SkillExchange');
const { authenticate } = require('../middleware/auth');
const { isParticipant, confirmStart, confirmCompletion } = require('../services/skillExchangeState');

const router = express.Router();
let connectionPromise = null;

async function ensureMongo() {
  if (process.env.NODE_ENV === 'test') return;
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MongoDB is not configured');
  connectionPromise = mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
    .catch(error => { connectionPromise = null; throw error; });
  return connectionPromise;
}

router.use(async (_req, res, next) => {
  try { await ensureMongo(); next(); }
  catch (_error) { res.status(503).json({ success: false, error: 'Lavori storage temporarily unavailable' }); }
});

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeRegex(value, max) {
  const cleaned = cleanText(value, max);
  return cleaned ? new RegExp(escapeRegex(cleaned), 'i') : null;
}

function actorId(req) {
  return req.userId == null ? null : String(req.userId);
}

router.get('/offers', async (req, res, next) => {
  try {
    const filter = { status: req.query.status ? cleanText(req.query.status, 20) : 'open' };
    const offeredSkill = safeRegex(req.query.offeredSkill, 120);
    const requestedSkill = safeRegex(req.query.requestedSkill, 120);
    const location = safeRegex(req.query.location, 160);
    if (offeredSkill) filter.offeredSkill = offeredSkill;
    if (requestedSkill) filter.requestedSkill = requestedSkill;
    if (location) filter.location = location;
    const offers = await SkillExchange.find(filter)
      .select('-applications -startConfirmedBy -completionConfirmedBy')
      .sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, offers });
  } catch (error) { return next(error); }
});

router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const id = actorId(req);
    if (!id) return res.status(401).json({ success: false, error: 'Authenticated user id is required' });

    const offers = await SkillExchange.find({
      $or: [
        { ownerId: id },
        { participantId: id },
        { 'applications.applicantId': id }
      ]
    }).sort({ updatedAt: -1, createdAt: -1 }).limit(100).lean();

    const projected = offers.map(offer => {
      const isOwner = String(offer.ownerId) === id;
      const isMatchedParticipant = String(offer.participantId || '') === id;
      return {
        ...offer,
        applications: isOwner
          ? offer.applications
          : (offer.applications || []).filter(application => String(application.applicantId) === id),
        startConfirmedBy: isOwner || isMatchedParticipant ? (offer.startConfirmedBy || []) : [],
        completionConfirmedBy: isOwner || isMatchedParticipant ? (offer.completionConfirmedBy || []) : []
      };
    });

    return res.json({ success: true, offers: projected });
  } catch (error) { return next(error); }
});

router.get('/offers/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid offer id' });
    const offer = await SkillExchange.findById(req.params.id)
      .select('-applications -startConfirmedBy -completionConfirmedBy').lean();
    if (!offer) return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    return res.json({ success: true, offer });
  } catch (error) { return next(error); }
});

router.get('/offers/:id/applications', authenticate, async (req, res, next) => {
  try {
    const id = actorId(req);
    const offer = await SkillExchange.findById(req.params.id).select('ownerId applications status');
    if (!offer) return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    if (String(offer.ownerId) !== id) return res.status(403).json({ success: false, error: 'Only the owner can view applications' });
    return res.json({ success: true, applications: offer.applications, status: offer.status });
  } catch (error) { return next(error); }
});

router.post('/offers', authenticate, async (req, res, next) => {
  try {
    const ownerId = actorId(req);
    if (!ownerId) return res.status(401).json({ success: false, error: 'Authenticated user id is required' });
    const title = cleanText(req.body.title, 120);
    const description = cleanText(req.body.description, 3000);
    const offeredSkill = cleanText(req.body.offeredSkill, 120);
    const requestedSkill = cleanText(req.body.requestedSkill, 120);
    const mode = ['remote', 'local', 'hybrid'].includes(req.body.mode) ? req.body.mode : 'remote';
    const location = cleanText(req.body.location, 160);
    if (!title || !description || !offeredSkill || !requestedSkill) {
      return res.status(400).json({ success: false, error: 'title, description, offeredSkill and requestedSkill are required' });
    }
    const offer = await SkillExchange.create({ ownerId, title, description, offeredSkill, requestedSkill, mode, location });
    return res.status(201).json({ success: true, offer });
  } catch (error) { return next(error); }
});

router.post('/offers/:id/applications', authenticate, async (req, res, next) => {
  try {
    const applicantId = actorId(req);
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    if (offer.status !== 'open') return res.status(409).json({ success: false, error: 'Exchange offer is not open' });
    if (String(offer.ownerId) === applicantId) return res.status(400).json({ success: false, error: 'Owner cannot apply to own exchange' });
    if (offer.applications.some(application => String(application.applicantId) === applicantId && application.status !== 'withdrawn')) {
      return res.status(409).json({ success: false, error: 'Application already exists' });
    }
    offer.applications.push({ applicantId, message: cleanText(req.body.message, 1000) });
    await offer.save();
    return res.status(201).json({ success: true, application: offer.applications.at(-1) });
  } catch (error) { return next(error); }
});

router.post('/offers/:id/applications/:applicationId/accept', authenticate, async (req, res, next) => {
  try {
    const ownerId = actorId(req);
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    if (String(offer.ownerId) !== ownerId) return res.status(403).json({ success: false, error: 'Only the owner can accept an application' });
    if (offer.status !== 'open') return res.status(409).json({ success: false, error: 'Exchange offer is not open' });
    const selected = offer.applications.id(req.params.applicationId);
    if (!selected || selected.status !== 'pending') return res.status(404).json({ success: false, error: 'Pending application not found' });
    selected.status = 'accepted';
    offer.participantId = String(selected.applicantId);
    offer.status = 'matched';
    for (const application of offer.applications) {
      if (String(application._id) !== String(selected._id) && application.status === 'pending') application.status = 'rejected';
    }
    await offer.save();
    return res.json({ success: true, offer });
  } catch (error) { return next(error); }
});

router.post('/offers/:id/start-confirmation', authenticate, async (req, res, next) => {
  try {
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    confirmStart(offer, actorId(req));
    await offer.save();
    return res.json({ success: true, status: offer.status, startConfirmedBy: offer.startConfirmedBy });
  } catch (error) { return next(error); }
});

router.post('/offers/:id/completion-confirmation', authenticate, async (req, res, next) => {
  try {
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    confirmCompletion(offer, actorId(req));
    await offer.save();
    return res.json({ success: true, status: offer.status, completionConfirmedBy: offer.completionConfirmedBy });
  } catch (error) { return next(error); }
});

router.post('/offers/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const reviewerId = actorId(req);
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, error: 'Exchange offer not found' });
    if (offer.status !== 'completed') return res.status(409).json({ success: false, error: 'Reviews are allowed only after completion' });
    if (!isParticipant(offer, reviewerId)) return res.status(403).json({ success: false, error: 'Only participants can review this exchange' });
    if (offer.reviews.some(review => String(review.reviewerId) === reviewerId)) return res.status(409).json({ success: false, error: 'Review already submitted' });
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, error: 'rating must be an integer from 1 to 5' });
    const revieweeId = String(offer.ownerId) === reviewerId ? String(offer.participantId) : String(offer.ownerId);
    offer.reviews.push({ reviewerId, revieweeId, rating, comment: cleanText(req.body.comment, 1000) });
    await offer.save();
    return res.status(201).json({ success: true, review: offer.reviews.at(-1) });
  } catch (error) { return next(error); }
});

module.exports = router;
