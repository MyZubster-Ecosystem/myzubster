const express = require('express');
const mongoose = require('mongoose');
const { createSyntheticKefirDemo } = require('../services/kefirPilotService');
const marketplaceHandoverRoutes = require('./marketplaceHandoverRoutes');
const MarketplaceListing = require('../models/MarketplaceListing');
const MarketplaceHandover = require('../models/MarketplaceHandover');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'MyZubster Kefir Circular Pilot',
  pilotId: 'MZ-KEFIR-PILOT-001',
  status: 'CANDIDATE_PILOT_TRACK',
  syntheticOnly: false,
  realHandoverPath: '/api/kefir-pilot/handover',
  foodOperationAuthorized: false,
  personalOrHealthDataOnChain: false,
}));

router.get('/demo', (_req, res) => {
  try {
    return res.json(createSyntheticKefirDemo());
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// Allows the authenticated owner to correct descriptive fields without replacing
// the listing ID already referenced by a real handover. Category/payment semantics
// and kefir safety acknowledgement cannot be changed through this endpoint.
router.patch('/listing/:id', authenticate, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({
      _id: req.params.id,
      ownerId: req.userId,
      category: 'kefir_culture_donation',
    });
    if (!listing) return res.status(404).json({ success: false, message: 'Annuncio kefir non trovato' });

    const updates = {};
    if (req.body?.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) return res.status(400).json({ success: false, message: 'Titolo obbligatorio' });
      updates.title = title.slice(0, 160);
    }
    if (req.body?.description !== undefined) updates.description = String(req.body.description).trim().slice(0, 4000);
    if (req.body?.location !== undefined) updates.location = String(req.body.location).trim().slice(0, 160);
    if (req.body?.handlingNotes !== undefined) updates['kefir.handlingNotes'] = String(req.body.handlingNotes).trim().slice(0, 500);

    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Nessun campo modificabile fornito' });
    const updated = await MarketplaceListing.findOneAndUpdate(
      { _id: listing._id, ownerId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    return res.json({ success: true, listing: { ...updated.toObject(), id: String(updated._id) } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || 'Impossibile correggere annuncio kefir' });
  }
});

// Recovery for a legacy duplicate-account mismatch. This is deliberately narrow:
// only a FREE gift kefir listing can be reclaimed, the authenticated username must
// match the stored ownerUsername case-insensitively, and the caller must explicitly
// provide the current ownerId. Only still-ACCEPTED handovers are reassigned; completed
// or already-confirmed evidence is never rewritten.
router.post('/listing/:id/recover-owner', authenticate, async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const listing = await MarketplaceListing.findById(req.params.id).session(session);
      if (!listing) throw Object.assign(new Error('Annuncio kefir non trovato'), { status: 404 });
      if (listing.category !== 'kefir_culture_donation' || listing.currency !== 'FREE' || listing.exchangeMode !== 'gift') {
        throw Object.assign(new Error('Recovery consentita solo per un dono gratuito di kefir'), { status: 400 });
      }
      const expectedOwnerId = String(req.body?.expectedOwnerId || '').trim();
      if (!expectedOwnerId || expectedOwnerId !== String(listing.ownerId)) {
        throw Object.assign(new Error('ownerId attuale non corrisponde: ricarica e verifica nuovamente l’annuncio'), { status: 409 });
      }
      if (String(listing.ownerId) === String(req.userId)) {
        result = { alreadyOwned: true, listing, handoversUpdated: 0 };
        return;
      }
      const currentUser = await User.findById(req.userId).select('username').session(session);
      if (!currentUser) throw Object.assign(new Error('Utente autenticato non trovato'), { status: 404 });
      const storedName = String(listing.ownerUsername || '').trim().toLocaleLowerCase('en-US');
      const currentName = String(currentUser.username || '').trim().toLocaleLowerCase('en-US');
      if (!storedName || storedName !== currentName) {
        throw Object.assign(new Error('L’username autenticato non corrisponde al proprietario legacy dell’annuncio'), { status: 403 });
      }
      const oldOwnerId = listing.ownerId;
      listing.ownerId = req.userId;
      listing.ownerUsername = currentUser.username;
      await listing.save({ session });
      const handoverUpdate = await MarketplaceHandover.updateMany(
        { listingId: listing._id, donorId: oldOwnerId, state: 'ACCEPTED' },
        { $set: { donorId: req.userId } },
        { session }
      );
      result = { alreadyOwned: false, listing, handoversUpdated: handoverUpdate.modifiedCount || 0 };
    });
    return res.json({
      success: true,
      recovered: !result.alreadyOwned,
      listingId: String(result.listing._id),
      ownerId: String(result.listing.ownerId),
      ownerUsername: result.listing.ownerUsername,
      acceptedHandoversUpdated: result.handoversUpdated,
    });
  } catch (error) {
    return res.status(error.status || 400).json({ success: false, message: error.message || 'Recovery ownership non riuscita' });
  } finally {
    await session.endSession();
  }
});

// Real, authenticated Marketplace evidence flow for a free hand-delivered kefir donation.
// This records only explicit participant confirmations. It does not create payments,
// food-safety claims, learning outcomes or blockchain evidence.
router.use('/handover', marketplaceHandoverRoutes);

module.exports = router;
