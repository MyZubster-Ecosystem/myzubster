const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const MetaverseWalletLink = require('../models/MetaverseWalletLink');
const { listWorlds, getWorld } = require('../services/metaverseRegistry');

router.get('/worlds', (_req, res) => res.json({ success: true, worlds: listWorlds(), custody: false }));

router.get('/links/mine', authenticate, async (req, res) => {
  const links = await MetaverseWalletLink.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, links });
});

// Phase 1 intentionally stores only a public wallet reference.
// It is NOT marked verified until a wallet-signature challenge is implemented and passed.
router.post('/links', authenticate, async (req, res) => {
  try {
    const world = getWorld(req.body?.worldId);
    if (!world) return res.status(400).json({ success: false, message: 'Metaverso non supportato' });
    const address = String(req.body?.address || '').trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(address)) return res.status(400).json({ success: false, message: 'Indirizzo wallet EVM non valido' });
    const link = await MetaverseWalletLink.findOneAndUpdate(
      { userId: req.userId, worldId: world.id },
      { $set: { address, network: world.network, tokenSymbol: world.token, verifiedAt: null, lastSeenAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, link, warning: 'Wallet collegato come riferimento pubblico, non ancora verificato tramite firma. Nessun fondo è custodito o trasferito.' });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Wallet già collegato a un altro account per questo metaverso' });
    res.status(400).json({ success: false, message: 'Collegamento wallet non salvato' });
  }
});

router.delete('/links/:worldId', authenticate, async (req, res) => {
  await MetaverseWalletLink.deleteOne({ userId: req.userId, worldId: String(req.params.worldId).toLowerCase() });
  res.json({ success: true });
});

module.exports = router;
