const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const MarketplaceListing = require('../models/MarketplaceListing');
const MarketplaceHandover = require('../models/MarketplaceHandover');

function view(handover) {
  const item = handover.toObject ? handover.toObject() : handover;
  const commitment = item.blockchainCommitment || {};
  const onchainRecorded = Boolean(commitment.network && commitment.txId && commitment.confirmedAt);
  return { ...item, id: String(item._id), listingId: String(item.listingId), donorId: String(item.donorId), recipientId: String(item.recipientId), onchainRecorded };
}

function canonicalCommitmentPayload(handover) {
  return {
    schema: 'myzubster.marketplace-handover.v1',
    handoverId: String(handover._id),
    listingId: String(handover.listingId),
    method: handover.method,
    state: handover.state,
    handedOverAt: handover.handedOverAt ? new Date(handover.handedOverAt).toISOString() : null,
    receivedAt: handover.receivedAt ? new Date(handover.receivedAt).toISOString() : null,
    recordedAt: handover.recordedAt ? new Date(handover.recordedAt).toISOString() : null
  };
}

function canonicalJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

router.post('/:listingId/accept', authenticate, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({ _id: req.params.listingId, status: 'active' }).lean();
    if (!listing) return res.status(404).json({ success: false, message: 'Annuncio non trovato' });
    if (listing.category !== 'kefir_culture_donation' || listing.currency !== 'FREE' || listing.exchangeMode !== 'gift') {
      return res.status(400).json({ success: false, message: 'Questo flusso è riservato al dono gratuito di kefir.' });
    }
    if (String(listing.ownerId) === String(req.userId)) return res.status(400).json({ success: false, message: 'Il donatore non può accettare il proprio annuncio.' });
    const handover = await MarketplaceHandover.create({ listingId: listing._id, donorId: listing.ownerId, recipientId: req.userId });
    return res.status(201).json({ success: true, paymentRequired: false, handover: view(handover) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Passaggio già accettato da questo membro.' });
    return res.status(400).json({ success: false, message: error.message || 'Impossibile accettare il passaggio' });
  }
});

router.post('/:handoverId/handed-over', authenticate, async (req, res) => {
  const handover = await MarketplaceHandover.findById(req.params.handoverId);
  if (!handover) return res.status(404).json({ success: false, message: 'Passaggio non trovato' });
  if (String(handover.donorId) !== String(req.userId)) return res.status(403).json({ success: false, message: 'Solo il donatore può confermare la consegna.' });
  if (handover.state !== 'ACCEPTED') return res.status(409).json({ success: false, message: `Stato attuale: ${handover.state}` });
  handover.state = 'HANDED_OVER'; handover.handedOverAt = new Date(); await handover.save();
  res.json({ success: true, paymentRequired: false, handover: view(handover) });
});

router.post('/:handoverId/received', authenticate, async (req, res) => {
  const handover = await MarketplaceHandover.findById(req.params.handoverId);
  if (!handover) return res.status(404).json({ success: false, message: 'Passaggio non trovato' });
  if (String(handover.recipientId) !== String(req.userId)) return res.status(403).json({ success: false, message: 'Solo il destinatario può confermare la ricezione.' });
  if (handover.state !== 'HANDED_OVER') return res.status(409).json({ success: false, message: 'La consegna deve essere confermata prima della ricezione.' });
  handover.state = 'RECEIVED'; handover.receivedAt = new Date(); await handover.save();
  res.json({ success: true, paymentRequired: false, handover: view(handover) });
});

router.post('/:handoverId/record', authenticate, async (req, res) => {
  const handover = await MarketplaceHandover.findById(req.params.handoverId);
  if (!handover) return res.status(404).json({ success: false, message: 'Passaggio non trovato' });
  const participant = [handover.donorId, handover.recipientId].some(id => String(id) === String(req.userId));
  if (!participant) return res.status(403).json({ success: false, message: 'Solo i partecipanti possono registrare il passaggio.' });
  if (handover.state !== 'RECEIVED') return res.status(409).json({ success: false, message: 'La ricezione deve essere confermata prima della registrazione.' });
  handover.state = 'RECORDED'; handover.recordedAt = new Date(); await handover.save();
  res.json({ success: true, paymentRequired: false, onchainRecorded: false, handover: view(handover) });
});

router.post('/:handoverId/prepare-blockchain-commitment', authenticate, async (req, res) => {
  const handover = await MarketplaceHandover.findById(req.params.handoverId);
  if (!handover) return res.status(404).json({ success: false, message: 'Passaggio non trovato' });
  const participant = [handover.donorId, handover.recipientId].some(id => String(id) === String(req.userId));
  if (!participant) return res.status(403).json({ success: false, message: 'Solo i partecipanti possono preparare il commitment.' });
  if (handover.state !== 'RECORDED' || !handover.recordedAt) {
    return res.status(409).json({ success: false, message: 'Il passaggio deve essere RECORDED prima di preparare il commitment.' });
  }

  const payload = canonicalCommitmentPayload(handover);
  const hash = crypto.createHash('sha256').update(canonicalJson(payload), 'utf8').digest('hex');
  handover.blockchainCommitment = {
    schema: payload.schema,
    algorithm: 'SHA-256',
    hash,
    preparedAt: new Date(),
    network: handover.blockchainCommitment?.network || null,
    txId: handover.blockchainCommitment?.txId || null,
    anchoredAt: handover.blockchainCommitment?.anchoredAt || null,
    confirmedAt: handover.blockchainCommitment?.confirmedAt || null
  };
  await handover.save();

  res.json({
    success: true,
    onchainRecorded: Boolean(handover.blockchainCommitment.network && handover.blockchainCommitment.txId && handover.blockchainCommitment.confirmedAt),
    commitment: { schema: payload.schema, algorithm: 'SHA-256', hash, payload },
    handover: view(handover)
  });
});

router.get('/:handoverId', authenticate, async (req, res) => {
  const handover = await MarketplaceHandover.findById(req.params.handoverId).lean();
  if (!handover) return res.status(404).json({ success: false, message: 'Passaggio non trovato' });
  const participant = [handover.donorId, handover.recipientId].some(id => String(id) === String(req.userId));
  if (!participant) return res.status(403).json({ success: false, message: 'Passaggio non accessibile' });
  res.json({ success: true, paymentRequired: false, handover: view(handover) });
});

module.exports = router;
