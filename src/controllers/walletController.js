const crypto = require('crypto');
const { ethers } = require('ethers');
const Wallet = require('../models/Wallet');

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function challengeMessage({ userId, address, chainId, nonce, expiresAt }) {
  return [
    'MyZubster wallet verification',
    `User: ${userId}`,
    `Wallet: ${ethers.getAddress(address)}`,
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Expires: ${expiresAt.toISOString()}`
  ].join('\n');
}

exports.createChallenge = async (req, res) => {
  try {
    const { address, chainId } = req.body;
    if (!address || !chainId) return res.status(400).json({ success: false, message: 'address and chainId are required' });

    const normalizedAddress = ethers.getAddress(address).toLowerCase();
    const nonce = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

    const wallet = await Wallet.findOneAndUpdate(
      { userId: req.userId, address: normalizedAddress, chainId: Number(chainId) },
      { $set: { challengeNonce: nonce, challengeExpiresAt: expiresAt, verified: false } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const message = challengeMessage({ userId: req.userId, address: normalizedAddress, chainId: Number(chainId), nonce, expiresAt });
    return res.json({ success: true, address: wallet.address, chainId: wallet.chainId, message, expiresAt });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const { address, chainId, signature } = req.body;
    if (!address || !chainId || !signature) return res.status(400).json({ success: false, message: 'address, chainId and signature are required' });

    const normalizedAddress = ethers.getAddress(address).toLowerCase();
    const wallet = await Wallet.findOne({ userId: req.userId, address: normalizedAddress, chainId: Number(chainId) });
    if (!wallet || !wallet.challengeNonce || !wallet.challengeExpiresAt) {
      return res.status(404).json({ success: false, message: 'Wallet challenge not found' });
    }
    if (wallet.challengeExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ success: false, message: 'Wallet challenge expired' });
    }

    const message = challengeMessage({
      userId: req.userId,
      address: normalizedAddress,
      chainId: Number(chainId),
      nonce: wallet.challengeNonce,
      expiresAt: wallet.challengeExpiresAt
    });
    const recovered = ethers.verifyMessage(message, signature).toLowerCase();
    if (recovered !== normalizedAddress) {
      return res.status(401).json({ success: false, message: 'Firma wallet non valida' });
    }

    wallet.verified = true;
    wallet.verifiedAt = new Date();
    wallet.lastSignature = signature;
    wallet.challengeNonce = null;
    wallet.challengeExpiresAt = null;
    await wallet.save();

    return res.json({ success: true, wallet: { address: wallet.address, chainId: wallet.chainId, verified: true, verifiedAt: wallet.verifiedAt } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.listMyWallets = async (req, res) => {
  const wallets = await Wallet.find({ userId: req.userId, verified: true })
    .select('address chainId verified verifiedAt createdAt updatedAt')
    .sort({ verifiedAt: -1 })
    .lean();
  return res.json({ success: true, wallets });
};
