const express = require('express');
const { createSyntheticKefirDemo } = require('../services/kefirPilotService');
const marketplaceHandoverRoutes = require('./marketplaceHandoverRoutes');
const MarketplaceListing = require('../models/MarketplaceListing');
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

// Real, authenticated Marketplace evidence flow for a free hand-delivered kefir donation.
// This records only explicit participant confirmations. It does not create payments,
// food-safety claims, learning outcomes or blockchain evidence.
router.use('/handover', marketplaceHandoverRoutes);

module.exports = router;
