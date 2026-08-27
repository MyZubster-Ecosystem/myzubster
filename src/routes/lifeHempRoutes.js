const express = require('express');
const LifeHempCircularEntry = require('../models/LifeHempCircularEntry');
const LifeHempOperator = require('../models/LifeHempOperator');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = [
  { id: 'fiber-textiles', label: 'Fibra e tessili', regulated: false },
  { id: 'paper-packaging', label: 'Carta e packaging', regulated: false },
  { id: 'building-materials', label: 'Edilizia e biomateriali', regulated: false },
  { id: 'agri-residues', label: 'Residui e riuso agricolo', regulated: false },
  { id: 'regulated-cannabinoids', label: 'Cannabinoidi regolamentati', regulated: true, commerceEnabled: false }
];

function normalizeNonNegativeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

router.get('/status', (_req, res) => {
  res.json({
    ok: true,
    module: 'Life Hemp Circular Economy & Regulated Compliance',
    regulatedCommerceDefaultEnabled: false,
    categories: CATEGORIES
  });
});

router.get('/summary', async (_req, res) => {
  try {
    const [aggregate, verifiedOperators] = await Promise.all([
      LifeHempCircularEntry.aggregate([
        { $match: { verified: true } },
        { $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          reusedMaterialKg: { $sum: '$reusedMaterialKg' },
          avoidedWasteKg: { $sum: '$avoidedWasteKg' },
          estimatedCo2eAvoidedKg: { $sum: '$estimatedCo2eAvoidedKg' }
        } }
      ]),
      LifeHempOperator.countDocuments({ status: 'VERIFIED' })
    ]);
    const totals = aggregate[0] || {
      totalEntries: 0,
      reusedMaterialKg: 0,
      avoidedWasteKg: 0,
      estimatedCo2eAvoidedKg: 0
    };
    res.json({
      ok: true,
      totals,
      compliance: {
        verifiedOperatorCount: verifiedOperators,
        regulatedCommerceDefaultEnabled: false,
        publicOperatorDirectoryEnabled: false
      }
    });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'Life hemp storage temporarily unavailable' });
  }
});

router.get('/entries', async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const entries = await LifeHempCircularEntry.find({ verified: true })
      .select('category title description territory reusedMaterialKg avoidedWasteKg estimatedCo2eAvoidedKg evidenceUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ ok: true, entries });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'Life hemp storage temporarily unavailable' });
  }
});

router.post('/entries', authenticate, async (req, res) => {
  try {
    const {
      category,
      title,
      description = '',
      territory = '',
      reusedMaterialKg = 0,
      avoidedWasteKg = 0,
      estimatedCo2eAvoidedKg = 0,
      evidenceUrl = ''
    } = req.body || {};

    const allowedCategory = CATEGORIES.find(item => item.id === category && item.regulated === false);
    if (!allowedCategory) {
      return res.status(400).json({ ok: false, error: 'Only industrial-hemp circular categories can be submitted here' });
    }
    if (!title || String(title).trim().length < 3) {
      return res.status(400).json({ ok: false, error: 'title is required' });
    }

    const entry = await LifeHempCircularEntry.create({
      category,
      title: String(title).trim(),
      description,
      territory,
      reusedMaterialKg: normalizeNonNegativeNumber(reusedMaterialKg),
      avoidedWasteKg: normalizeNonNegativeNumber(avoidedWasteKg),
      estimatedCo2eAvoidedKg: normalizeNonNegativeNumber(estimatedCo2eAvoidedKg),
      evidenceUrl,
      verified: false,
      createdBy: req.userId,
      createdByUsername: req.username || ''
    });

    res.status(201).json({
      ok: true,
      entry: { id: entry._id, verified: entry.verified },
      message: 'Entry saved and pending verification'
    });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'Life hemp storage temporarily unavailable' });
  }
});

router.patch('/entries/:id/verify', authenticate, isAdmin, async (req, res) => {
  try {
    const entry = await LifeHempCircularEntry.findByIdAndUpdate(
      req.params.id,
      { $set: { verified: Boolean(req.body?.verified), updatedAt: new Date() } },
      { new: true }
    );
    if (!entry) return res.status(404).json({ ok: false, error: 'Entry not found' });
    res.json({ ok: true, entry: { id: entry._id, verified: entry.verified } });
  } catch (error) {
    res.status(400).json({ ok: false, error: 'Unable to update entry verification' });
  }
});

router.get('/compliance/summary', async (_req, res) => {
  try {
    const counts = await LifeHempOperator.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    res.json({
      ok: true,
      statuses: counts.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {}),
      regulatedCommerceDefaultEnabled: false,
      publicOperatorDirectoryEnabled: false
    });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'Compliance registry temporarily unavailable' });
  }
});

router.post('/compliance/operators', authenticate, isAdmin, async (req, res) => {
  try {
    const operator = await LifeHempOperator.create({
      ...req.body,
      status: req.body?.status || 'UNVERIFIED',
      commerceEnabled: false,
      reviewedBy: req.username || String(req.userId || '')
    });
    res.status(201).json({ ok: true, id: operator._id, status: operator.status, commerceEnabled: false });
  } catch (error) {
    const status = error?.code === 11000 ? 409 : 400;
    res.status(status).json({ ok: false, error: status === 409 ? 'Operator already registered for this jurisdiction' : 'Invalid compliance record' });
  }
});

router.patch('/compliance/operators/:id/review', authenticate, isAdmin, async (req, res) => {
  try {
    const allowed = ['UNVERIFIED', 'PENDING_REVIEW', 'VERIFIED', 'SUSPENDED', 'REJECTED'];
    const status = String(req.body?.status || '');
    if (!allowed.includes(status)) return res.status(400).json({ ok: false, error: 'Invalid status' });

    const operator = await LifeHempOperator.findById(req.params.id);
    if (!operator) return res.status(404).json({ ok: false, error: 'Operator not found' });

    operator.status = status;
    operator.lastReviewedAt = new Date();
    operator.reviewedBy = req.username || String(req.userId || '');
    operator.commerceEnabled = false;
    await operator.save();

    res.json({ ok: true, id: operator._id, status: operator.status, commerceEnabled: false });
  } catch (error) {
    res.status(400).json({ ok: false, error: 'Unable to review operator' });
  }
});

module.exports = router;
