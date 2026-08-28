const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const MetaverseWalletLink = require('../models/MetaverseWalletLink');
const { listWorlds, getWorld } = require('../services/metaverseRegistry');
const { normalizeAddress, recoverPersonalSignAddress, erc20Balance } = require('../services/evmReadOnlyService');

router.get('/worlds', (_req, res) => res.json({ success: true, worlds: listWorlds(), custody: false }));

router.get('/links/mine', authenticate, async (req, res) => {
  const links = await MetaverseWalletLink.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, links });
});

router.post('/links', authenticate, async (req, res) => {
  try {
    const world = getWorld(req.body?.worldId);
    if (!world) return res.status(400).json({ success: false, message: 'Metaverso non supportato' });
    const address = normalizeAddress(req.body?.address);
    const link = await MetaverseWalletLink.findOneAndUpdate(
      { userId: req.userId, worldId: world.id },
      { $set: { address, network: world.network, tokenSymbol: world.token, verifiedAt: null, challengeNonce: null, challengeExpiresAt: null, lastSeenAt: new Date() } },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, link, warning: 'Wallet registrato come riferimento pubblico. Completa la firma per verificarne il possesso. Nessun fondo è custodito o trasferito.' });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Wallet già collegato a un altro account per questo metaverso' });
    res.status(400).json({ success: false, message: error.message || 'Collegamento wallet non salvato' });
  }
});

router.post('/links/:worldId/challenge', authenticate, async (req, res) => {
  try {
    const world = getWorld(req.params.worldId);
    if (!world) return res.status(404).json({ success: false, message: 'Metaverso non supportato' });
    const link = await MetaverseWalletLink.findOne({ userId: req.userId, worldId: world.id }).select('+challengeNonce +challengeExpiresAt');
    if (!link) return res.status(404).json({ success: false, message: 'Collega prima un wallet pubblico' });
    const nonce = crypto.randomBytes(18).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    link.challengeNonce = nonce;
    link.challengeExpiresAt = expiresAt;
    await link.save();
    const message = [
      'MyZubster wallet verification',
      `User: ${String(req.userId)}`,
      `World: ${world.id}`,
      `Wallet: ${link.address}`,
      `Nonce: ${nonce}`,
      `Expires: ${expiresAt.toISOString()}`,
      'This signature proves wallet ownership only. It does not authorize transfers, approvals or spending.'
    ].join('\n');
    res.json({ success: true, message, expiresAt, address: link.address, signingMethod: 'personal_sign' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Challenge non disponibile' });
  }
});

router.post('/links/:worldId/verify', authenticate, async (req, res) => {
  try {
    const world = getWorld(req.params.worldId);
    if (!world) return res.status(404).json({ success: false, message: 'Metaverso non supportato' });
    const link = await MetaverseWalletLink.findOne({ userId: req.userId, worldId: world.id }).select('+challengeNonce +challengeExpiresAt');
    if (!link || !link.challengeNonce || !link.challengeExpiresAt) return res.status(400).json({ success: false, message: 'Genera prima una challenge di verifica' });
    if (link.challengeExpiresAt.getTime() < Date.now()) {
      link.challengeNonce = null;
      link.challengeExpiresAt = null;
      await link.save();
      return res.status(410).json({ success: false, message: 'Challenge scaduta. Generane una nuova.' });
    }
    const message = [
      'MyZubster wallet verification',
      `User: ${String(req.userId)}`,
      `World: ${world.id}`,
      `Wallet: ${link.address}`,
      `Nonce: ${link.challengeNonce}`,
      `Expires: ${link.challengeExpiresAt.toISOString()}`,
      'This signature proves wallet ownership only. It does not authorize transfers, approvals or spending.'
    ].join('\n');
    const rpcUrl = process.env.EVM_VERIFICATION_RPC_URL || process.env.ETHEREUM_RPC_URL;
    if (!rpcUrl) return res.status(503).json({ success: false, message: 'Verifica firma non configurata: impostare EVM_VERIFICATION_RPC_URL o ETHEREUM_RPC_URL' });
    const recovered = await recoverPersonalSignAddress(rpcUrl, message, req.body?.signature);
    if (recovered !== link.address) return res.status(401).json({ success: false, message: 'La firma non appartiene al wallet collegato' });
    link.verifiedAt = new Date();
    link.verificationMethod = 'wallet-signature';
    link.challengeNonce = null;
    link.challengeExpiresAt = null;
    link.lastSeenAt = new Date();
    await link.save();
    res.json({ success: true, verified: true, worldId: world.id, address: link.address, verifiedAt: link.verifiedAt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Verifica firma non riuscita' });
  }
});

router.get('/portfolio/:worldId', authenticate, async (req, res) => {
  try {
    const world = getWorld(req.params.worldId);
    if (!world) return res.status(404).json({ success: false, message: 'Metaverso non supportato' });
    const link = await MetaverseWalletLink.findOne({ userId: req.userId, worldId: world.id }).lean();
    if (!link?.verifiedAt) return res.status(403).json({ success: false, message: 'Verifica prima il possesso del wallet' });
    const rpcUrl = process.env[world.portfolio.rpcEnv];
    if (!rpcUrl) return res.status(503).json({ success: false, configured: false, message: `${world.portfolio.rpcEnv} non configurato` });
    const balance = await erc20Balance(rpcUrl, world.portfolio.tokenContract, link.address, world.portfolio.decimals);
    res.json({
      success: true,
      custody: false,
      readOnly: true,
      world: { id: world.id, name: world.name },
      wallet: link.address,
      token: { symbol: world.token, contract: world.portfolio.tokenContract, chain: world.portfolio.chain, balance: balance.formatted, rawBalance: balance.raw },
      assets: { status: 'not-configured', message: 'NFT/LAND discovery richiede un indexer/provider dedicato e resta separato dalla verifica wallet.' }
    });
  } catch (error) {
    res.status(502).json({ success: false, message: error.message || 'Portfolio read-only non disponibile' });
  }
});

router.delete('/links/:worldId', authenticate, async (req, res) => {
  await MetaverseWalletLink.deleteOne({ userId: req.userId, worldId: String(req.params.worldId).toLowerCase() });
  res.json({ success: true });
});

module.exports = router;
