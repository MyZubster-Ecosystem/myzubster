const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const KnowledgeDraft = require('../models/KnowledgeDraft');
const KnowledgeLink = require('../models/KnowledgeLink');
const router = express.Router();
const publicCard = { status: 'published', visibility: 'public' };
const isId = mongoose.isValidObjectId;
const relations = new Set(['related_to', 'builds_on', 'complements', 'uses_method']);

// Public links require bilateral approval AND two currently public Knowledge Cards.
// Returning only a deliberately selected response prevents owner IDs and private notes leaking.
router.get('/public', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const links = await KnowledgeLink.find({ status: 'accepted' }).sort({ reviewedAt: -1 }).limit(300).lean();
    const ids = [...new Set(links.flatMap(link => [String(link.sourceCardId), String(link.targetCardId)]))];
    if (!ids.length) return res.json({ success: true, links: [] });
    const cards = await KnowledgeDraft.find({ _id: { $in: ids }, ...publicCard })
      .select('title domain publisherName').lean();
    const cardMap = new Map(cards.map(card => [String(card._id), card]));
    return res.json({ success: true, links: links.filter(link => cardMap.has(String(link.sourceCardId)) && cardMap.has(String(link.targetCardId))).map(link => ({
      id: link._id,
      sourceCardId: link.sourceCardId,
      targetCardId: link.targetCardId,
      relation: link.relation,
      note: link.note,
      sourceTitle: cardMap.get(String(link.sourceCardId)).title,
      targetTitle: cardMap.get(String(link.targetCardId)).title
    })) });
  } catch (_) { return res.status(500).json({ success: false, error: 'Collegamenti temporaneamente non disponibili' }); }
});

// Pending links are only visible to their involved authenticated accounts.
router.get('/mine', authenticate, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const links = await KnowledgeLink.find({ $or: [{ proposerId: req.userId }, { recipientId: req.userId }] })
      .sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, links: links.map(link => ({
      id: link._id, sourceCardId: link.sourceCardId, targetCardId: link.targetCardId,
      relation: link.relation, note: link.note, status: link.status, createdAt: link.createdAt,
      role: String(link.proposerId) === String(req.userId) ? 'proposer' : 'recipient'
    })) });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile leggere i collegamenti' }); }
});

router.post('/', authenticate, async (req, res) => {
  const { sourceCardId, targetCardId, relation } = req.body || {};
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  if (!isId(sourceCardId) || !isId(targetCardId) || String(sourceCardId) === String(targetCardId) ||
      !relations.has(relation) || note.length < 10 || note.length > 500) {
    return res.status(400).json({ success: false, error: 'Indica due schede diverse, una relazione valida e una motivazione (10-500 caratteri)' });
  }
  try {
    const [source, target] = await Promise.all([
      KnowledgeDraft.findOne({ _id: sourceCardId, ownerId: req.userId, ...publicCard }).select('ownerId').lean(),
      KnowledgeDraft.findOne({ _id: targetCardId, ...publicCard }).select('ownerId').lean()
    ]);
    if (!source || !target || String(source.ownerId) === String(target.ownerId)) {
      return res.status(422).json({ success: false, error: 'Le schede devono essere pubbliche e appartenere a due titolari diversi; la prima deve essere tua' });
    }
    const existing = await KnowledgeLink.findOne({
      sourceCardId, targetCardId, status: { $in: ['pending', 'accepted'] }
    }).lean();
    if (existing) return res.status(409).json({ success: false, error: 'Collegamento già proposto o approvato' });
    const link = await KnowledgeLink.create({
      sourceCardId, targetCardId, proposerId: req.userId, recipientId: target.ownerId,
      relation, note, status: 'pending'
    });
    return res.status(201).json({ success: true, id: link._id, status: 'pending' });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile proporre il collegamento' }); }
});

router.post('/:id/decision', authenticate, async (req, res) => {
  if (!isId(req.params.id) || !['accepted', 'declined'].includes(req.body?.decision)) {
    return res.status(400).json({ success: false, error: 'Decisione non valida' });
  }
  try {
    const candidate = await KnowledgeLink.findOne({ _id: req.params.id, recipientId: req.userId, status: 'pending' }).lean();
    if (!candidate) return res.status(404).json({ success: false, error: 'Proposta non disponibile' });
    const [source, target] = await Promise.all([
      KnowledgeDraft.findOne({ _id: candidate.sourceCardId, ownerId: candidate.proposerId, ...publicCard }).select('_id').lean(),
      KnowledgeDraft.findOne({ _id: candidate.targetCardId, ownerId: req.userId, ...publicCard }).select('_id').lean()
    ]);
    if (!source || !target) return res.status(409).json({ success: false, error: 'Una scheda non è più pubblica: proposta non approvabile' });
    const link = await KnowledgeLink.findOneAndUpdate(
      { _id: candidate._id, recipientId: req.userId, status: 'pending' },
      { $set: { status: req.body.decision, reviewedAt: new Date() } },
      { new: true, runValidators: true }
    );
    return link ? res.json({ success: true, status: link.status }) : res.status(409).json({ success: false, error: 'Proposta già modificata' });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile esaminare la proposta' }); }
});

router.post('/:id/withdraw', authenticate, async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ success: false, error: 'Collegamento non valido' });
  try {
    const link = await KnowledgeLink.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['pending', 'accepted'] }, $or: [{ proposerId: req.userId }, { recipientId: req.userId }] },
      { $set: { status: 'withdrawn', reviewedAt: new Date() } },
      { new: true, runValidators: true }
    );
    return link ? res.json({ success: true, status: link.status }) : res.status(404).json({ success: false, error: 'Collegamento non trovato' });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile ritirare il collegamento' }); }
});

module.exports = router;
