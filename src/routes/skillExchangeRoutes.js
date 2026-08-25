const express = require('express');
const SkillExchange = require('../models/SkillExchange');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const same = (a, b) => String(a) === String(b);
const addUnique = (list, id) => [...new Set([...(list || []).map(String), String(id)])];
const participants = offer => [String(offer.ownerId), String(offer.participantId || '')].filter(Boolean);

router.get('/offers', async (req, res, next) => {
  try {
    const offers = await SkillExchange.find({ status: req.query.status || 'open' })
      .select('-applications -startConfirmedBy -completionConfirmedBy')
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, offers });
  } catch (error) { next(error); }
});

router.post('/offers', authenticate, async (req, res, next) => {
  try {
    const title = clean(req.body.title, 120);
    const description = clean(req.body.description, 3000);
    const offeredSkill = clean(req.body.offeredSkill, 120);
    const requestedSkill = clean(req.body.requestedSkill, 120);
    if (!title || !description || !offeredSkill || !requestedSkill) {
      return res.status(400).json({ success: false, message: 'Campi obbligatori mancanti' });
    }
    const offer = await SkillExchange.create({ ownerId: String(req.userId), title, description, offeredSkill, requestedSkill, mode: ['remote','local','hybrid'].includes(req.body.mode) ? req.body.mode : 'remote', location: clean(req.body.location, 160) });
    res.status(201).json({ success: true, offer });
  } catch (error) { next(error); }
});

router.post('/offers/:id/applications', authenticate, async (req, res, next) => {
  try {
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offerta non trovata' });
    if (offer.status !== 'open') return res.status(409).json({ success: false, message: 'Offerta non aperta' });
    if (same(offer.ownerId, req.userId)) return res.status(400).json({ success: false, message: 'Non puoi candidarti alla tua offerta' });
    if (offer.applications.some(a => same(a.applicantId, req.userId) && a.status !== 'withdrawn')) return res.status(409).json({ success: false, message: 'Candidatura già presente' });
    offer.applications.push({ applicantId: String(req.userId), message: clean(req.body.message, 1000) });
    await offer.save();
    res.status(201).json({ success: true });
  } catch (error) { next(error); }
});

router.get('/offers/:id/applications', authenticate, async (req, res, next) => {
  try {
    const offer = await SkillExchange.findById(req.params.id).select('ownerId applications status');
    if (!offer) return res.status(404).json({ success: false, message: 'Offerta non trovata' });
    if (!same(offer.ownerId, req.userId)) return res.status(403).json({ success: false, message: 'Solo il proprietario può vedere le candidature' });
    res.json({ success: true, applications: offer.applications, status: offer.status });
  } catch (error) { next(error); }
});

router.post('/offers/:id/applications/:applicationId/accept', authenticate, async (req, res, next) => {
  try {
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offerta non trovata' });
    if (!same(offer.ownerId, req.userId)) return res.status(403).json({ success: false, message: 'Solo il proprietario può accettare' });
    const selected = offer.applications.id(req.params.applicationId);
    if (!selected || selected.status !== 'pending') return res.status(404).json({ success: false, message: 'Candidatura non trovata' });
    selected.status = 'accepted';
    offer.participantId = String(selected.applicantId);
    offer.status = 'matched';
    offer.applications.forEach(a => { if (!same(a._id, selected._id) && a.status === 'pending') a.status = 'rejected'; });
    await offer.save();
    res.json({ success: true, offer });
  } catch (error) { next(error); }
});

router.post('/offers/:id/start-confirmation', authenticate, async (req, res, next) => {
  try {
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offerta non trovata' });
    if (!participants(offer).includes(String(req.userId))) return res.status(403).json({ success: false, message: 'Solo i partecipanti possono confermare' });
    if (!['matched','active'].includes(offer.status)) return res.status(409).json({ success: false, message: 'Scambio non pronto per iniziare' });
    offer.startConfirmedBy = addUnique(offer.startConfirmedBy, req.userId);
    if (participants(offer).every(id => offer.startConfirmedBy.map(String).includes(id))) offer.status = 'active';
    await offer.save();
    res.json({ success: true, status: offer.status });
  } catch (error) { next(error); }
});

router.post('/offers/:id/completion-confirmation', authenticate, async (req, res, next) => {
  try {
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offerta non trovata' });
    if (!participants(offer).includes(String(req.userId))) return res.status(403).json({ success: false, message: 'Solo i partecipanti possono confermare' });
    if (!['active','completed'].includes(offer.status)) return res.status(409).json({ success: false, message: 'Scambio non attivo' });
    offer.completionConfirmedBy = addUnique(offer.completionConfirmedBy, req.userId);
    if (participants(offer).every(id => offer.completionConfirmedBy.map(String).includes(id))) offer.status = 'completed';
    await offer.save();
    res.json({ success: true, status: offer.status });
  } catch (error) { next(error); }
});

router.post('/offers/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const offer = await SkillExchange.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offerta non trovata' });
    if (offer.status !== 'completed' || !participants(offer).includes(String(req.userId))) return res.status(403).json({ success: false, message: 'Review non consentita' });
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: 'Rating 1-5 richiesto' });
    if (offer.reviews.some(r => same(r.reviewerId, req.userId))) return res.status(409).json({ success: false, message: 'Review già inviata' });
    const revieweeId = same(offer.ownerId, req.userId) ? String(offer.participantId) : String(offer.ownerId);
    offer.reviews.push({ reviewerId: String(req.userId), revieweeId, rating, comment: clean(req.body.comment, 1000) });
    await offer.save();
    res.status(201).json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
