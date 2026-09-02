const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const mongoose = require('mongoose');
const MarketplaceListing = require('../models/MarketplaceListing');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const MarketplaceReport = require('../models/MarketplaceReport');
const MarketplaceReview = require('../models/MarketplaceReview');
const MarketplaceMessage = require('../models/MarketplaceMessage');
const { authenticate } = require('../middleware/auth');

const mutationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Troppe operazioni Marketplace. Riprova tra poco.' } });
const messageLimiter = rateLimit({ windowMs: 60 * 1000, max: 12, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Troppi messaggi. Attendi un minuto.' } });
const reportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Limite segnalazioni raggiunto. Riprova più tardi.' } });

function requireModerator(req, res, next) {
  if (!['admin', 'moderator'].includes(req.userRole)) return res.status(403).json({ success: false, message: 'Permessi moderazione insufficienti' });
  next();
}

async function participantOrder(orderId, userId) {
  const order = await MarketplaceOrder.findById(orderId);
  if (!order) return null;
  const uid = String(userId);
  if (![String(order.buyerId), String(order.sellerId)].includes(uid)) return false;
  return order;
}

router.post('/orders', authenticate, mutationLimiter, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({ _id: req.body?.listingId, status: 'active' });
    if (!listing) return res.status(404).json({ success: false, message: 'Annuncio non disponibile' });
    if (String(listing.ownerId) === String(req.userId)) return res.status(400).json({ success: false, message: 'Non puoi richiedere il tuo stesso annuncio' });
    const quantity = Math.max(1, Math.min(1000, Number(req.body?.quantity) || 1));
    if (listing.stock < quantity) return res.status(400).json({ success: false, message: 'Quantità superiore alla disponibilità' });
    const recentDuplicate = await MarketplaceOrder.findOne({ listingId: listing._id, buyerId: req.userId, status: { $in: ['REQUESTED','ACCEPTED'] } });
    if (recentDuplicate) return res.status(409).json({ success: false, message: 'Hai già una richiesta aperta per questo annuncio' });
    const order = await MarketplaceOrder.create({ listingId: listing._id, buyerId: req.userId, sellerId: listing.ownerId, quantity, note: String(req.body?.note || '').trim(), snapshot: { title: listing.title, price: listing.price, currency: listing.currency, exchangeMode: listing.exchangeMode } });
    res.status(201).json({ success: true, order });
  } catch (error) { res.status(400).json({ success: false, message: error.message || 'Richiesta non creata' }); }
});

router.get('/orders/mine', authenticate, async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find({ $or: [{ buyerId: req.userId }, { sellerId: req.userId }] }).populate('listingId', 'title status stock ownerUsername').sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, orders });
  } catch (_error) { res.status(500).json({ success: false, message: 'Impossibile recuperare le richieste' }); }
});

router.patch('/orders/:id/status', authenticate, mutationLimiter, async (req, res) => {
  try {
    const order = await MarketplaceOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Richiesta non trovata' });
    const next = String(req.body?.status || '').toUpperCase(); const userId = String(req.userId); const buyer = userId === String(order.buyerId); const seller = userId === String(order.sellerId);
    if (!buyer && !seller) return res.status(403).json({ success: false, message: 'Operazione non autorizzata' });
    let allowed = [];
    if (order.status === 'REQUESTED') allowed = seller ? ['ACCEPTED','REJECTED','CANCELLED'] : ['CANCELLED'];
    if (order.status === 'ACCEPTED') allowed = seller ? ['COMPLETED','CANCELLED'] : ['CANCELLED'];
    if (!allowed.includes(next)) return res.status(400).json({ success: false, message: 'Transizione di stato non valida' });
    if (order.status === 'REQUESTED' && next === 'ACCEPTED') {
      const listing = await MarketplaceListing.findOneAndUpdate({ _id: order.listingId, status: 'active', stock: { $gte: order.quantity } }, { $inc: { stock: -order.quantity } }, { new: true });
      if (!listing) return res.status(409).json({ success: false, message: 'Disponibilità cambiata: richiesta non accettabile' });
      if (listing.stock === 0) { listing.status = 'closed'; await listing.save(); }
    }
    if (order.status === 'ACCEPTED' && next === 'CANCELLED') await MarketplaceListing.findByIdAndUpdate(order.listingId, { $inc: { stock: order.quantity }, $set: { status: 'active' } });
    order.status = next;
    if (next === 'ACCEPTED') order.acceptedAt = new Date(); if (next === 'REJECTED') order.rejectedAt = new Date(); if (next === 'COMPLETED') order.completedAt = new Date(); if (next === 'CANCELLED') order.cancelledAt = new Date();
    await order.save(); res.json({ success: true, order });
  } catch (_error) { res.status(400).json({ success: false, message: 'Impossibile aggiornare la richiesta' }); }
});

router.get('/orders/:id/messages', authenticate, async (req, res) => {
  try {
    const order = await participantOrder(req.params.id, req.userId);
    if (order === null) return res.status(404).json({ success: false, message: 'Scambio non trovato' });
    if (order === false) return res.status(403).json({ success: false, message: 'Conversazione non autorizzata' });
    const messages = await MarketplaceMessage.find({ orderId: order._id }).sort({ createdAt: 1 }).limit(300).lean();
    await MarketplaceMessage.updateMany({ orderId: order._id, recipientId: req.userId, readAt: null }, { $set: { readAt: new Date() } });
    res.json({ success: true, messages });
  } catch (_error) { res.status(400).json({ success: false, message: 'Conversazione non disponibile' }); }
});

router.post('/orders/:id/messages', authenticate, messageLimiter, async (req, res) => {
  try {
    const order = await participantOrder(req.params.id, req.userId);
    if (order === null) return res.status(404).json({ success: false, message: 'Scambio non trovato' });
    if (order === false) return res.status(403).json({ success: false, message: 'Conversazione non autorizzata' });
    if (['REJECTED','CANCELLED'].includes(order.status)) return res.status(409).json({ success: false, message: 'La conversazione di questo scambio è chiusa' });
    const body = String(req.body?.body || '').trim();
    if (!body || body.length > 2000) return res.status(400).json({ success: false, message: 'Messaggio non valido' });
    const senderId = String(req.userId); const recipientId = senderId === String(order.buyerId) ? order.sellerId : order.buyerId;
    const message = await MarketplaceMessage.create({ orderId: order._id, senderId: req.userId, recipientId, body });
    res.status(201).json({ success: true, message });
  } catch (_error) { res.status(400).json({ success: false, message: 'Messaggio non inviato' }); }
});

router.post('/reviews', authenticate, mutationLimiter, async (req, res) => {
  try {
    const order = await MarketplaceOrder.findById(req.body?.orderId);
    if (!order || order.status !== 'COMPLETED') return res.status(400).json({ success: false, message: 'La recensione richiede uno scambio completato' });
    const userId = String(req.userId); const buyer = userId === String(order.buyerId); const seller = userId === String(order.sellerId);
    if (!buyer && !seller) return res.status(403).json({ success: false, message: 'Non puoi recensire questo scambio' });
    const score = Number(req.body?.score); if (!Number.isInteger(score) || score < 1 || score > 5) return res.status(400).json({ success: false, message: 'Punteggio non valido' });
    const review = await MarketplaceReview.create({ orderId: order._id, listingId: order.listingId, authorId: req.userId, subjectId: buyer ? order.sellerId : order.buyerId, score, comment: String(req.body?.comment || '').trim() });
    res.status(201).json({ success: true, review });
  } catch (error) { if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Hai già recensito questo scambio' }); res.status(400).json({ success: false, message: error.message || 'Recensione non salvata' }); }
});

router.get('/reputation/:userId', async (req, res) => {
  try {
    const userId = req.params.userId; const [summary] = await MarketplaceReview.aggregate([{ $match: { subjectId: new mongoose.Types.ObjectId(userId) } }, { $group: { _id: '$subjectId', average: { $avg: '$score' }, reviews: { $sum: 1 } } }]);
    const completed = await MarketplaceOrder.countDocuments({ sellerId: userId, status: 'COMPLETED' });
    res.json({ success: true, reputation: { average: summary ? Number(summary.average.toFixed(2)) : null, reviews: summary?.reviews || 0, completedSales: completed } });
  } catch (_error) { res.status(400).json({ success: false, message: 'Profilo reputazione non valido' }); }
});

router.post('/reports', authenticate, reportLimiter, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findById(req.body?.listingId); if (!listing) return res.status(404).json({ success: false, message: 'Annuncio non trovato' });
    if (String(listing.ownerId) === String(req.userId)) return res.status(400).json({ success: false, message: 'Non puoi segnalare il tuo stesso annuncio' });
    const report = await MarketplaceReport.create({ listingId: listing._id, reporterId: req.userId, reason: req.body?.reason, details: String(req.body?.details || '').trim() });
    const openReports = await MarketplaceReport.countDocuments({ listingId: listing._id, status: 'OPEN' }); res.status(201).json({ success: true, reportId: report._id, status: report.status, openReports });
  } catch (error) { if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Hai già segnalato questo annuncio' }); res.status(400).json({ success: false, message: error.message || 'Segnalazione non inviata' }); }
});

router.get('/moderation/reports', authenticate, requireModerator, async (req, res) => {
  try { const status = String(req.query?.status || 'OPEN').toUpperCase(); const query = ['OPEN','REVIEWED','RESOLVED','DISMISSED'].includes(status) ? { status } : {}; const reports = await MarketplaceReport.find(query).populate('listingId', 'title status ownerUsername category').sort({ createdAt: -1 }).limit(300).lean(); res.json({ success: true, reports }); }
  catch (_error) { res.status(500).json({ success: false, message: 'Impossibile recuperare le segnalazioni' }); }
});

router.patch('/moderation/reports/:id', authenticate, requireModerator, mutationLimiter, async (req, res) => {
  try {
    const status = String(req.body?.status || 'REVIEWED').toUpperCase(); const listingAction = String(req.body?.listingAction || 'none').toLowerCase();
    if (!['REVIEWED','RESOLVED','DISMISSED'].includes(status)) return res.status(400).json({ success: false, message: 'Stato moderazione non valido' });
    if (!['none','pause','close','activate'].includes(listingAction)) return res.status(400).json({ success: false, message: 'Azione annuncio non valida' });
    const report = await MarketplaceReport.findById(req.params.id); if (!report) return res.status(404).json({ success: false, message: 'Segnalazione non trovata' });
    if (listingAction !== 'none') await MarketplaceListing.findByIdAndUpdate(report.listingId, { $set: { status: { pause:'paused', close:'closed', activate:'active' }[listingAction] } });
    report.status = status; report.reviewedBy = req.userId; report.reviewNote = String(req.body?.reviewNote || '').trim(); report.reviewedAt = new Date(); report.listingAction = listingAction; await report.save(); res.json({ success: true, report });
  } catch (_error) { res.status(400).json({ success: false, message: 'Impossibile aggiornare la moderazione' }); }
});

module.exports = router;
