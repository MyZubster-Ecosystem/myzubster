const express = require('express');
const router = express.Router();
const MarketplaceListing = require('../models/MarketplaceListing');
const MarketplaceOrder = require('../models/MarketplaceOrder');
const MarketplaceReport = require('../models/MarketplaceReport');
const MarketplaceReview = require('../models/MarketplaceReview');
const { authenticate } = require('../middleware/auth');

router.post('/orders', authenticate, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({ _id: req.body?.listingId, status: 'active' });
    if (!listing) return res.status(404).json({ success: false, message: 'Annuncio non disponibile' });
    if (String(listing.ownerId) === String(req.userId)) return res.status(400).json({ success: false, message: 'Non puoi richiedere il tuo stesso annuncio' });
    const quantity = Math.max(1, Math.min(1000, Number(req.body?.quantity) || 1));
    if (listing.stock && quantity > listing.stock) return res.status(400).json({ success: false, message: 'Quantità superiore alla disponibilità' });
    const order = await MarketplaceOrder.create({
      listingId: listing._id,
      buyerId: req.userId,
      sellerId: listing.ownerId,
      quantity,
      note: String(req.body?.note || '').trim(),
      snapshot: { title: listing.title, price: listing.price, currency: listing.currency, exchangeMode: listing.exchangeMode }
    });
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Richiesta non creata' });
  }
});

router.get('/orders/mine', authenticate, async (req, res) => {
  try {
    const orders = await MarketplaceOrder.find({ $or: [{ buyerId: req.userId }, { sellerId: req.userId }] }).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, orders });
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Impossibile recuperare le richieste' });
  }
});

router.patch('/orders/:id/status', authenticate, async (req, res) => {
  try {
    const order = await MarketplaceOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Richiesta non trovata' });
    const next = String(req.body?.status || '').toUpperCase();
    const userId = String(req.userId);
    const buyer = userId === String(order.buyerId);
    const seller = userId === String(order.sellerId);
    if (!buyer && !seller) return res.status(403).json({ success: false, message: 'Operazione non autorizzata' });

    let allowed = [];
    if (order.status === 'REQUESTED') allowed = seller ? ['ACCEPTED', 'REJECTED', 'CANCELLED'] : ['CANCELLED'];
    if (order.status === 'ACCEPTED') allowed = seller ? ['COMPLETED', 'CANCELLED'] : ['CANCELLED'];
    if (!allowed.includes(next)) return res.status(400).json({ success: false, message: 'Transizione di stato non valida' });

    order.status = next;
    if (next === 'ACCEPTED') order.acceptedAt = new Date();
    if (next === 'REJECTED') order.rejectedAt = new Date();
    if (next === 'COMPLETED') order.completedAt = new Date();
    if (next === 'CANCELLED') order.cancelledAt = new Date();
    await order.save();
    res.json({ success: true, order });
  } catch (_error) {
    res.status(400).json({ success: false, message: 'Impossibile aggiornare la richiesta' });
  }
});

router.post('/reviews', authenticate, async (req, res) => {
  try {
    const order = await MarketplaceOrder.findById(req.body?.orderId);
    if (!order || order.status !== 'COMPLETED') return res.status(400).json({ success: false, message: 'La recensione richiede uno scambio completato' });
    const userId = String(req.userId);
    const buyer = userId === String(order.buyerId);
    const seller = userId === String(order.sellerId);
    if (!buyer && !seller) return res.status(403).json({ success: false, message: 'Non puoi recensire questo scambio' });
    const score = Number(req.body?.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) return res.status(400).json({ success: false, message: 'Punteggio non valido' });
    const review = await MarketplaceReview.create({
      orderId: order._id,
      listingId: order.listingId,
      authorId: req.userId,
      subjectId: buyer ? order.sellerId : order.buyerId,
      score,
      comment: String(req.body?.comment || '').trim()
    });
    res.status(201).json({ success: true, review });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Hai già recensito questo scambio' });
    res.status(400).json({ success: false, message: error.message || 'Recensione non salvata' });
  }
});

router.get('/reputation/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const [summary] = await MarketplaceReview.aggregate([
      { $match: { subjectId: new (require('mongoose').Types.ObjectId)(userId) } },
      { $group: { _id: '$subjectId', average: { $avg: '$score' }, reviews: { $sum: 1 } } }
    ]);
    const completed = await MarketplaceOrder.countDocuments({ sellerId: userId, status: 'COMPLETED' });
    res.json({ success: true, reputation: { average: summary ? Number(summary.average.toFixed(2)) : null, reviews: summary?.reviews || 0, completedSales: completed } });
  } catch (_error) {
    res.status(400).json({ success: false, message: 'Profilo reputazione non valido' });
  }
});

router.post('/reports', authenticate, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findById(req.body?.listingId);
    if (!listing) return res.status(404).json({ success: false, message: 'Annuncio non trovato' });
    if (String(listing.ownerId) === String(req.userId)) return res.status(400).json({ success: false, message: 'Non puoi segnalare il tuo stesso annuncio' });
    const report = await MarketplaceReport.create({
      listingId: listing._id,
      reporterId: req.userId,
      reason: req.body?.reason,
      details: String(req.body?.details || '').trim()
    });
    const openReports = await MarketplaceReport.countDocuments({ listingId: listing._id, status: 'OPEN' });
    res.status(201).json({ success: true, reportId: report._id, status: report.status, openReports });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Hai già segnalato questo annuncio' });
    res.status(400).json({ success: false, message: error.message || 'Segnalazione non inviata' });
  }
});

module.exports = router;
